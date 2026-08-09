import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api } from '../services/api'

export default function ResetPassword() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const token = new URLSearchParams(window.location.hash.slice(1)).get('access_token')
  const [pw, setPw] = useState('')
  const [pw2, setPw2] = useState('')
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  async function submit(e) {
    e.preventDefault()
    if (pw !== pw2) { setMsg(t('password_mismatch')); return }
    setLoading(true); setMsg('')
    try {
      await api.confirmPasswordReset(token, pw)
      setDone(true)
    } catch (err) {
      setMsg(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="app-shell" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '100vh' }}>
        <div className="card">
          <p>{t('invalid_reset_link')}</p>
          <button className="btn btn-accent btn-block" onClick={() => navigate('/')}>{t('go_to_login')}</button>
        </div>
      </div>
    )
  }

  if (done) {
    return (
      <div className="app-shell" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '100vh' }}>
        <div className="card">
          <p>{t('password_updated')}</p>
          <button className="btn btn-accent btn-block" onClick={() => { window.location.hash = ''; navigate('/') }}>
            {t('go_to_login')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="app-shell" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '100vh' }}>
      <div style={{ padding: '0 24px' }}>
        <h1 className="display" style={{ fontSize: 26, textAlign: 'center' }}>{t('set_new_password')}</h1>
        {msg && <p style={{ color: 'var(--color-danger)', fontSize: 13 }}>{msg}</p>}
        <form onSubmit={submit}>
          <input className="input" type="password" placeholder={t('new_password')} required
                 value={pw} onChange={(e) => setPw(e.target.value)} />
          <input className="input" type="password" placeholder={t('confirm_password')} required
                 value={pw2} onChange={(e) => setPw2(e.target.value)} />
          <button className="btn btn-accent btn-block" disabled={loading}>{loading ? '...' : t('update_password')}</button>
        </form>
      </div>
    </div>
  )
}
