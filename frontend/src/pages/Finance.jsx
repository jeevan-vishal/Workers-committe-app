import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { QRCodeSVG } from 'qrcode.react'
import { useAuth } from '../context/AuthContext'
import { api } from '../services/api'

function download(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

const METHODS = ['cash', 'bank', 'upi']

export default function Finance() {
  const { t } = useTranslation()
  const { member } = useAuth()
  const isAdmin = member?.role === 'admin' || member?.role === 'super_admin'
  const [summary, setSummary] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [upi, setUpi] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [msg, setMsg] = useState('')
  const [isError, setIsError] = useState(false)
  const [form, setForm] = useState({
    type: 'expense', amount: '', description: '',
    payment_method: 'cash', upi_id: '', upi_ref: '',
  })
  const [payAmount, setPayAmount] = useState('')

  const load = () => {
    api.getFinanceSummary().then(setSummary)
    api.getTransactions().then(setTransactions)
  }

  useEffect(() => {
    load()
    api.getUpiInfo().then(setUpi).catch(() => setUpi(null))
  }, [])

  async function submit(e) {
    e.preventDefault()
    setMsg('')
    try {
      await api.recordTransaction({
        type: form.type,
        amount: Number(form.amount),
        description: form.description,
        payment_method: form.payment_method,
        upi_id: form.payment_method === 'upi' ? form.upi_id : null,
        upi_ref: form.payment_method === 'upi' ? form.upi_ref : null,
      })
      setForm({ type: 'expense', amount: '', description: '', payment_method: 'cash', upi_id: '', upi_ref: '' })
      setShowForm(false)
      setMsg(t('txn_added')); setIsError(false)
      load()
    } catch (err) {
      setMsg(err.message); setIsError(true)
    }
  }

  const upiUri = upi
    ? `upi://pay?pa=${encodeURIComponent(upi.upi_id)}&pn=${encodeURIComponent(upi.payee || 'Workers Committee')}` +
      (payAmount ? `&am=${encodeURIComponent(payAmount)}` : '') + '&cu=INR'
    : ''

  return (
    <div className="app-shell">
      <div className="topbar"><h1>{t('finance')}</h1></div>

      {summary && (
        <div className="card" style={{ display: 'flex', justifyContent: 'space-between', textAlign: 'center' }}>
          <div><p style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{t('income')}</p>
            <strong style={{ color: 'var(--color-success)' }}>₹{summary.total_income.toFixed(0)}</strong></div>
          <div><p style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{t('expense')}</p>
            <strong style={{ color: 'var(--color-danger)' }}>₹{summary.total_expense.toFixed(0)}</strong></div>
          <div><p style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{t('balance')}</p>
            <strong>₹{summary.balance.toFixed(0)}</strong></div>
        </div>
      )}

      {upi && (
        <div className="card" style={{ textAlign: 'center' }}>
          <h3 style={{ fontSize: 14, marginBottom: 8 }}>{t('pay_via_upi')}</h3>
          <input className="input" type="number" min="0" step="0.01" placeholder={t('payable_amount')}
                 value={payAmount} onChange={(e) => setPayAmount(e.target.value)} />
          <QRCodeSVG value={upiUri} size={140} style={{ marginTop: 8 }} />
          <p style={{ fontSize: 13, margin: '8px 0 2px', fontWeight: 700 }}>{upi.upi_id}</p>
          <p style={{ fontSize: 11, color: 'var(--color-text-muted)', margin: 0 }}>{upi.payee}</p>
          <button className="btn btn-accent btn-block" style={{ marginTop: 10 }}
                  onClick={() => { try { window.location.href = upiUri } catch {} }}>
            {t('pay')}
          </button>
        </div>
      )}

      {isAdmin && (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-outline" style={{ flex: 1 }}
                    onClick={async () => download(await api.exportExcel(), 'finance_report.xlsx')}>
              Export Excel
            </button>
            <button className="btn btn-outline" style={{ flex: 1 }}
                    onClick={async () => download(await api.exportPdf(), 'finance_report.pdf')}>
              Export PDF
            </button>
          </div>
          <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? t('cancel') : t('record_transaction')}
          </button>
        </div>
      )}

      {msg && <p style={{ color: isError ? 'var(--color-danger)' : 'var(--color-primary)', fontSize: 13, padding: '0 16px' }}>{msg}</p>}

      {isAdmin && showForm && (
        <form className="card" onSubmit={submit}>
          <div style={{ display: 'flex', gap: 8 }}>
            {['income', 'expense'].map((tp) => (
              <button type="button" key={tp}
                      className={`btn ${form.type === tp ? 'btn-primary' : 'btn-outline'}`}
                      style={{ flex: 1 }} onClick={() => setForm({ ...form, type: tp })}>
                {tp === 'income' ? t('income') : t('expense')}
              </button>
            ))}
          </div>
          <input className="input" type="number" step="0.01" min="0" placeholder="₹ 0.00" required
                 value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
          <input className="input" placeholder={t('description')} required
                 value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <select className="input" value={form.payment_method}
                  onChange={(e) => setForm({ ...form, payment_method: e.target.value })}>
            {METHODS.map((m) => <option key={m} value={m}>{t('method_' + m)}</option>)}
          </select>
          {form.payment_method === 'upi' && (
            <>
              <input className="input" placeholder={t('upi_id')} required
                     value={form.upi_id} onChange={(e) => setForm({ ...form, upi_id: e.target.value })} />
              <input className="input" placeholder={t('upi_ref')} required
                     value={form.upi_ref} onChange={(e) => setForm({ ...form, upi_ref: e.target.value })} />
            </>
          )}
          <button className="btn btn-accent btn-block">{t('save')}</button>
        </form>
      )}

      <div className="card">
        <h3 style={{ fontSize: 14 }}>{t('recent_transactions')}</h3>
        {transactions.map((tx) => (
          <div key={tx.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--color-border)' }}>
            <div style={{ flex: 1, paddingRight: 8 }}>
              <strong style={{ fontSize: 13 }}>{tx.description || tx.finance_categories?.name}</strong>
              <p style={{ fontSize: 11, color: 'var(--color-text-muted)', margin: '2px 0 0' }}>
                {new Date(tx.transaction_date).toLocaleDateString()}
                {tx.payment_method === 'upi' && (
                  <span className="badge badge-in_progress" style={{ marginLeft: 6 }}>UPI</span>
                )}
              </p>
              {tx.payment_method === 'upi' && tx.upi_ref && (
                <p style={{ fontSize: 10, color: 'var(--color-text-muted)', margin: '2px 0 0' }}>
                  Ref: {tx.upi_ref}
                </p>
              )}
            </div>
            <strong style={{ color: tx.type === 'income' ? 'var(--color-success)' : 'var(--color-danger)' }}>
              {tx.type === 'income' ? '+' : '-'}₹{tx.amount}
            </strong>
          </div>
        ))}
      </div>
    </div>
  )
}
