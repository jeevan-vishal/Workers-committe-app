import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { api } from '../services/api'
import { supabase } from '../services/supabase'
import logo from '../assets/logo.jpg'

export default function Login() {
  const { t } = useTranslation()
  const [mode, setMode] = useState('employee') // 'employee' | 'otp'
  const [employeeId, setEmployeeId] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showReset, setShowReset] = useState(false)
  const [resetField, setResetField] = useState('')
  const [resetMsg, setResetMsg] = useState('')
  const [resetLink, setResetLink] = useState('')
  const [resetting, setResetting] = useState(false)

  async function handleEmployeeLogin(e) {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      const result = await api.loginEmployeeId(employeeId, password)
      await supabase.auth.setSession({
        access_token: result.access_token,
        refresh_token: result.refresh_token,
      })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleSendOtp(e) {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      await api.requestOtp(phone)
      setOtpSent(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleVerifyOtp(e) {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      const result = await api.verifyOtp(phone, otp)
      await supabase.auth.setSession({
        access_token: result.access_token,
        refresh_token: result.refresh_token,
      })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleResetPassword(e) {
    e.preventDefault()
    setResetMsg(''); setResetLink(''); setResetting(true)
    try {
      const isEmail = resetField.includes('@')
      const result = await api.requestPasswordReset(
        isEmail ? { email: resetField } : { employee_id: resetField }
      )
      setResetMsg(t('reset_link_sent'))
      setResetLink(result.recovery_link)
    } catch (err) {
      setResetMsg(err.message)
    } finally {
      setResetting(false)
    }
  }

  return (
    <div className="app-shell" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '100vh' }}>
      <div style={{ padding: '0 24px' }}>
        <h1 className="display" style={{ fontSize: 36, textAlign: 'center' }}>{t('app_name')}</h1>
        <img src={logo} alt="Logo" style={{ width: 250, height: 250, objectFit: 'contain', display: 'block', margin: '20px auto 30px', borderRadius: 12 }} />
        <p style={{ color: 'var(--color-text-muted)', marginBottom: 24 }}>{t('welcome_back')}</p>

        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <button className={`btn ${mode === 'employee' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setMode('employee')}>
            {t('employee_id')}
          </button>
          <button className={`btn ${mode === 'otp' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setMode('otp')}>
            {t('login_with_otp')}
          </button>
        </div>

        {error && <p style={{ color: 'var(--color-danger)', fontSize: 13 }}>{error}</p>}

        {mode === 'employee' && (
          <form onSubmit={handleEmployeeLogin}>
            <input className="input" placeholder={t('employee_id')} value={employeeId}
                   onChange={(e) => setEmployeeId(e.target.value)} required />
            <input className="input" type="password" placeholder={t('password')} value={password}
                   onChange={(e) => setPassword(e.target.value)} required />
            <button className="btn btn-accent btn-block" disabled={loading}>{loading ? '...' : t('login')}</button>
            <button type="button" className="btn btn-outline btn-block" style={{ marginTop: 8 }}
                    onClick={() => setShowReset(!showReset)}>
              {t('forgot_password')}
            </button>
          </form>
        )}

        {showReset && (
          <form className="card" style={{ marginTop: 8 }} onSubmit={handleResetPassword}>
            <input className="input" placeholder={t('reset_email_or_id')} value={resetField}
                   onChange={(e) => setResetField(e.target.value)} required />
            <button className="btn btn-accent btn-block" disabled={resetting}>{resetting ? '...' : t('send_reset_link')}</button>
            {resetMsg && <p style={{ color: 'var(--color-danger)', fontSize: 13, marginTop: 8 }}>{resetMsg}</p>}
            {resetLink && (
              <a href={resetLink} style={{ display: 'block', fontSize: 13, marginTop: 8, wordBreak: 'break-all' }}>
                {t('open_reset_link')}
              </a>
            )}
          </form>
        )}

        {mode === 'otp' && !otpSent && (
          <form onSubmit={handleSendOtp}>
            <input className="input" placeholder="+91XXXXXXXXXX" value={phone}
                   onChange={(e) => setPhone(e.target.value)} required />
            <button className="btn btn-accent btn-block" disabled={loading}>{loading ? '...' : 'Send OTP'}</button>
          </form>
        )}

        {mode === 'otp' && otpSent && (
          <form onSubmit={handleVerifyOtp}>
            <input className="input" placeholder="6-digit OTP" value={otp}
                   onChange={(e) => setOtp(e.target.value)} required maxLength={6} />
            <button className="btn btn-accent btn-block" disabled={loading}>{loading ? '...' : t('login')}</button>
          </form>
        )}
      </div>
    </div>
  )
}
