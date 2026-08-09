import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    # Supabase project settings (Project Settings > API)
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    SUPABASE_ANON_KEY: str = os.getenv("SUPABASE_ANON_KEY", "")
    # Service role key = server-side only, NEVER expose to frontend/APK
    SUPABASE_SERVICE_KEY: str = os.getenv("SUPABASE_SERVICE_KEY", "")

    # Firebase Cloud Messaging (free) for push notifications
    FCM_CREDENTIALS_JSON: str = os.getenv("FCM_CREDENTIALS_JSON", "")

    # CORS
    ALLOWED_ORIGINS: list = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(",")

    # Frontend URL (used for password-reset redirect links)
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:5173")

    # Committee UPI ID shown on the Finance page for receiving contributions
    UPI_ID: str = os.getenv("UPI_ID", "workerscommittee@okhdfc")

settings = Settings()
