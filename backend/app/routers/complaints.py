from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.core.security import get_current_member, require_admin
from app.core.supabase_client import get_user_client

router = APIRouter(prefix="/complaints", tags=["complaints"])


class NewComplaint(BaseModel):
    category: str
    subject: str
    description: str
    attachment_url: Optional[str] = None
    is_anonymous: bool = False
    priority: str = "normal"


@router.post("")
def register_complaint(payload: NewComplaint, current=Depends(get_current_member)):
    client = get_user_client(current["token"])
    row = client.table("complaints").insert({
        **payload.model_dump(),
        "member_id": None if payload.is_anonymous else current["member"]["id"],
    }).execute()
    return row.data[0]


@router.get("/mine")
def my_complaints(current=Depends(get_current_member)):
    client = get_user_client(current["token"])
    return client.table("complaints").select("*").eq(
        "member_id", current["member"]["id"]
    ).order("created_at", desc=True).execute().data


@router.get("/{complaint_id}/history")
def complaint_history(complaint_id: str, current=Depends(get_current_member)):
    client = get_user_client(current["token"])
    return client.table("complaint_status_history").select("*").eq(
        "complaint_id", complaint_id
    ).order("changed_at").execute().data


@router.get("/admin/all")
def all_complaints(status: Optional[str] = None, current=Depends(get_current_member)):
    require_admin(current)
    client = get_user_client(current["token"])
    q = client.table("complaints").select("*").order("created_at", desc=True)
    if status:
        q = q.eq("status", status)
    return q.execute().data


class StatusUpdate(BaseModel):
    status: str
    remarks: Optional[str] = None


@router.patch("/admin/{complaint_id}/status")
def update_status(complaint_id: str, payload: StatusUpdate, current=Depends(get_current_member)):
    require_admin(current)
    client = get_user_client(current["token"])
    client.table("complaints").update({"status": payload.status}).eq("id", complaint_id).execute()
    client.table("complaint_status_history").insert({
        "complaint_id": complaint_id,
        "status": payload.status,
        "remarks": payload.remarks,
        "changed_by": current["member"]["id"],
    }).execute()
    return {"message": "Status updated"}
