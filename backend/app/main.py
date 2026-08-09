from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.routers import auth, members, announcements, complaints, meetings, documents, finance, notifications

app = FastAPI(
    title="Workers Committee & Employees API",
    version="1.0.0",
    description="Backend API for the Workers Committee mobile/web app. "
                 "Data lives in Supabase (Postgres + Auth + Storage, free tier).",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(members.router)
app.include_router(announcements.router)
app.include_router(complaints.router)
app.include_router(meetings.router)
app.include_router(documents.router)
app.include_router(finance.router)
app.include_router(notifications.router)


@app.get("/")
def health_check():
    return {"status": "ok", "service": "workers-committee-api"}
