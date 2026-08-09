from fastapi import APIRouter, Depends, UploadFile, File, Form
from typing import Optional
import uuid
from app.core.security import get_current_member, require_admin
from app.core.supabase_client import get_user_client, admin_client

router = APIRouter(prefix="/documents", tags=["documents"])

BUCKET = "documents"


@router.get("")
def list_documents(category: Optional[str] = None, search: Optional[str] = None,
                    current=Depends(get_current_member)):
    client = get_user_client(current["token"])
    q = client.table("documents").select("*").order("uploaded_at", desc=True)
    if category:
        q = q.eq("category", category)
    if search:
        q = q.ilike("title", f"%{search}%")
    return q.execute().data


@router.post("/admin/upload")
async def upload_document(
    title: str = Form(...),
    title_ta: Optional[str] = Form(None),
    category: str = Form("circular"),
    file: UploadFile = File(...),
    current=Depends(get_current_member),
):
    require_admin(current)
    contents = await file.read()
    path = f"{category}/{uuid.uuid4()}_{file.filename}"

    admin_client.storage.from_(BUCKET).upload(
        path, contents, {"content-type": file.content_type}
    )
    public_url = admin_client.storage.from_(BUCKET).get_public_url(path)

    row = admin_client.table("documents").insert({
        "title": title,
        "title_ta": title_ta,
        "category": category,
        "file_url": public_url,
        "file_size_kb": round(len(contents) / 1024),
        "uploaded_by": current["member"]["id"],
    }).execute()
    return row.data[0]
