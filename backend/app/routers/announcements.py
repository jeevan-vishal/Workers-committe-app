from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional
from app.core.security import get_current_member, require_admin
from app.core.supabase_client import get_user_client
from app.routers.notifications import send_push_to_all

router = APIRouter(prefix="/announcements", tags=["announcements"])


@router.get("")
def list_announcements(category: Optional[str] = None, current=Depends(get_current_member)):
    client = get_user_client(current["token"])
    q = client.table("announcements").select("*").order("published_at", desc=True)
    if category:
        q = q.eq("category", category)
    return q.execute().data


class NewAnnouncement(BaseModel):
    title: str
    title_ta: Optional[str] = None
    body: str
    body_ta: Optional[str] = None
    category: str = "general"
    attachment_url: Optional[str] = None
    notify_push: bool = True


@router.post("/admin/publish")
def publish_announcement(payload: NewAnnouncement, current=Depends(get_current_member)):
    require_admin(current)
    client = get_user_client(current["token"])
    row = client.table("announcements").insert({
        **payload.model_dump(exclude={"notify_push"}),
        "created_by": current["member"]["id"],
    }).execute()

    if payload.notify_push:
        send_push_to_all(title=payload.title, body=payload.body)

    return row.data[0]
