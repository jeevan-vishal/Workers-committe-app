import { supabase } from './supabase'

const API_BASE = import.meta.env.VITE_API_BASE_URL || ''

async function authHeader() {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function request(path, { method = 'GET', body, isForm = false } = {}) {
  const headers = await authHeader()
  if (!isForm) headers['Content-Type'] = 'application/json'
  const url = API_BASE + (path.startsWith('/api') ? path : `/api${path}`)

  const res = await fetch(url, {
    method,
    headers,
    body: isForm ? body : body ? JSON.stringify(body) : undefined,
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail || 'Request failed')
  }

  const contentType = res.headers.get('content-type') || ''
  if (contentType.includes('application/json')) return res.json()
  return res.blob() // for PDF/Excel exports
}

export const api = {
  // Auth
  loginEmployeeId: (employee_id, password) =>
    request('/auth/login/employee-id', { method: 'POST', body: { employee_id, password } }),
  requestOtp: (phone) => request('/auth/login/otp/request', { method: 'POST', body: { phone } }),
  verifyOtp: (phone, token) =>
    request('/auth/login/otp/verify', { method: 'POST', body: { phone, token } }),
  requestPasswordReset: (body) =>
    request('/auth/reset-password', { method: 'POST', body }),
  confirmPasswordReset: (access_token, new_password) =>
    request('/auth/reset-password/confirm', { method: 'POST', body: { access_token, new_password } }),

  // Members
  getMembers: (params = '') => request(`/members${params}`),
  getBirthdaysToday: () => request('/members/birthdays-today'),
  addMember: (payload) => request('/members/admin/add', { method: 'POST', body: payload }),
  deactivateMember: (id) => request(`/members/admin/${id}`, { method: 'DELETE' }),
  updateMemberRole: (id, role) =>
    request(`/members/admin/${id}/role`, { method: 'PATCH', body: { role } }),
  uploadPhoto: (formData) => request('/members/photo', { method: 'POST', body: formData, isForm: true }),

  // Leave
  requestLeave: (payload) => request('/leave/request', { method: 'POST', body: payload }),
  myLeaves: () => request('/leave/mine'),
  allLeaves: () => request('/leave/admin/all'),
  updateLeaveStatus: (id, payload) =>
    request(`/leave/admin/${id}/status`, { method: 'PATCH', body: payload }),

  // Announcements
  getAnnouncements: (category = '') =>
    request(`/announcements${category ? `?category=${category}` : ''}`),
  publishAnnouncement: (payload) =>
    request('/announcements/admin/publish', { method: 'POST', body: payload }),

  // Complaints
  registerComplaint: (payload) => request('/complaints', { method: 'POST', body: payload }),
  myComplaints: () => request('/complaints/mine'),
  complaintHistory: (id) => request(`/complaints/${id}/history`),
  allComplaints: (status = '') => request(`/complaints/admin/all${status ? `?status=${status}` : ''}`),
  updateComplaintStatus: (id, payload) =>
    request(`/complaints/admin/${id}/status`, { method: 'PATCH', body: payload }),

  // Meetings
  getMeetings: () => request('/meetings'),
  createMeeting: (payload) => request('/meetings/admin/create', { method: 'POST', body: payload }),
  qrCheckIn: (token) => request(`/meetings/check-in/${token}`, { method: 'POST' }),
  meetingAttendance: (id) => request(`/meetings/${id}/attendance`),

  // Documents
  getDocuments: (params = '') => request(`/documents${params}`),
  uploadDocument: (formData) => request('/documents/admin/upload', { method: 'POST', body: formData, isForm: true }),

  // Finance
  getTransactions: (params = '') => request(`/finance/transactions${params}`),
  recordTransaction: (payload) => request('/finance/admin/transactions', { method: 'POST', body: payload }),
  getFinanceSummary: (params = '') => request(`/finance/summary${params}`),
  getUpiInfo: () => request('/finance/upi-info'),
  exportExcel: (params = '') => request(`/finance/export/excel${params}`),
  exportPdf: (params = '') => request(`/finance/export/pdf${params}`),

  // Notifications
  registerPushToken: (token, platform) =>
    request('/notifications/register-token', { method: 'POST', body: { token, platform } }),
  sendPush: (payload) => request('/notifications/admin/send', { method: 'POST', body: payload }),
}
