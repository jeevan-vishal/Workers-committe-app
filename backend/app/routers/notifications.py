from fastapi import APIRouter, Depends
from pydantic import BaseModel
import json
from app.core.security import get_current_member, require_admin
from app.core.supabase_client import admin_client
from app.core.config import settings

router = APIRouter(prefix="/notifications", tags=["notifications"])

_firebase_app = None


def _init_firebase():
    """Lazy-init Firebase Admin SDK (free tier: unlimited FCM push)."""
    global _firebase_app
    if _firebase_app is None and settings.FCM_CREDENTIALS_JSON:
        import firebase_admin
        from firebase_admin import credentials
        cred = credentials.Certificate(json.loads(settings.FCM_CREDENTIALS_JSON))
        _firebase_app = firebase_admin.initialize_app(cred)
    return _firebase_app


class RegisterTokenRequest(BaseModel):
    token: str
    platform: str = "android"


@router.post("/register-token")
def register_push_token(payload: RegisterTokenRequest, current=Depends(get_current_member)):
    admin_client.table("push_tokens").upsert({
        "member_id": current["member"]["id"],
        "token": payload.token,
        "platform": payload.platform,
    }).execute()
    return {"message": "Token registered"}


def send_push_to_all(title: str, body: str):
    """Fan-out push notification to every registered device token."""
    if not _init_firebase():
        return  # FCM not configured yet — safe no-op in dev
    from firebase_admin import messaging

    tokens = [r["token"] for r in admin_client.table("push_tokens").select("token").execute().data]
    if not tokens:
        return

    for i in range(0, len(tokens), 500):  # FCM batch limit
        batch = tokens[i:i + 500]
        message = messaging.MulticastMessage(
            notification=messaging.Notification(title=title, body=body),
            tokens=batch,
        )
        messaging.send_multicast(message)

    admin_client.table("notification_log").insert({
        "title": title, "body": body, "target": "all",
    }).execute()


class ManualPush(BaseModel):
    title: str
    body: str


@router.post("/admin/send")
def send_manual_push(payload: ManualPush, current=Depends(get_current_member)):
    require_admin(current)
    send_push_to_all(payload.title, payload.body)
    return {"message": "Notification sent"}
