import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { useTranslation } from 'react-i18next'
import { api } from '../services/api'

export default function MeetingScan() {
  const { t } = useTranslation()
  const [message, setMessage] = useState('')
  const scannerRef = useRef(null)

  useEffect(() => {
    const scanner = new Html5Qrcode('qr-reader')
    scannerRef.current = scanner

    scanner.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: 220 },
      async (decodedText) => {
        await scanner.stop()
        try {
          const res = await api.qrCheckIn(decodedText)
          setMessage(res.message)
        } catch (err) {
          setMessage(err.message)
        }
      },
      () => {} // ignore per-frame scan errors
    ).catch(() => setMessage('Camera permission is required to scan.'))

    return () => { scannerRef.current?.stop().catch(() => {}) }
  }, [])

  return (
    <div className="app-shell">
      <div className="topbar"><h1>{t('scan_qr')}</h1></div>
      <div className="card">
        <div id="qr-reader" style={{ width: '100%', borderRadius: 12, overflow: 'hidden' }} />
        {message && <p style={{ marginTop: 12, fontWeight: 600, color: 'var(--color-success)' }}>{message}</p>}
      </div>
    </div>
  )
}
