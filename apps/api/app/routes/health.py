from fastapi import APIRouter
import json
import os

from app.services.converter import get_supported_conversions

router = APIRouter()


@router.get("/health")
async def health_check():
    version = "0.1.0"
    version_file = os.path.join(
        os.path.dirname(__file__), "..", "..", "version.json"
    )
    try:
        with open(version_file) as f:
            version = json.load(f)["version"]
    except Exception:
        pass
    return {"status": "healthy", "service": "dockonvert-api", "version": version}


@router.get("/formats")
async def list_formats():
    """List all supported input/output formats and the conversion matrix."""
    return get_supported_conversions()
