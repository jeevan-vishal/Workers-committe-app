from fastapi import Header, HTTPException, status
from app.core.supabase_client import admin_client


async def get_current_member(authorization: str = Header(...)):
    """
    Extracts and verifies the Supabase JWT sent as:
      Authorization: Bearer <access_token>
    Returns the member's row from the `members` table (includes role).
    """
    if not authorization.startswith("Bearer "):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Missing bearer token")

    token = authorization.split(" ", 1)[1]
    try:
        user_response = admin_client.auth.get_user(token)
        user = user_response.user
        if not user:
            raise ValueError("No user")
    except Exception:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid or expired session")

    member = (
        admin_client.table("members")
        .select("*")
        .eq("id", user.id)
        .single()
        .execute()
    )
    if not member.data:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Member profile not found")

    return {"token": token, "auth_user": user, "member": member.data}


def require_admin(current=None):
    """Call after get_current_member; raises 403 if not admin/super_admin."""
    if current["member"]["role"] not in ("admin", "super_admin"):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Admin access required")
    return current
