import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../services/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [member, setMember] = useState(null)
  const [loading, setLoading] = useState(true)
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light')

  const refreshMember = async () => {
    if (!session) return
    const { data } = await supabase.from('members').select('*').eq('id', session.user.id).single()
    setMember(data)
  }

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    async function loadProfile() {
      if (!session) { setMember(null); return }
      const { data } = await supabase.from('members').select('*').eq('id', session.user.id).single()
      setMember(data)
    }
    loadProfile()
  }, [session])

  const signOut = async () => {
    await supabase.auth.signOut()
    setSession(null)
    setMember(null)
  }

  return (
    <AuthContext.Provider value={{ session, member, loading, signOut, theme, setTheme, refreshMember }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
