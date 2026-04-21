"""R2 storage client — talks to local miniflare or real R2 via S3-compatible API."""

import httpx
import boto3
from app.config import get_settings

settings = get_settings()


def _s3_client():
    """Real R2 via boto3 S3-compatible client (production)."""
    return boto3.client(
        "s3",
        endpoint_url=settings.r2_endpoint,
        aws_access_key_id=settings.r2_access_key_id,
        aws_secret_access_key=settings.r2_secret_access_key,
        region_name="auto",
    )


async def upload(key: str, data: bytes, content_type: str = "application/octet-stream") -> str:
    """Upload a file. Returns the key."""
    if settings.is_local:
        async with httpx.AsyncClient(timeout=30.0) as client:
            await client.put(
                f"{settings.r2_base_url}/{key}",
                content=data,
                headers={"Content-Type": content_type},
            )
    else:
        s3 = _s3_client()
        s3.put_object(
            Bucket=settings.r2_bucket_name,
            Key=key,
            Body=data,
            ContentType=content_type,
        )
    return key


async def download(key: str) -> tuple[bytes, str]:
    """Download a file. Returns (data, content_type)."""
    if settings.is_local:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.get(f"{settings.r2_base_url}/{key}")
            resp.raise_for_status()
            content_type = resp.headers.get("content-type", "application/octet-stream")
            return resp.content, content_type
    else:
        s3 = _s3_client()
        obj = s3.get_object(Bucket=settings.r2_bucket_name, Key=key)
        return obj["Body"].read(), obj["ContentType"]


async def delete(key: str) -> None:
    """Delete a file."""
    if settings.is_local:
        async with httpx.AsyncClient(timeout=30.0) as client:
            await client.delete(f"{settings.r2_base_url}/{key}")
    else:
        s3 = _s3_client()
        s3.delete_object(Bucket=settings.r2_bucket_name, Key=key)


async def list_objects(prefix: str = "") -> list[dict]:
    """List objects, optionally filtered by prefix."""
    if settings.is_local:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.get(settings.r2_base_url)
            resp.raise_for_status()
            data = resp.json()
            objects = data.get("objects", [])
            if prefix:
                objects = [o for o in objects if o["key"].startswith(prefix)]
            return objects
    else:
        s3 = _s3_client()
        resp = s3.list_objects_v2(Bucket=settings.r2_bucket_name, Prefix=prefix)
        return [{"key": o["Key"], "size": o["Size"]} for o in resp.get("Contents", [])]
