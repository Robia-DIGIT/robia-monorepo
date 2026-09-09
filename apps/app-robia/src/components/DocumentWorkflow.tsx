import { useEffect, useState } from 'react'
import { FileCheck2, FilePlus2, Save, ShieldCheck, XCircle } from 'lucide-react'

import {
  createValidation,
  generateDocument,
  listDocuments,
  updateDocument,
  type DocumentItem,
  type Opportunity,
} from '../lib/api'
import { Button, EmptyState } from './ui'

const DOCUMENT_TYPES = [
  { value: 'local_page', label: 'Page locale' },
  { value: 'faq', label: 'FAQ' },
  { value: 'meta', label: 'Balises SEO' },
  { value: 'gbp_post', label: 'Publication Google Business' },
  { value: 'review_reply', label: "Réponse à un avis" },
  { value: 'dev_brief', label: 'Brief développeur' },
  { value: 'checklist', label: 'Checklist' },
]

interface Props {
  opportunities: Opportunity[]
  onValidationCreated: () => void
}

export default function DocumentWorkflow({ opportunities, onValidationCreated }: Props) {
  const [opportunityId, setOpportunityId] = useState('')
  const [documentType, setDocumentType] = useState('local_page')
  const [documents, setDocuments] = useState<DocumentItem[]>([])
  const [activeDocument, setActiveDocument] = useState<DocumentItem | null>(null)
  const [content, setContent] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!opportunities.some((item) => item.id === opportunityId)) {
      setOpportunityId(opportunities[0]?.id ? String(opportunities[0].id) : '')
    }
  }, [opportunities, opportunityId])

  useEffect(() => {
    if (!opportunityId) {
      setDocuments([])
      setActiveDocument(null)
      setContent('')
      return
    }

    let cancelled = false
    setError('')
    void listDocuments(opportunityId)
      .then((items) => {
        if (cancelled) return
        setDocuments(items)
        setActiveDocument(items[0] ?? null)
        setContent(items[0]?.content ?? '')
      })
      .catch((loadError) => {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : 'Impossible de charger les documents.')
      })
    return () => { cancelled = true }
  }, [opportunityId])

  const selectDocument = (id: string) => {
    const selected = documents.find((item) => item.id === id) ?? null
    setActiveDocument(selected)
    setContent(selected?.content ?? '')
  }

  const handleGenerate = async () => {
    if (!opportunityId) return
    setBusy(true)
    setError('')
    try {
      const generated = await generateDocument({ opportunityId, type: documentType })
      setDocuments((current) => [generated, ...current])
      setActiveDocument(generated)
      setContent(generated.content)
    } catch (generationError) {
      setError(generationError instanceof Error ? generationError.message : 'Impossible de générer le document.')
    } finally {
      setBusy(false)
    }
  }

  const handleSave = async () => {
    if (!activeDocument || !content.trim()) return
    setBusy(true)
    setError('')
    try {
      const updated = await updateDocument(activeDocument.id, { content: content.trim() })
      setActiveDocument(updated)
      setDocuments((current) => current.map((item) => (item.id === updated.id ? updated : item)))
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Impossible d'enregistrer le document.")
    } finally {
      setBusy(false)
    }
  }

  const handleValidation = async (status: 'approved' | 'rejected') => {
    if (!activeDocument || !content.trim()) return
    setBusy(true)
    setError('')
    try {
      const savedDocument = content.trim() !== activeDocument.content
        ? await updateDocument(activeDocument.id, { content: content.trim() })
        : activeDocument
      await createValidation({ documentId: savedDocument.id, actionType: 'update', platform: 'website', status })
      const validatedDocument = { ...savedDocument, status: status === 'approved' ? 'validated' : savedDocument.status }
      setActiveDocument(validatedDocument)
      setDocuments((current) => current.map((item) => (item.id === validatedDocument.id ? validatedDocument : item)))
      onValidationCreated()
    } catch (validationError) {
      setError(validationError instanceof Error ? validationError.message : "Impossible d'enregistrer la validation.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="mt-10 border-t border-border pt-7">
      <div className="mb-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted">Production avec validation humaine</p>
        <h2 className="mt-1 text-xl font-bold text-navy">Document de mise en œuvre</h2>
        <p className="mt-2 text-sm text-muted">Générez un brouillon, relisez-le et approuvez-le. ROBIA ne publie rien automatiquement.</p>
      </div>

      {opportunities.length === 0 ? (
        <EmptyState icon={<FilePlus2 size={18} />} title="Aucune opportunité disponible" description="Générez d’abord les opportunités de ce site." />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(260px,0.8fr)_minmax(0,1.5fr)]">
          <div className="space-y-4 border-l-2 border-teal bg-white p-4">
            <label className="block text-xs font-bold text-navy">Opportunité
              <select className="mt-2 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm" value={opportunityId} onChange={(event) => setOpportunityId(event.target.value)}>
                {opportunities.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
              </select>
            </label>
            <label className="block text-xs font-bold text-navy">Type de livrable
              <select className="mt-2 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm" value={documentType} onChange={(event) => setDocumentType(event.target.value)}>
                {DOCUMENT_TYPES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
            </label>
            <Button variant="primary" className="w-full" loading={busy} icon={<FilePlus2 size={14} />} onClick={handleGenerate}>Générer un brouillon</Button>
            {documents.length > 0 && <label className="block text-xs font-bold text-navy">Documents existants
              <select className="mt-2 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm" value={activeDocument?.id ?? ''} onChange={(event) => selectDocument(event.target.value)}>
                {documents.map((item) => <option key={item.id} value={item.id}>{item.title ?? item.type} · {item.status ?? 'draft'}</option>)}
              </select>
            </label>}
          </div>

          <div className="bg-white">
            {error && <div className="mb-4 border-l-2 border-red-500 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
            {!activeDocument ? (
              <EmptyState icon={<FileCheck2 size={18} />} title="Aucun brouillon sélectionné" description="Choisissez un type de livrable puis lancez la génération." />
            ) : (
              <>
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                  <div><p className="font-bold text-navy">{activeDocument.title ?? 'Brouillon ROBIA'}</p><p className="text-xs text-muted">Statut : {activeDocument.status ?? 'draft'}</p></div>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" loading={busy} icon={<Save size={13} />} onClick={handleSave}>Enregistrer</Button>
                    <Button variant="danger" size="sm" loading={busy} icon={<XCircle size={13} />} onClick={() => void handleValidation('rejected')}>Rejeter</Button>
                    <Button variant="primary" size="sm" loading={busy} icon={<ShieldCheck size={13} />} onClick={() => void handleValidation('approved')}>Approuver</Button>
                  </div>
                </div>
                <textarea className="min-h-80 w-full rounded-lg border border-border bg-white p-4 text-sm leading-6 text-dark focus:border-teal focus:outline-none" value={content} onChange={(event) => setContent(event.target.value)} />
              </>
            )}
          </div>
        </div>
      )}
    </section>
  )
}
