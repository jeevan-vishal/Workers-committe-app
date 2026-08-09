import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Camera } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { api } from '../services/api'

export default function Settings() {
  const { t, i18n } = useTranslation()
  const { member, signOut, theme, setTheme, refreshMember } = useAuth()
  const fileRef = useRef(null)
  const [photo, setPhoto] = useState(member?.photo_url || '')
  const [uploading, setUploading] = useState(false)
  const [msg, setMsg] = useState('')
  const [isError, setIsError] = useState(false)

  async function onPick(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true); setMsg('')
    try {
      const fd = new FormData()
      fd.append('file', file)
      const result = await api.uploadPhoto(fd)
      setPhoto(result.photo_url)
      await refreshMember()
      setMsg(t('photo_updated')); setIsError(false)
    } catch (err) {
      setMsg(err.message); setIsError(true)
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  function changeLanguage(lang) {
    i18n.changeLanguage(lang)
    localStorage.setItem('lang', lang)
  }

  return (
    <div className="app-shell">
      <div className="topbar"><h1>{t('settings')}</h1></div>

      <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 56, height: 56, borderRadius: '50%', background: 'var(--color-primary)',
          color: 'var(--color-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 700, fontSize: 20, overflow: 'hidden', position: 'relative',
        }}>
          {photo ? <img src={photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : member?.full_name?.[0]}
        </div>
        <div style={{ flex: 1 }}>
          <strong>{member?.full_name}</strong>
          <p style={{ fontSize: 12, color: 'var(--color-text-muted)', margin: '2px 0 0' }}>
            {member?.employee_id} · {member?.designation}
          </p>
        </div>
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={onPick} />
        <button className="btn btn-outline" style={{ fontSize: 12, padding: '6px 10px' }}
                disabled={uploading} onClick={() => fileRef.current?.click()}>
          <Camera size={14} /> {uploading ? '...' : t('change_photo')}
        </button>
      </div>
      {msg && <p style={{ color: isError ? 'var(--color-danger)' : 'var(--color-primary)', fontSize: 13, padding: '0 16px' }}>{msg}</p>}

      <div className="card">
        <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>{t('language')}</p>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className={`btn ${i18n.language === 'en' ? 'btn-primary' : 'btn-outline'}`} onClick={() => changeLanguage('en')}>English</button>
          <button className={`btn ${i18n.language === 'ta' ? 'btn-primary' : 'btn-outline'}`} onClick={() => changeLanguage('ta')}>தமிழ்</button>
        </div>
      </div>

      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p style={{ fontSize: 13, fontWeight: 600, margin: 0 }}>{t('dark_mode')}</p>
        <button className={`btn ${theme === 'dark' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
          {theme === 'dark' ? 'On' : 'Off'}
        </button>
      </div>

      <div className="card">
        <button className="btn btn-outline btn-block" onClick={signOut} style={{ color: 'var(--color-danger)' }}>
          Sign Out
        </button>
      </div>
    </div>
  )
}
