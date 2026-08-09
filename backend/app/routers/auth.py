from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.core.config import settings
from app.core.supabase_client import admin_client

router = APIRouter(prefix="/auth", tags=["auth"])


class EmployeeLoginRequest(BaseModel):
    employee_id: str
    password: str


class OtpRequestModel(BaseModel):
    phone: str          # e.g. "+919876543210"


class OtpVerifyModel(BaseModel):
    phone: str
    token: str           # 6-digit OTP code


class ResetPasswordRequest(BaseModel):
    employee_id: Optional[str] = None
    email: Optional[str] = None


class ResetPasswordConfirmRequest(BaseModel):
    access_token: str
    new_password: str


@router.post("/login/employee-id")
def login_with_employee_id(payload: EmployeeLoginRequest):
    """
    Employee ID login: employee_id is mapped to the member's registered
    email internally, then normal Supabase email+password auth runs.
    """
    lookup = (
        admin_client.table("members")
        .select("email, employee_id, is_active")
        .eq("employee_id", payload.employee_id)
        .single()
        .execute()
    )
    if not lookup.data or not lookup.data.get("email"):
        raise HTTPException(404, "Employee ID not found")
    if not lookup.data["is_active"]:
        raise HTTPException(403, "Account is deactivated. Contact admin.")

    try:
        result = admin_client.auth.sign_in_with_password(
            {"email": lookup.data["email"], "password": payload.password}
        )
    except Exception:
        raise HTTPException(401, "Incorrect Employee ID or password")

    return {
        "access_token": result.session.access_token,
        "refresh_token": result.session.refresh_token,
        "user_id": result.user.id,
    }


@router.post("/login/otp/request")
def request_otp(payload: OtpRequestModel):
    """Sends a 6-digit SMS OTP via Supabase Auth (Twilio provider on free tier trial)."""
    try:
        admin_client.auth.sign_in_with_otp({"phone": payload.phone})
    except Exception as e:
        raise HTTPException(400, f"Could not send OTP: {e}")
    return {"message": "OTP sent"}


@router.post("/login/otp/verify")
def verify_otp(payload: OtpVerifyModel):
    try:
        result = admin_client.auth.verify_otp(
            {"phone": payload.phone, "token": payload.token, "type": "sms"}
        )
    except Exception:
        raise HTTPException(401, "Invalid or expired OTP")

    return {
        "access_token": result.session.access_token,
        "refresh_token": result.session.refresh_token,
        "user_id": result.user.id,
    }


@router.post("/reset-password")
def reset_password(payload: ResetPasswordRequest):
    """
    Generates a password-reset (recovery) link for a member, looked up by
    employee_id or email. Returns the link so the frontend can show it
    (swap in Supabase's own email provider later to email it directly).
    """
    if not payload.email and not payload.employee_id:
        raise HTTPException(400, "Provide an email or employee ID")

    email = payload.email
    if not email:
        lookup = (
            admin_client.table("members")
            .select("email")
            .eq("employee_id", payload.employee_id)
            .single()
            .execute()
        )
        if not lookup.data or not lookup.data.get("email"):
            raise HTTPException(404, "Account not found")
        email = lookup.data["email"]

    try:
        link = admin_client.auth.admin.generate_link({
            "type": "recovery",
            "email": email,
            "redirect_to": f"{settings.FRONTEND_URL}/reset-password",
        })
    except Exception as e:
        raise HTTPException(400, f"Could not generate reset link: {e}")

    action_link = link.get("action_link") if isinstance(link, dict) else getattr(link, "action_link", "")
    return {"message": "Reset link generated", "recovery_link": action_link}


@router.post("/reset-password/confirm")
def confirm_reset_password(payload: ResetPasswordConfirmRequest):
    """Sets a new password using the recovery JWT from the reset link."""
    try:
        user = admin_client.auth.get_user(payload.access_token)
        admin_client.auth.admin.update_user_by_id(user.id, {"password": payload.new_password})
    except Exception:
        raise HTTPException(400, "Invalid or expired reset link")
    return {"message": "Password updated"}


@router.post("/logout")
def logout():
    # Client should discard tokens locally; Supabase session revocation
    # happens via admin_client.auth.admin.sign_out(token) if needed server-side.
    return {"message": "Logged out"}
