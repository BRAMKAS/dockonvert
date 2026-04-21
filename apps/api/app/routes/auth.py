"""Auth routes — register, login, verify email, forgot/reset password."""

from fastapi import APIRouter, HTTPException, Depends, Header
from pydantic import BaseModel, EmailStr
from datetime import datetime, timedelta, timezone
from app.services import d1
from app.services.auth import (
    hash_password, verify_password, create_access_token, decode_access_token,
    generate_api_key, generate_verification_token, generate_reset_token,
)
from app.services.email import send_verification_email, send_reset_email
from app.config import get_settings

router = APIRouter()
settings = get_settings()


# ── Request/Response models ──

class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    accepted_terms: bool

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    password: str

class AuthResponse(BaseModel):
    token: str
    user: dict
    api_key: str | None = None


# ── Helpers ──

async def get_current_user(authorization: str = Header(None)):
    """Extract user from Bearer token."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    payload = decode_access_token(authorization[7:])
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    result = await d1.query(
        "SELECT id, email, name, avatar_url, email_verified FROM users WHERE id = ?",
        [payload["sub"]],
    )
    rows = result.get("results", [])
    if not rows:
        raise HTTPException(status_code=401, detail="User not found")
    return rows[0]


# ── Routes ──

@router.post("/register", response_model=AuthResponse)
async def register(req: RegisterRequest):
    if not req.accepted_terms:
        raise HTTPException(status_code=400, detail="You must accept the terms of service")
    if len(req.password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")

    # Check if email exists
    existing = await d1.query("SELECT id FROM users WHERE email = ?", [req.email])
    if existing.get("results"):
        raise HTTPException(status_code=409, detail="Email already registered")

    # Create user
    pw_hash = hash_password(req.password)
    verification_token = generate_verification_token()
    now = datetime.now(timezone.utc).isoformat()

    await d1.execute(
        """INSERT INTO users (email, name, password_hash, provider, accepted_terms, accepted_terms_at, reset_token)
           VALUES (?, ?, ?, 'email', 1, ?, ?)""",
        [req.email, req.name, pw_hash, now, verification_token],
    )

    # Get the created user
    result = await d1.query("SELECT id, email, name, email_verified FROM users WHERE email = ?", [req.email])
    user = result["results"][0]

    # Generate API key
    raw_key, key_hash, key_prefix = generate_api_key()
    await d1.execute(
        "INSERT INTO api_keys (user_id, key_hash, key_prefix, name) VALUES (?, ?, ?, 'Default')",
        [user["id"], key_hash, key_prefix],
    )

    # Create free subscription
    await d1.execute(
        "INSERT INTO subscriptions (user_id, plan, status) VALUES (?, 'free', 'active')",
        [user["id"]],
    )

    # Send verification email (logged locally, sent via Resend in prod)
    await send_verification_email(req.email, req.name, verification_token)

    # Auto-verify in local dev
    if settings.is_local:
        await d1.execute("UPDATE users SET email_verified = 1 WHERE id = ?", [user["id"]])
        user["email_verified"] = 1

    token = create_access_token(user["id"], user["email"])
    return AuthResponse(
        token=token,
        user=user,
        api_key=raw_key,
    )


@router.post("/login", response_model=AuthResponse)
async def login(req: LoginRequest):
    result = await d1.query(
        "SELECT id, email, name, password_hash, email_verified FROM users WHERE email = ? AND provider = 'email'",
        [req.email],
    )
    rows = result.get("results", [])
    if not rows:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    user = rows[0]
    if not verify_password(req.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    # In production, require email verification
    if not settings.is_local and not user.get("email_verified"):
        raise HTTPException(status_code=403, detail="Please verify your email before signing in")

    token = create_access_token(user["id"], user["email"])
    return AuthResponse(
        token=token,
        user={"id": user["id"], "email": user["email"], "name": user["name"], "email_verified": user["email_verified"]},
    )


@router.post("/forgot-password")
async def forgot_password(req: ForgotPasswordRequest):
    result = await d1.query("SELECT id, name FROM users WHERE email = ?", [req.email])
    rows = result.get("results", [])

    # Always return success to prevent email enumeration
    if not rows:
        return {"message": "If that email exists, we sent a reset link"}

    user = rows[0]
    token = generate_reset_token()
    expires = (datetime.now(timezone.utc) + timedelta(hours=1)).isoformat()

    await d1.execute(
        "UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE id = ?",
        [token, expires, user["id"]],
    )

    await send_reset_email(req.email, user.get("name", ""), token)
    return {"message": "If that email exists, we sent a reset link"}


@router.post("/reset-password")
async def reset_password(req: ResetPasswordRequest):
    if len(req.password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")

    result = await d1.query(
        "SELECT id, reset_token_expires FROM users WHERE reset_token = ?",
        [req.token],
    )
    rows = result.get("results", [])
    if not rows:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")

    user = rows[0]
    if user.get("reset_token_expires"):
        expires = datetime.fromisoformat(user["reset_token_expires"])
        if datetime.now(timezone.utc) > expires:
            raise HTTPException(status_code=400, detail="Reset token has expired")

    pw_hash = hash_password(req.password)
    await d1.execute(
        "UPDATE users SET password_hash = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?",
        [pw_hash, user["id"]],
    )
    return {"message": "Password reset successfully"}


@router.post("/verify-email")
async def verify_email(token: str):
    result = await d1.query("SELECT id FROM users WHERE reset_token = ?", [token])
    rows = result.get("results", [])
    if not rows:
        raise HTTPException(status_code=400, detail="Invalid verification token")

    await d1.execute(
        "UPDATE users SET email_verified = 1, reset_token = NULL WHERE id = ?",
        [rows[0]["id"]],
    )
    return {"message": "Email verified successfully"}


@router.get("/me")
async def get_me(user=Depends(get_current_user)):
    return user


@router.get("/api-keys")
async def get_api_keys(user=Depends(get_current_user)):
    """Get user's API keys (prefix only, never the full key)."""
    result = await d1.query(
        "SELECT id, key_prefix, name, is_active, last_used_at, created_at FROM api_keys WHERE user_id = ? ORDER BY created_at DESC",
        [user["id"]],
    )
    return {"keys": result.get("results", [])}


@router.post("/api-keys/regenerate")
async def regenerate_api_key(user=Depends(get_current_user)):
    """Deactivate old keys and generate a new one. Returns the raw key once."""
    # Deactivate existing keys
    await d1.execute(
        "UPDATE api_keys SET is_active = 0 WHERE user_id = ?",
        [user["id"]],
    )
    # Generate new key
    raw_key, key_hash, key_prefix = generate_api_key()
    await d1.execute(
        "INSERT INTO api_keys (user_id, key_hash, key_prefix, name) VALUES (?, ?, ?, 'Default')",
        [user["id"], key_hash, key_prefix],
    )
    return {"api_key": raw_key, "key_prefix": key_prefix}
