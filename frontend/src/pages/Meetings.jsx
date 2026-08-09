import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { QRCodeSVG } from 'qrcode.react'
import { useAuth } from '../context/AuthContext'
import { api } from '../services/api'

export default function Meetings() {
  const { t } = useTranslation()
  const { member } = useAuth()
  const isAdmin = member?.role === 'admin' || member?.role === 'super_admin'
  const [meetings, setMeetings] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', agenda: '', location: '', meeting_date: '' })

  const load = () => api.getMeetings().then(setMeetings)
  useEffect(() => { load() }, [])

  async function submit(e) {
    e.preventDefault()
    await api.createMeeting({ ...form, meeting_date: new Date(form.meeting_date).toISOString() })
    setShowForm(false)
    setForm({ title: '', agenda: '', location: '', meeting_date: '' })
    load()
  }

  return (
    <div className="app-shell">
      <div className="topbar"><h1>{t('meetings')}</h1></div>

      {isAdmin && (
        <div className="card">
          <button className="btn btn-accent btn-block" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : '+ Schedule Meeting'}
          </button>
          {showForm && (
            <form onSubmit={submit} style={{ marginTop: 12 }}>
              <input className="input" placeholder="Title" required
                     value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              <input className="input" placeholder="Location" value={form.location}
                     onChange={(e) => setForm({ ...form, location: e.target.value })} />
              <input className="input" type="datetime-local" required value={form.meeting_date}
                     onChange={(e) => setForm({ ...form, meeting_date: e.target.value })} />
              <textarea className="input" rows={3} placeholder="Agenda" value={form.agenda}
                        onChange={(e) => setForm({ ...form, agenda: e.target.value })} />
              <button className="btn btn-primary btn-block">Create Meeting</button>
            </form>
          )}
        </div>
      )}

      {meetings.map((m) => (
        <div key={m.id} className="card">
          <strong style={{ fontSize: 15 }}>{m.title}</strong>
          <p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
            {new Date(m.meeting_date).toLocaleString()} {m.location ? `· ${m.location}` : ''}
          </p>
          {m.agenda && <p style={{ fontSize: 13 }}>{m.agenda}</p>}
          {isAdmin && m.qr_code_token && (
            <div style={{ textAlign: 'center', marginTop: 10 }}>
              <QRCodeSVG value={m.qr_code_token} size={140} />
              <p style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Display this for attendance check-in</p>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
