import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Search, Shield, ShieldOff, UserPlus } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { api } from '../services/api'

export default function Members() {
  const { t } = useTranslation()
  const { member } = useAuth()
  const isAdmin = member?.role === 'admin' || member?.role === 'super_admin'
  const [members, setMembers] = useState([])
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [msg, setMsg] = useState('')
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    full_name: '', employee_id: '', email: '', phone: '',
    temp_password: '', designation: '', role: 'member',
  })

  const loadMembers = (q = search) => {
    const query = q ? `?search=${encodeURIComponent(q)}` : ''
    api.getMembers(query).then(setMembers)
  }

  useEffect(() => {
    const timeout = setTimeout(() => loadMembers(search), 250)
    return () => clearTimeout(timeout)
  }, [search])

  async function toggleRole(m) {
    await api.updateMemberRole(m.id, m.role === 'member' ? 'admin' : 'member')
    loadMembers()
  }

  async function addMember(e) {
    e.preventDefault()
    setMsg(''); setSaving(true)
    try {
      await api.addMember(form)
      setForm({
        full_name: '', employee_id: '', email: '', phone: '',
        temp_password: '', designation: '', role: 'member',
      })
      setShowForm(false)
      setMsg(t('member_added'))
      loadMembers()
    } catch (err) {
      setMsg(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="app-shell">
      <div className="topbar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1>{t('members')}</h1>
        {isAdmin && (
          <button className="btn btn-accent" style={{ fontSize: 13, padding: '8px 12px' }} onClick={() => setShowForm(!showForm)}>
            <UserPlus size={15} /> {t('add_member')}
          </button>
        )}
      </div>
      {msg && <p style={{ color: 'var(--color-danger)', fontSize: 13, padding: '0 16px' }}>{msg}</p>}
      {showForm && (
        <form className="card" onSubmit={addMember}>
          <input className="input" placeholder={t('full_name')} required
                 value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
          <input className="input" placeholder={t('employee_id')} required
                 value={form.employee_id} onChange={(e) => setForm({ ...form, employee_id: e.target.value })} />
          <input className="input" type="email" placeholder="Email" required
                 value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <input className="input" placeholder="+91XXXXXXXXXX" required
                 value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <input className="input" placeholder={t('temp_password')} required
                 value={form.temp_password} onChange={(e) => setForm({ ...form, temp_password: e.target.value })} />
          <input className="input" placeholder={t('designation')}
                 value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} />
          <select className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
            <option value="member">{t('role')}: member</option>
            <option value="admin">{t('role')}: admin</option>
          </select>
          <button className="btn btn-accent btn-block" disabled={saving}>{saving ? '...' : t('save')}</button>
          <button type="button" className="btn btn-outline btn-block" onClick={() => setShowForm(false)}>{t('cancel')}</button>
        </form>
      )}
      <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Search size={16} color="var(--color-text-muted)" />
        <input className="input" style={{ margin: 0, border: 'none' }} placeholder="Search by name..."
               value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      {members.map((m) => (
        <div key={m.id} className="card" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{
            width: 44, height: 44, borderRadius: '50%', background: 'var(--color-primary)',
            color: 'var(--color-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, overflow: 'hidden',
          }}>
            {m.photo_url ? <img src={m.photo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : m.full_name?.[0]}
          </div>
          <div style={{ flex: 1 }}>
            <strong style={{ fontSize: 14 }}>{m.full_name}</strong>
            {m.is_committee_member && <span className="badge badge-in_progress" style={{ marginLeft: 6 }}>Committee</span>}
            {m.role === 'super_admin' && <span className="badge badge-rejected" style={{ marginLeft: 6 }}>Super Admin</span>}
            {m.role === 'admin' && <span className="badge badge-in_progress" style={{ marginLeft: 6 }}>Admin</span>}
            <p style={{ fontSize: 12, color: 'var(--color-text-muted)', margin: '2px 0 0' }}>
              {m.designation || ''} {m.employee_id ? `· ${m.employee_id}` : ''}
            </p>
          </div>
          {isAdmin && m.id !== member.id && (
            <button className="btn btn-outline" style={{ fontSize: 12, padding: '6px 10px' }}
                    onClick={() => toggleRole(m)}>
              {m.role === 'member' ? <><Shield size={14} /> Admin</> : <><ShieldOff size={14} /> Revoke</>}
            </button>
          )}
        </div>
      ))}
    </div>
  )
}
