import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import { api } from '../services/api'

export default function Announcements() {
  const { t } = useTranslation()
  const { member } = useAuth()
  const isAdmin = member?.role === 'admin' || member?.role === 'super_admin'
  const [list, setList] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', body: '', category: 'general' })

  const load = () => api.getAnnouncements().then(setList)
  useEffect(() => { load() }, [])

  async function submit(e) {
    e.preventDefault()
    await api.publishAnnouncement(form)
    setForm({ title: '', body: '', category: 'general' })
    setShowForm(false)
    load()
  }

  return (
    <div className="app-shell">
      <div className="topbar"><h1>{t('announcements')}</h1></div>

      {isAdmin && (
        <div className="card">
          <button className="btn btn-accent btn-block" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : '+ Publish Announcement'}
          </button>
          {showForm && (
            <form onSubmit={submit} style={{ marginTop: 12 }}>
              <input className="input" placeholder="Title" required
                     value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              <textarea className="input" placeholder="Message" rows={4} required
                        value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} />
              <select className="input" value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}>
                <option value="general">General</option>
                <option value="urgent">Urgent</option>
                <option value="event">Event</option>
                <option value="circular">Circular</option>
              </select>
              <button className="btn btn-primary btn-block">Publish & Notify</button>
            </form>
          )}
        </div>
      )}

      {list.map((a) => (
        <div key={a.id} className="card">
          <span className={`badge badge-${a.category === 'urgent' ? 'rejected' : 'in_progress'}`}>{a.category}</span>
          <h3 style={{ fontSize: 15, marginTop: 8 }}>{a.title}</h3>
          <p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>{a.body}</p>
          <p style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{new Date(a.published_at).toLocaleString()}</p>
        </div>
      ))}
    </div>
  )
}
