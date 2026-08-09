import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Megaphone, Users, FileWarning, CalendarDays, FolderOpen,
  Scale, Cake, PhoneCall, QrCode, PiggyBank, Vote, CalendarOff, Calculator,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { api } from '../services/api'
import dora from '../assets/dora.jpg'

const TILES = [
  { key: 'announcements', icon: Megaphone, to: '/announcements' },
  { key: 'members', icon: Users, to: '/members' },
  { key: 'complaints', icon: FileWarning, to: '/complaints' },
  { key: 'meetings', icon: CalendarDays, to: '/meetings' },
  { key: 'documents', icon: FolderOpen, to: '/documents' },
  { key: 'labour_laws', icon: Scale, to: '/documents?category=labour_law' },
  { key: 'finance', icon: PiggyBank, to: '/finance' },
  { key: 'leave', icon: CalendarOff, to: '/leave' },
  { key: 'polls', icon: Vote, to: '/polls' },
  { key: 'calculators', icon: Calculator, to: '/calculators' },
  { key: 'emergency', icon: PhoneCall, to: '/emergency' },
]

export default function Dashboard() {
  const { t } = useTranslation()
  const { member } = useAuth()
  const navigate = useNavigate()
  const [wishes, setWishes] = useState({ birthdays: [], anniversaries: [] })
  const [announcements, setAnnouncements] = useState([])

  useEffect(() => {
    api.getBirthdaysToday().then(setWishes).catch(() => {})
    api.getAnnouncements().then((list) => setAnnouncements(list.slice(0, 3))).catch(() => {})
  }, [])

  return (
    <div className="app-shell">
      <div className="topbar">
        <div>
          <h1>{t('app_name')}</h1>
          <p className="subtitle">{member ? `${member.full_name} · ${member.designation || ''}` : ''}</p>
        </div>
        <img src={member?.photo_url || dora} alt="Profile" style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', marginLeft: 'auto', flexShrink: 0 }} />
      </div>

      {(wishes.birthdays.length > 0 || wishes.anniversaries.length > 0) && (
        <div className="card" style={{ background: 'linear-gradient(135deg,#FCEACB,#F6D9AA)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Cake size={20} color="#8A5B10" />
            <strong style={{ color: '#8A5B10' }}>Today's Celebrations</strong>
          </div>
          {wishes.birthdays.map((m) => (
            <p key={m.id} style={{ margin: '6px 0 0', fontSize: 13 }}>🎂 Happy Birthday, {m.full_name}!</p>
          ))}
          {wishes.anniversaries.map((m) => (
            <p key={m.id} style={{ margin: '6px 0 0', fontSize: 13 }}>💍 Happy Anniversary, {m.full_name}!</p>
          ))}
        </div>
      )}

      <div className="grid-tiles">
        {TILES.map(({ key, icon: Icon, to }) => (
          <div key={key} className="tile" onClick={() => navigate(to)}>
            <div className="tile-icon"><Icon size={20} /></div>
            <span>{t(key, key)}</span>
          </div>
        ))}
        <div className="tile" onClick={() => navigate('/meetings/scan')}>
          <div className="tile-icon"><QrCode size={20} /></div>
          <span>{t('scan_qr')}</span>
        </div>
      </div>

      <div className="card">
        <h3 style={{ fontSize: 15 }}>{t('announcements')}</h3>
        {announcements.length === 0 && <p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>No announcements yet.</p>}
        {announcements.map((a) => (
          <div key={a.id} style={{ padding: '8px 0', borderBottom: '1px solid var(--color-border)' }}>
            <strong style={{ fontSize: 13 }}>{a.title}</strong>
            <p style={{ fontSize: 12, color: 'var(--color-text-muted)', margin: '2px 0 0' }}>{a.body?.slice(0, 80)}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
