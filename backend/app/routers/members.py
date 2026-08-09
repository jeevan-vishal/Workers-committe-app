from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from pydantic import BaseModel, EmailStr
from typing import Optional
import os
from datetime import date
from app.core.security import get_current_member, require_admin
from app.core.supabase_client import admin_client, get_user_client

router = APIRouter(prefix="/members", tags=["members"])


@router.get("")
def list_members(department_id: Optional[str] = None, search: Optional[str] = None,
                  current=Depends(get_current_member)):
    client = get_user_client(current["token"])
    query = client.table("members").select("*").eq("is_active", True)
    if department_id:
        query = query.eq("department_id", department_id)
    if search:
        query = query.ilike("full_name", f"%{search}%")
    return query.execute().data


@router.get("/birthdays-today")
def birthdays_and_anniversaries_today(current=Depends(get_current_member)):
    """Used by the Home dashboard to show today's wishes."""
    client = get_user_client(current["token"])
    all_members = client.table("members").select(
        "id, full_name, full_name_ta, photo_url, date_of_birth, wedding_anniversary"
    ).eq("is_active", True).execute().data

    today = date.today()
    birthdays = [m for m in all_members if m.get("date_of_birth") and
                 _same_day(m["date_of_birth"], today)]
    anniversaries = [m for m in all_members if m.get("wedding_anniversary") and
                      _same_day(m["wedding_anniversary"], today)]
    return {"birthdays": birthdays, "anniversaries": anniversaries}


def _same_day(iso_date_str: str, today: date) -> bool:
    d = date.fromisoformat(iso_date_str)
    return d.month == today.month and d.day == today.day


class NewMemberRequest(BaseModel):
    employee_id: str
    full_name: str
    email: EmailStr
    phone: str
    temp_password: str
    department_id: Optional[str] = None
    designation: Optional[str] = None
    role: str = "member"


@router.post("/admin/add")
def add_member(payload: NewMemberRequest, current=Depends(get_current_member)):
    require_admin(current)
    # 1. Create the auth user
    created = admin_client.auth.admin.create_user({
        "email": payload.email,
        "phone": payload.phone,
        "password": payload.temp_password,
        "email_confirm": True,
    })
    # 2. Create the profile row
    admin_client.table("members").insert({
        "id": created.user.id,
        "employee_id": payload.employee_id,
        "full_name": payload.full_name,
        "email": payload.email,
        "phone": payload.phone,
        "department_id": payload.department_id,
        "designation": payload.designation,
        "role": payload.role,
    }).execute()
    return {"message": "Member added", "member_id": created.user.id}


@router.post("/photo")
async def upload_photo(file: UploadFile = File(...), current=Depends(get_current_member)):
    """Uploads the logged-in member's own profile photo to the avatars bucket."""
    contents = await file.read()
    ext = os.path.splitext(file.filename or "photo.jpg")[1].lower() or ".jpg"
    path = f"{current['member']['id']}/photo{ext}"

    admin_client.storage.from_("avatars").upload(
        path, contents, {"content-type": file.content_type, "upsert": "true"}
    )
    public_url = admin_client.storage.from_("avatars").get_public_url(path)

    admin_client.table("members").update({"photo_url": public_url}).eq(
        "id", current["member"]["id"]
    ).execute()
    return {"photo_url": public_url}


@router.delete("/admin/{member_id}")
def deactivate_member(member_id: str, current=Depends(get_current_member)):
    """Soft-delete: deactivate rather than hard-delete, to preserve history."""
    require_admin(current)
    admin_client.table("members").update({"is_active": False}).eq("id", member_id).execute()
    return {"message": "Member deactivated"}
