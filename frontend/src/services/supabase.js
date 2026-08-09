const API_BASE = import.meta.env.VITE_API_BASE_URL || ''
const STORAGE_KEY = 'workers_committee_session'

const listeners = new Set()

function decodeToken(token) {
  try {
    const part = token.split('.')[1]
    const json = atob(part.replace(/-/g, '+').replace(/_/g, '/'))
    return JSON.parse(decodeURIComponent(escape(json)))
  } catch {
    return null
  }
}

function readSession() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY))
  } catch {
    return null
  }
}

function emit(event, session) {
  listeners.forEach((cb) => cb(event, session))
}

function buildSession(accessToken, refreshToken) {
  const payload = decodeToken(accessToken) || {}
  return {
    access_token: accessToken,
    refresh_token: refreshToken,
    user: {
      id: payload.sub,
      email: payload.email || null,
      role: payload.role || null,
    },
    expires_at: payload.exp ? payload.exp * 1000 : Date.now() + 7 * 24 * 3600 * 1000,
  }
}

const authStub = {
  async getSession() {
    return { data: { session: readSession() }, error: null }
  },
  onAuthStateChange(callback) {
    listeners.add(callback)
    const session = readSession()
    if (session) callback('SIGNED_IN', session)
    return { data: { subscription: { unsubscribe: () => listeners.delete(callback) } } }
  },
  async setSession({ access_token, refresh_token }) {
    const session = buildSession(access_token, refresh_token)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
    emit('SIGNED_IN', session)
    return { data: { session }, error: null }
  },
  async signOut() {
    localStorage.removeItem(STORAGE_KEY)
    emit('SIGNED_OUT', null)
    return { error: null }
  },
}

async function fetchProfile() {
  const session = readSession()
  const token = session?.access_token
  const res = await fetch(`${API_BASE}/api/members/me`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  if (!res.ok) return { data: null, error: new Error('Could not load profile') }
  return { data: await res.json(), error: null }
}

export const supabase = {
  auth: authStub,
  from(table) {
    return {
      select() {
        return {
          eq() {
            return {
              single() {
                if (table === 'members') return fetchProfile()
                return Promise.resolve({ data: null, error: null })
              },
            }
          },
        }
      },
    }
  },
}
