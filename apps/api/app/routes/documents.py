"""Document history routes."""

from fastapi import APIRouter, Depends, HTTPException
from app.routes.auth import get_current_user
from app.services import d1

router = APIRouter()


@router.get("/documents")
async def list_documents(user=Depends(get_current_user)):
    """List user's conversion history."""
    result = await d1.query(
        """SELECT id, input_filename, input_content_type, input_size_bytes,
                  output_filename, output_content_type, output_size_bytes,
                  conversion_type, status, error_message, expires_at, created_at
           FROM documents
           WHERE user_id = ?
           ORDER BY created_at DESC
           LIMIT 100""",
        [user["id"]],
    )
    return {"documents": result.get("results", [])}
