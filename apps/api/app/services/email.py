"""Email service — uses Resend in production, logs to console locally."""

import httpx
from app.config import get_settings

settings = get_settings()


async def send_verification_email(to: str, name: str, token: str) -> bool:
    """Send email verification link."""
    verify_url = f"{settings.frontend_url}/verify-email?token={token}"

    if settings.is_local:
        print(f"[EMAIL-LOCAL] Verification email for {to}")
        print(f"[EMAIL-LOCAL] Verify URL: {verify_url}")
        return True

    return await _send_via_resend(
        to=to,
        subject="Verify your DocKonvert account",
        html=f"""
        <h2>Welcome to DocKonvert, {name}!</h2>
        <p>Click the link below to verify your email address:</p>
        <p><a href="{verify_url}" style="background:#6366f1;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;">Verify Email</a></p>
        <p>Or copy this link: {verify_url}</p>
        <p>This link expires in 24 hours.</p>
        <br><p>— The DocKonvert Team (BRAMKAS INC)</p>
        """,
    )


async def send_reset_email(to: str, name: str, token: str) -> bool:
    """Send password reset link."""
    reset_url = f"{settings.frontend_url}/reset-password?token={token}"

    if settings.is_local:
        print(f"[EMAIL-LOCAL] Password reset for {to}")
        print(f"[EMAIL-LOCAL] Reset URL: {reset_url}")
        return True

    return await _send_via_resend(
        to=to,
        subject="Reset your DocKonvert password",
        html=f"""
        <h2>Password Reset</h2>
        <p>Hi {name or "there"}, we received a request to reset your password.</p>
        <p><a href="{reset_url}" style="background:#6366f1;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;">Reset Password</a></p>
        <p>Or copy this link: {reset_url}</p>
        <p>This link expires in 1 hour. If you didn't request this, ignore this email.</p>
        <br><p>— The DocKonvert Team (BRAMKAS INC)</p>
        """,
    )


async def _send_via_resend(to: str, subject: str, html: str) -> bool:
    """Send email via Resend API."""
    if not settings.resend_api_key:
        print(f"[EMAIL-WARN] No RESEND_API_KEY set, skipping email to {to}")
        return False

    async with httpx.AsyncClient() as client:
        resp = await client.post(
            "https://api.resend.com/emails",
            headers={"Authorization": f"Bearer {settings.resend_api_key}"},
            json={
                "from": settings.email_from,
                "to": [to],
                "subject": subject,
                "html": html,
            },
        )
        if resp.status_code == 200:
            return True
        print(f"[EMAIL-ERROR] Resend API error: {resp.status_code} {resp.text}")
        return False
