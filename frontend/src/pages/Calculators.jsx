import { useState } from 'react'
import { useTranslation } from 'react-i18next'

const TABS = ['settlement', 'pf', 'esi', 'gratuity']

function num(v) {
  const n = Number(v)
  return isNaN(n) || n < 0 ? 0 : n
}

function row(label, value, note) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--color-border)' }}>
      <span style={{ fontSize: 13 }}>{label}</span>
      <strong style={{ fontSize: 13 }}>₹{value.toFixed(2)}</strong>
    </div>
  )
}

function Settlement() {
  const { t } = useTranslation()
  const [basic, setBasic] = useState('')
  const [years, setYears] = useState('')
  const [finalDays, setFinalDays] = useState('')
  const [leaveDays, setLeaveDays] = useState('')
  const [noticeDays, setNoticeDays] = useState('')

  const b = num(basic); const y = num(years)
  const fd = num(finalDays); const ld = num(leaveDays); const nd = num(noticeDays)
  const daily = b / 30
  const unpaid = daily * fd
  const leavePay = daily * ld
  const noticePay = daily * nd
  const gratuity = y >= 5 ? b * (15 / 26) * Math.floor(y) : 0
  const total = unpaid + leavePay + noticePay + gratuity

  return (
    <div className="card">
      <input className="input" type="number" placeholder={t('basic_da')} value={basic} onChange={(e) => setBasic(e.target.value)} />
      <input className="input" type="number" placeholder={t('years_service')} value={years} onChange={(e) => setYears(e.target.value)} />
      <input className="input" type="number" placeholder={t('unpaid_days')} value={finalDays} onChange={(e) => setFinalDays(e.target.value)} />
      <input className="input" type="number" placeholder={t('earned_leave_days')} value={leaveDays} onChange={(e) => setLeaveDays(e.target.value)} />
      <input className="input" type="number" placeholder={t('notice_days')} value={noticeDays} onChange={(e) => setNoticeDays(e.target.value)} />
      {total > 0 && (
        <>
          {row(t('unpaid_wages'), unpaid)}
          {row(t('leave_encashment'), leavePay)}
          {row(t('notice_pay'), noticePay)}
          {row(t('gratuity'), gratuity)}
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0' }}>
            <strong>{t('total_settlement')}</strong>
            <strong style={{ color: 'var(--color-accent)' }}>₹{total.toFixed(2)}</strong>
          </div>
        </>
      )}
      <p style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 8 }}>{t('settlement_note')}</p>
    </div>
  )
}

function PF() {
  const { t } = useTranslation()
  const [basic, setBasic] = useState('')
  const b = num(basic)
  const employee = b * 0.12
  const employer = b * 0.12
  const eps = Math.min(b, 15000) * 0.0833
  const epfEmp = employer - eps

  return (
    <div className="card">
      <input className="input" type="number" placeholder={t('basic_da')} value={basic} onChange={(e) => setBasic(e.target.value)} />
      {b > 0 && (
        <>
          {row(t('employee_pf'), employee)}
          {row(t('employer_epf'), epfEmp)}
          {row(t('employer_eps'), eps)}
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0' }}>
            <strong>{t('total_pf')}</strong>
            <strong style={{ color: 'var(--color-accent)' }}>₹{(employee + employer).toFixed(2)}</strong>
          </div>
        </>
      )}
      <p style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 8 }}>{t('pf_note')}</p>
    </div>
  )
}

function ESI() {
  const { t } = useTranslation()
  const [gross, setGross] = useState('')
  const g = num(gross)
  const applicable = g <= 21000 && g > 0
  const employee = applicable ? g * 0.0075 : 0
  const employer = applicable ? g * 0.0325 : 0

  return (
    <div className="card">
      <input className="input" type="number" placeholder={t('gross_monthly')} value={gross} onChange={(e) => setGross(e.target.value)} />
      {g > 0 && (
        applicable ? (
          <>
            {row(t('esi_employee'), employee)}
            {row(t('esi_employer'), employer)}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0' }}>
              <strong>{t('total_esi')}</strong>
              <strong style={{ color: 'var(--color-accent)' }}>₹{(employee + employer).toFixed(2)}</strong>
            </div>
          </>
        ) : (
          <p style={{ fontSize: 13, color: 'var(--color-danger)', margin: '8px 0 0' }}>{t('esi_not_applicable')}</p>
        )
      )}
      <p style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 8 }}>{t('esi_note')}</p>
    </div>
  )
}

function Gratuity() {
  const { t } = useTranslation()
  const [basic, setBasic] = useState('')
  const [years, setYears] = useState('')
  const b = num(basic); const y = num(years)
  const eligible = y >= 5
  const gratuity = eligible ? b * (15 / 26) * Math.floor(y) : 0

  return (
    <div className="card">
      <input className="input" type="number" placeholder={t('last_basic_da')} value={basic} onChange={(e) => setBasic(e.target.value)} />
      <input className="input" type="number" placeholder={t('years_service')} value={years} onChange={(e) => setYears(e.target.value)} />
      {y > 0 && (
        eligible ? (
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0' }}>
            <strong>{t('gratuity')}</strong>
            <strong style={{ color: 'var(--color-accent)' }}>₹{gratuity.toFixed(2)}</strong>
          </div>
        ) : (
          <p style={{ fontSize: 13, color: 'var(--color-danger)', margin: '8px 0 0' }}>{t('gratuity_not_eligible')}</p>
        )
      )}
      <p style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 8 }}>{t('gratuity_note')}</p>
    </div>
  )
}

export default function Calculators() {
  const { t } = useTranslation()
  const [tab, setTab] = useState('settlement')

  return (
    <div className="app-shell">
      <div className="topbar"><h1>{t('calculators')}</h1></div>
      <div style={{ display: 'flex', gap: 8, padding: '12px 16px 0', flexWrap: 'wrap' }}>
        {TABS.map((k) => (
          <button key={k} className={`btn ${tab === k ? 'btn-primary' : 'btn-outline'}`}
                  style={{ fontSize: 12 }} onClick={() => setTab(k)}>
            {t(k)}
          </button>
        ))}
      </div>
      <div style={{ paddingTop: 12 }}>
        {tab === 'settlement' && <Settlement />}
        {tab === 'pf' && <PF />}
        {tab === 'esi' && <ESI />}
        {tab === 'gratuity' && <Gratuity />}
      </div>
    </div>
  )
}
