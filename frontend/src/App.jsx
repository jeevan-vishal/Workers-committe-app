import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import BottomNav from './components/BottomNav'
import Login from './pages/Login'
import ResetPassword from './pages/ResetPassword'
import Dashboard from './pages/Dashboard'
import Announcements from './pages/Announcements'
import Complaints from './pages/Complaints'
import Members from './pages/Members'
import Meetings from './pages/Meetings'
import MeetingScan from './pages/MeetingScan'
import Documents from './pages/Documents'
import Finance from './pages/Finance'
import Leave from './pages/Leave'
import Settings from './pages/Settings'
import Calculators from './pages/Calculators'

function PrivateArea() {
  const { session, loading } = useAuth()
  if (loading) return null
  const isRecovery = window.location.hash.includes('type=recovery')
  if (!session && !isRecovery) return <Login />

  return (
    <>
      <Routes>
        <Route path="/reset-password" element={isRecovery ? <ResetPassword /> : <Navigate to="/" />} />
        <Route path="/" element={<Dashboard />} />
        <Route path="/announcements" element={<Announcements />} />
        <Route path="/complaints" element={<Complaints />} />
        <Route path="/members" element={<Members />} />
        <Route path="/meetings" element={<Meetings />} />
        <Route path="/meetings/scan" element={<MeetingScan />} />
        <Route path="/documents" element={<Documents />} />
        <Route path="/finance" element={<Finance />} />
        <Route path="/leave" element={<Leave />} />
        <Route path="/calculators" element={<Calculators />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      {!isRecovery && <BottomNav />}
    </>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <PrivateArea />
    </AuthProvider>
  )
}
