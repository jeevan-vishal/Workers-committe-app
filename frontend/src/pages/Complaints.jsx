import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import { api } from '../services/api'

const CATEGORIES = ['Safety', 'Wages', 'Harassment', 'Facilities', 'Other']

export default function Complaints() {
  const { t } = useTranslation()
  const { member } = useAuth()
  const isAdmin = member?.role === 'admin' || member?.role === 'super_admin'
  const [tab, setTab] = useState('new')
  const [mine, setMine] = useState([])
  const [all, setAll] = useState([])
  const [form, setForm] = useState({ category: CATEGORIES[0], subject: '', description: '', is_anonymous: false })

  const loadMine = () => api.myComplaints().then(setMine)
  const loadAll = () => isAdmin && api.allComplaints().then(setAll)

  useEffect(() => { loadMine(); loadAll() }, [])

  async function submit(e) {
    e.preventDefault()
    await api.registerComplaint(form)
    setForm({ category: CATEGORIES[0], subject: '', description: '', is_anonymous: false })
    setTab('mine')
    loadMine()
  }

  async function setStatus(id, status) {
    await api.updateComplaintStatus(id, { status })
    loadAll()
  }

  return (
    <div className="app-shell">
      <div className="topbar"><h1>{t('complaints')}</h1></div>

      <div style={{ display: 'flex', gap: 8, padding: '12px 16px 0' }}>
        <button className={`btn ${tab === 'new' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setTab('new')}>New</button>
        <button className={`btn ${tab === 'mine' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setTab('mine')}>{t('my_complaints')}</button>
        {isAdmin && <button className={`btn ${tab === 'admin' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setTab('admin')}>All (Admin)</button>}
      </div>

      {tab === 'new' && (
        <form className="card" onSubmit={submit}>
          <select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <input className="input" placeholder="Subject" required
                 value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
          <textarea className="input" rows={4} placeholder="Describe the issue" required
                    value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, marginBottom: 12 }}>
            <input type="checkbox" checked={form.is_anonymous}
                   onChange={(e) => setForm({ ...form, is_anonymous: e.target.checked })} />
            Submit anonymously
          </label>
          <button className="btn btn-accent btn-block">{t('register_complaint')}</button>
        </form>
      )}

      {tab === 'mine' && mine.map((c) => (
        <div key={c.id} className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <strong style={{ fontSize: 13 }}>{c.ticket_no}</strong>
            <span className={`badge badge-${c.status}`}>{c.status.replace('_', ' ')}</span>
          </div>
          <p style={{ fontSize: 14, margin: '6px 0 0' }}>{c.subject}</p>
          <p style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{c.category} · {new Date(c.created_at).toLocaleDateString()}</p>
        </div>
      ))}

      {tab === 'admin' && all.map((c) => (
        <div key={c.id} className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <strong style={{ fontSize: 13 }}>{c.ticket_no}</strong>
            <span className={`badge badge-${c.status}`}>{c.status.replace('_', ' ')}</span>
          </div>
          <p style={{ fontSize: 14, margin: '6px 0 0' }}>{c.subject}</p>
          <p style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{c.description}</p>
          <select className="input" style={{ marginTop: 8 }} value={c.status}
                  onChange={(e) => setStatus(c.id, e.target.value)}>
            {['open', 'in_review', 'in_progress', 'resolved', 'rejected', 'closed'].map((s) => (
              <option key={s} value={s}>{s.replace('_', ' ')}</option>
            ))}
          </select>
        </div>
      ))}
    </div>
  )
}
