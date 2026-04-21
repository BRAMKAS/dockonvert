"""Simple synchronous conversion endpoints (backwards compatible).
For async jobs with pipelines, use /api/v1/jobs instead.
"""

import io
from pathlib import Path

from fastapi import APIRouter, UploadFile, File, HTTPException, Header
from fastapi.responses import StreamingResponse

from app.config import get_settings
from app.services import d1
from app.services.auth import decode_access_token, hash_api_key
from app.services.converter import convert, can_convert, EXT_TO_MIME, OUTPUT_META

router = APIRouter()
settings = get_settings()

MAX_SIZE = settings.max_file_size_mb * 1024 * 1024


def resolve_content_type(file: UploadFile) -> str:
    """Resolve content type, falling back to extension-based detection."""
    ct = file.content_type
    if ct and ct != "application/octet-stream":
        return ct
    ext = Path(file.filename or "").suffix.lower()
    return EXT_TO_MIME.get(ext, ct or "application/octet-stream")


async def validate_auth(x_api_key: str | None, authorization: str | None) -> str:
    """Accept either X-API-Key or Bearer token. Returns user_id."""
    if x_api_key:
        key_hash = hash_api_key(x_api_key)
        result = await d1.query(
            "SELECT id, user_id FROM api_keys WHERE key_hash = ? AND is_active = 1", [key_hash]
        )
        if not result.get("results"):
            raise HTTPException(status_code=401, detail="Invalid API key")
        return result["results"][0]["user_id"]

    if authorization and authorization.startswith("Bearer "):
        payload = decode_access_token(authorization[7:])
        if payload:
            return payload["sub"]

    raise HTTPException(status_code=401, detail="API key or Bearer token required.")


# ── Legacy endpoints (backwards compatible) ──

@router.post("/convert/markdown")
async def to_markdown(
    file: UploadFile = File(...),
    x_api_key: str = Header(None, alias="X-API-Key"),
    authorization: str = Header(None),
):
    """Convert a document to Markdown."""
    return await _convert_file(file, "markdown", x_api_key, authorization)


@router.post("/convert/pdf")
async def to_pdf(
    file: UploadFile = File(...),
    x_api_key: str = Header(None, alias="X-API-Key"),
    authorization: str = Header(None),
):
    """Convert a document to PDF."""
    return await _convert_file(file, "pdf", x_api_key, authorization)


# ── Universal endpoint ──

@router.post("/convert/{output_format}")
async def convert_universal(
    output_format: str,
    file: UploadFile = File(...),
    x_api_key: str = Header(None, alias="X-API-Key"),
    authorization: str = Header(None),
):
    """Convert a document to any supported format.

    Supported output formats: markdown, pdf, html, txt, docx, csv
    """
    if output_format not in OUTPUT_META:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported output format: {output_format}. Supported: {', '.join(sorted(OUTPUT_META.keys()))}",
        )
    return await _convert_file(file, output_format, x_api_key, authorization)


async def _convert_file(file: UploadFile, output_format: str, x_api_key: str | None, authorization: str | None):
    """Shared conversion logic for all endpoints."""
    user_id = await validate_auth(x_api_key, authorization)

    content_type = resolve_content_type(file)
    ext = Path(file.filename or "").suffix.lower()

    if not can_convert(ext, output_format):
        raise HTTPException(
            status_code=415,
            detail=f"Cannot convert {ext} to {output_format}",
        )

    content = await file.read()
    if len(content) > MAX_SIZE:
        raise HTTPException(status_code=413, detail=f"File exceeds {settings.max_file_size_mb}MB limit.")

    try:
        result_bytes, output_filename, output_ct = await convert(
            content, file.filename, content_type, output_format
        )

        # Log to D1
        await d1.execute(
            """INSERT INTO documents (user_id, input_filename, input_r2_key, input_content_type, input_size_bytes,
                output_filename, output_content_type, output_size_bytes, conversion_type, status)
               VALUES (?, ?, '', ?, ?, ?, ?, ?, ?, 'completed')""",
            [user_id, file.filename, content_type, len(content),
             output_filename, output_ct, len(result_bytes), f"to_{output_format}"],
        )

        return StreamingResponse(
            io.BytesIO(result_bytes),
            media_type=output_ct,
            headers={"Content-Disposition": f'attachment; filename="{output_filename}"'},
        )
    except HTTPException:
        raise
    except Exception as e:
        await d1.execute(
            """INSERT INTO documents (user_id, input_filename, input_r2_key, input_content_type, input_size_bytes,
                conversion_type, status, error_message)
               VALUES (?, ?, '', ?, ?, ?, 'failed', ?)""",
            [user_id, file.filename, content_type, len(content), f"to_{output_format}", str(e)],
        )
        raise HTTPException(status_code=500, detail=f"Conversion failed: {str(e)}")
