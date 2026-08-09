import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { FileText, Download } from 'lucide-react'
import { api } from '../services/api'

const CATEGORIES = [
  { value: '', label: 'All' },
  { value: 'circular', label: 'Circulars' },
  { value: 'policy', label: 'Policies' },
  { value: 'labour_law', label: 'Labour Laws' },
  { value: 'minutes', label: 'Meeting Minutes' },
]

export default function Documents() {
  const { t } = useTranslation()
  const [params] = useSearchParams()
  const [category, setCategory] = useState(params.get('category') || '')
  const [search, setSearch] = useState('')
  const [docs, setDocs] = useState([])

  useEffect(() => {
    const qs = new URLSearchParams()
    if (category) qs.set('category', category)
    if (search) qs.set('search', search)
    api.getDocuments(`?${qs.toString()}`).then(setDocs)
  }, [category, search])

  return (
    <div className="app-shell">
      <div className="topbar"><h1>{t('documents')}</h1></div>

      <div className="card">
        <input className="input" placeholder="Search documents..." value={search}
               onChange={(e) => setSearch(e.target.value)} />
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {CATEGORIES.map((c) => (
            <button key={c.value}
                    className={`btn ${category === c.value ? 'btn-primary' : 'btn-outline'}`}
                    style={{ fontSize: 12, padding: '6px 12px' }}
                    onClick={() => setCategory(c.value)}>
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {docs.map((d) => (
        <a key={d.id} href={d.file_url} target="_blank" rel="noreferrer" className="card"
           style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}>
          <FileText size={22} color="var(--color-primary)" />
          <div style={{ flex: 1 }}>
            <strong style={{ fontSize: 14, color: 'var(--color-text)' }}>{d.title}</strong>
            <p style={{ fontSize: 12, color: 'var(--color-text-muted)', margin: '2px 0 0' }}>
              {d.category.replace('_', ' ')} · {d.file_size_kb} KB
            </p>
          </div>
          <Download size={18} color="var(--color-text-muted)" />
        </a>
      ))}
    </div>
  )
}
