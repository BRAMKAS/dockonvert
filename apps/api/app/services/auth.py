"""Authentication helpers — JWT tokens, password hashing, API key generation."""

import secrets
import hashlib
import bcrypt
from datetime import datetime, timedelta, timezone
from jose import jwt, JWTError
from app.config import get_settings

settings = get_settings()

# ── Password ──

def hash_password(password: str) -> str:
    pw_bytes = password.encode("utf-8")[:72]
    return bcrypt.hashpw(pw_bytes, bcrypt.gensalt()).decode("utf-8")

def verify_password(plain: str, hashed: str) -> bool:
    pw_bytes = plain.encode("utf-8")[:72]
    return bcrypt.checkpw(pw_bytes, hashed.encode("utf-8"))

# ── JWT ──

ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours

def create_access_token(user_id: str, email: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {"sub": user_id, "email": email, "exp": expire}
    return jwt.encode(payload, settings.app_secret_key, algorithm="HS256")

def decode_access_token(token: str) -> dict | None:
    try:
        return jwt.decode(token, settings.app_secret_key, algorithms=["HS256"])
    except JWTError:
        return None

# ── API Keys ──

def generate_api_key() -> tuple[str, str, str]:
    """Generate an API key. Returns (raw_key, key_hash, key_prefix)."""
    raw = "dk_" + secrets.token_urlsafe(32)
    key_hash = hashlib.sha256(raw.encode()).hexdigest()
    key_prefix = raw[:11]  # dk_ + first 8 chars
    return raw, key_hash, key_prefix

def hash_api_key(raw_key: str) -> str:
    return hashlib.sha256(raw_key.encode()).hexdigest()

# ── Email verification token ──

def generate_verification_token() -> str:
    return secrets.token_urlsafe(32)

def generate_reset_token() -> str:
    return secrets.token_urlsafe(32)
