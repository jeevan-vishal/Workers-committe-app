from supabase import create_client, Client
from app.core.config import settings

# Admin client — bypasses RLS. Use ONLY for trusted server-side operations
# (e.g. verifying tokens, admin-triggered bulk actions). Never expose this key.
admin_client: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)


def get_user_client(access_token: str) -> Client:
    """
    Returns a Supabase client that acts AS the logged-in user, so that
    Row Level Security policies apply correctly (recommended for all
    normal reads/writes triggered by a member).
    """
    client = create_client(settings.SUPABASE_URL, settings.SUPABASE_ANON_KEY)
    client.postgrest.auth(access_token)
    return client
