"""D1 database client — talks to local miniflare or Cloudflare REST API."""

import httpx
from app.config import get_settings

settings = get_settings()


async def _client() -> httpx.AsyncClient:
    return httpx.AsyncClient(timeout=30.0)


async def query(sql: str, params: list | None = None) -> dict:
    """Execute a SELECT query and return rows."""
    async with await _client() as client:
        if settings.is_local:
            resp = await client.post(
                f"{settings.d1_base_url}/query",
                json={"sql": sql, "params": params or []},
            )
        else:
            resp = await client.post(
                f"https://api.cloudflare.com/client/v4/accounts/{settings.cf_account_id}/d1/database/{settings.d1_database_id}/query",
                headers={"Authorization": f"Bearer {settings.cf_api_token}"},
                json={"sql": sql, "params": params or []},
            )
        resp.raise_for_status()
        return resp.json()


async def execute(sql: str, params: list | None = None) -> dict:
    """Execute an INSERT/UPDATE/DELETE statement."""
    async with await _client() as client:
        if settings.is_local:
            resp = await client.post(
                f"{settings.d1_base_url}/execute",
                json={"sql": sql, "params": params or []},
            )
        else:
            resp = await client.post(
                f"https://api.cloudflare.com/client/v4/accounts/{settings.cf_account_id}/d1/database/{settings.d1_database_id}/query",
                headers={"Authorization": f"Bearer {settings.cf_api_token}"},
                json={"sql": sql, "params": params or []},
            )
        resp.raise_for_status()
        return resp.json()


async def batch(statements: list[dict]) -> list[dict]:
    """Execute multiple statements in a batch."""
    async with await _client() as client:
        if settings.is_local:
            resp = await client.post(
                f"{settings.d1_base_url}/batch",
                json={"statements": statements},
            )
        else:
            resp = await client.post(
                f"https://api.cloudflare.com/client/v4/accounts/{settings.cf_account_id}/d1/database/{settings.d1_database_id}/query",
                headers={"Authorization": f"Bearer {settings.cf_api_token}"},
                json={"sql": statements},
            )
        resp.raise_for_status()
        return resp.json()
