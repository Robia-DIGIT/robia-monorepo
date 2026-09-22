import { useEffect, useRef, useState } from 'react'
import { FileStack } from 'lucide-react'

import { Badge, EmptyState } from './ui'
import { listDocumentsByWebsite, type DocumentItem } from '../lib/api'

const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  local_page: 'Page locale',
  faq: 'FAQ',
  meta: 'Balises SEO',
  gbp_post: 'Publication Google',
  review_reply: 'Réponse à un avis',
  dev_brief: 'Brief développeur',
  checklist: 'Checklist',
}

function typeLabel(type: string) {
  return DOCUMENT_TYPE_LABELS[type] ?? type
}

type LibraryFilter = 'all' | 'draft' | 'edited' | 'validated'

const FILTERS: Array<{ key: LibraryFilter; label: string }> = [
  { key: 'all', label: 'Tous' },
  { key: 'draft', label: 'Brouillons' },
  { key: 'edited', label: 'Modifiés' },
  { key: 'validated', label: 'Validés' },
]

function statusBadge(status?: string) {
  if (status === 'validated') return { text: 'Validé', variant: 'green' as const }
  if (status === 'edited') return { text: 'Modifié', variant: 'blue' as const }
  return { text: 'Brouillon', variant: 'gray' as const }
}

function matchesFilter(document: DocumentItem, filter: LibraryFilter) {
  if (filter === 'all') return true
  if (filter === 'draft') return !document.status || document.status === 'draft'
  return document.status === filter
}

interface Props {
  websiteId: string
  refreshToken: number
  onSelect: (document: DocumentItem) => void
}

export default function ContentLibrary({ websiteId, refreshToken, onSelect }: Props) {
  const [documents, setDocuments] = useState<DocumentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<LibraryFilter>('all')
  const latestRequest = useRef(0)

  useEffect(() => {
    if (!websiteId) {
      setDocuments([])
      setLoading(false)
      return
    }

    const requestId = ++latestRequest.current
    setLoading(true)
    setError('')

    listDocumentsByWebsite(websiteId)
      .then((items) => {
        if (latestRequest.current !== requestId) return // stale response for a since-changed website
        setDocuments(items)
      })
      .catch((loadError) => {
        if (latestRequest.current !== requestId) return
        setError(loadError instanceof Error ? loadError.message : 'Impossible de charger la bibliothèque.')
      })
      .finally(() => {
        if (latestRequest.current === requestId) setLoading(false)
      })
  }, [websiteId, refreshToken])

  const filtered = documents.filter((document) => matchesFilter(document, filter))

  return (
    <div className="border-l-2 border-border bg-white p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted">Mes contenus</p>
      </div>

      <div className="mb-3 flex flex-wrap gap-1.5">
        {FILTERS.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setFilter(item.key)}
            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors ${
              filter === item.key ? 'bg-teal-dark text-white' : 'bg-slate-bg text-muted hover:text-navy'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {error && <div className="mb-3 border-l-2 border-red-500 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>}

      {loading ? (
        <div className="h-24 animate-pulse bg-border-light" />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<FileStack size={18} />}
          title="Aucun contenu"
          description={
            documents.length === 0
              ? "Générez un premier brouillon pour ce site — il apparaîtra ici."
              : 'Aucun document ne correspond à ce filtre.'
          }
        />
      ) : (
        <ul className="divide-y divide-border">
          {filtered.map((document) => (
            <li key={document.id}>
              <button
                type="button"
                onClick={() => onSelect(document)}
                className="flex w-full flex-col gap-1 py-3 text-left hover:bg-slate-bg"
              >
                <div className="flex items-center gap-2">
                  <Badge variant="gray">{typeLabel(document.type)}</Badge>
                  <Badge variant={statusBadge(document.status).variant}>{statusBadge(document.status).text}</Badge>
                </div>
                <p className="truncate text-sm font-semibold text-navy">{document.title ?? 'Sans titre'}</p>
                <p className="text-[11px] text-muted">
                  Révision {document.revision ?? 1}
                  {document.updatedAt ? ` · ${new Date(document.updatedAt).toLocaleString('fr-FR')}` : ''}
                </p>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
