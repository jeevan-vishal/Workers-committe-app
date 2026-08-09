import { NavLink } from 'react-router-dom'
import { Home, Megaphone, FileWarning, Users, Settings as SettingsIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'

const items = [
  { to: '/', icon: Home, key: 'dashboard' },
  { to: '/announcements', icon: Megaphone, key: 'announcements' },
  { to: '/complaints', icon: FileWarning, key: 'complaints' },
  { to: '/members', icon: Users, key: 'members' },
  { to: '/settings', icon: SettingsIcon, key: 'settings' },
]

export default function BottomNav() {
  const { t } = useTranslation()
  return (
    <nav className="bottom-nav">
      {items.map(({ to, icon: Icon, key }) => (
        <NavLink key={to} to={to} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Icon size={20} />
          <span>{t(key)}</span>
        </NavLink>
      ))}
    </nav>
  )
}
