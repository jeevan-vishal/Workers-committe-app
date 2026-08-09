import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import { api } from '../services/api'

const LEAVE_TYPES = [
  { value: 'sick', label: 'Sick Leave' },
  { value: 'casual', label: 'Casual Leave' },
  { value: 'earned', label: 'Earned Leave' },
  { value: 'unpaid', label: 'Unpaid Leave' },
]

export default function Leave() {
  const { t } = useTranslation()
  const { member } = useAuth()
  const isAdmin = member?.role === 'admin' || member?.role === 'super_admin'
  const [tab, setTab] = useState('new')
  const [mine, setMine] = useState([])
  const [all, setAll] = useState([])
  const [form, setForm] = useState({ leave_type: 'sick', start_date: '', end_date: '', reason: '' })

  const loadMine = () => api.myLeaves().then(setMine)
  const loadAll = () => isAdmin && api.allLeaves().then(setAll)

  useEffect(() => { loadMine(); loadAll() }, [])

  async function submit(e) {
    e.preventDefault()
    await api.requestLeave(form)
    setForm({ leave_type: 'sick', start_date: '', end_date: '', reason: '' })
    setTab('mine')
    loadMine()
  }

  async function setStatus(id, status) {
    await api.updateLeaveStatus(id, { status })
    loadAll()
  }

  return (
    <div className="app-shell">
      <div className="topbar"><h1>{t('leave')}</h1></div>

      <div style={{ display: 'flex', gap: 8, padding: '12px 16px 0' }}>
        <button className={`btn ${tab === 'new' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setTab('new')}>New</button>
        <button className={`btn ${tab === 'mine' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setTab('mine')}>{t('my_leave')}</button>
        {isAdmin && <button className={`btn ${tab === 'admin' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setTab('admin')}>All (Admin)</button>}
      </div>

      {tab === 'new' && (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <a href="https://hrisone-msgi.mindeservices.com/ecdm/home" target="_blank" rel="noreferrer"
             className="btn btn-accent btn-block" style={{ textDecoration: 'none', textAlign: 'center' }}>
            Open HRIS Leave Portal
          </a>
          <div style={{ fontSize: 12, color: 'var(--color-text-muted)', textAlign: 'center' }}>
            Use the HRIS portal for official leave requests, or submit below:
          </div>
        </div>
      )}

      {tab === 'new' && (
        <form className="card" onSubmit={submit}>
          <select className="input" value={form.leave_type}
                  onChange={(e) => setForm({ ...form, leave_type: e.target.value })}>
            {LEAVE_TYPES.map((lt) => <option key={lt.value} value={lt.value}>{lt.label}</option>)}
          </select>
          <input className="input" type="date" required value={form.start_date}
                 onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
          <input className="input" type="date" required value={form.end_date}
                 onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
          <textarea className="input" rows={3} placeholder="Reason" required value={form.reason}
                    onChange={(e) => setForm({ ...form, reason: e.target.value })} />
          <button className="btn btn-accent btn-block">Submit Leave Request</button>
        </form>
      )}

      {tab === 'mine' && mine.length === 0 && (
        <p style={{ padding: '12px 16px', fontSize: 13, color: 'var(--color-text-muted)' }}>No leave requests yet.</p>
      )}
      {tab === 'mine' && mine.map((l) => (
        <div key={l.id} className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <strong style={{ fontSize: 13 }}>{l.leave_type.replace('_', ' ')} Leave</strong>
            <span className={`badge badge-${l.status}`}>{l.status}</span>
          </div>
          <p style={{ fontSize: 13, margin: '6px 0 0' }}>
            {new Date(l.start_date).toLocaleDateString()} → {new Date(l.end_date).toLocaleDateString()}
          </p>
          {l.reason && <p style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{l.reason}</p>}
          {l.admin_note && <p style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Note: {l.admin_note}</p>}
        </div>
      ))}

      {tab === 'admin' && all.map((l) => (
        <div key={l.id} className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <strong style={{ fontSize: 13 }}>{l.full_name} · {l.employee_id}</strong>
            <span className={`badge badge-${l.status}`}>{l.status}</span>
          </div>
          <p style={{ fontSize: 13, margin: '6px 0 0' }}>
            {l.leave_type.replace('_', ' ')} · {new Date(l.start_date).toLocaleDateString()} → {new Date(l.end_date).toLocaleDateString()}
          </p>
          {l.reason && <p style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{l.reason}</p>}
          {l.status === 'pending' && (
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => setStatus(l.id, 'approved')}>Approve</button>
              <button className="btn btn-outline" style={{ flex: 1, color: 'var(--color-danger)' }} onClick={() => setStatus(l.id, 'rejected')}>Reject</button>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
