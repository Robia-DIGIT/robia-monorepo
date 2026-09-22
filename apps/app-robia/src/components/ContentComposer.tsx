import { useEffect, useRef, useState } from 'react'
import { FilePlus2, Plus, RefreshCw, Save, X } from 'lucide-react'

import { Badge, Button } from './ui'
import ContentPreview from './ContentPreview'
import ActionApprovalWorkflow from './ActionApprovalWorkflow'
import {
  generateStudioDocument,
  saveDocumentRevision,
  isRevisionConflict,
  getDocument,
  MAX_DOCUMENT_BRIEF_FACTS,
  type ActionItem,
  type DocumentItem,
  type DocumentType,
  type GoogleBusinessProfileLocation,
} from '../lib/api'

const CONTENT_TYPES: Array<{ value: DocumentType; label: string }> = [
  { value: 'gbp_post', label: 'Publication Google' },
  { value: 'local_page', label: 'Article ou page locale' },
  { value: 'faq', label: 'Question fréquente' },
  { value: 'meta', label: 'Balises SEO' },
  { value: 'review_reply', label: 'Réponse à un avis' },
]

type MobilePane = 'brief' | 'content' | 'apercu'

interface Props {
  websiteId: string
  opportunityId?: string
  actionItem: ActionItem | null
  businessLocation: GoogleBusinessProfileLocation | null
  initialType?: DocumentType
  initialDocument?: DocumentItem | null
  onDocumentPersisted: () => void
}

export default function ContentComposer({
  websiteId,
  opportunityId,
  actionItem,
  businessLocation,
  initialType,
  initialDocument,
  onDocumentPersisted,
}: Props) {
  const [type, setType] = useState<DocumentType>((initialDocument?.type as DocumentType | undefined) ?? initialType ?? 'gbp_post')
  const [objective, setObjective] = useState(initialDocument?.brief?.objective ?? '')
  const [audience, setAudience] = useState(initialDocument?.brief?.audience ?? '')
  const [tone, setTone] = useState(initialDocument?.brief?.tone ?? '')
  const [locale, setLocale] = useState(initialDocument?.brief?.locale ?? 'fr-MG')
  const [facts, setFacts] = useState<string[]>(
    initialDocument?.brief?.facts && initialDocument.brief.facts.length > 0 ? initialDocument.brief.facts : [''],
  )

  const [document, setDocument] = useState<DocumentItem | null>(initialDocument ?? null)
  const [content, setContent] = useState(initialDocument?.content ?? '')
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [conflict, setConflict] = useState<{ serverDocument: DocumentItem; localContent: string } | null>(null)
  const [mobilePane, setMobilePane] = useState<MobilePane>('brief')

  const activeWebsiteId = useRef(websiteId)
  const requestSeq = useRef(0)

  useEffect(() => {
    activeWebsiteId.current = websiteId
  }, [websiteId])

  const isDirty = document != null && content !== document.content

  const updateFact = (index: number, value: string) => {
    setFacts((current) => current.map((fact, i) => (i === index ? value : fact)))
  }

  const addFact = () => {
    setFacts((current) => (current.length >= MAX_DOCUMENT_BRIEF_FACTS ? current : [...current, '']))
  }

  const removeFact = (index: number) => {
    setFacts((current) => current.filter((_, i) => i !== index))
  }

  const handleGenerate = async () => {
    if (generating || !websiteId) return // guards against a double-click firing two generations

    const requestId = ++requestSeq.current
    const requestWebsiteId = websiteId
    setGenerating(true)
    setError('')
    setConflict(null)

    try {
      const generated = await generateStudioDocument({
        type,
        websiteId: requestWebsiteId,
        opportunityId,
        actionItemId: actionItem?.id,
        brief: {
          objective: objective.trim(),
          audience: audience.trim(),
          tone: tone.trim(),
          locale: locale.trim() || 'fr-MG',
          facts: facts.map((fact) => fact.trim()).filter(Boolean).slice(0, MAX_DOCUMENT_BRIEF_FACTS),
        },
      })

      if (requestSeq.current !== requestId || activeWebsiteId.current !== requestWebsiteId) {
        return // site changed while this generation was in flight — drop the stale result
      }

      setDocument(generated)
      setContent(generated.content)
      setMobilePane('content')
      onDocumentPersisted()
    } catch (generationError) {
      if (requestSeq.current !== requestId || activeWebsiteId.current !== requestWebsiteId) return

      if (isRevisionConflict(generationError) && actionItem) {
        setError(
          "L'Action sélectionnée a changé entre-temps et le document n'a pas pu y être relié. Rechargez le contexte de l'Action avant de réessayer.",
        )
      } else {
        setError(generationError instanceof Error ? generationError.message : 'Impossible de générer le document.')
      }
    } finally {
      if (requestSeq.current === requestId) setGenerating(false)
    }
  }

  const handleSave = async () => {
    if (!document || saving) return
    setSaving(true)
    setError('')

    try {
      const updated = await saveDocumentRevision(document.id, {
        content,
        expectedRevision: document.revision ?? 1,
      })
      setDocument(updated)
      setContent(updated.content)
      setConflict(null)
      onDocumentPersisted()
    } catch (saveError) {
      if (isRevisionConflict(saveError)) {
        try {
          const serverDocument = await getDocument(document.id)
          setConflict({ serverDocument, localContent: content })
        } catch {
          setError('Conflit de version détecté, et impossible de recharger la dernière version.')
        }
      } else {
        setError(saveError instanceof Error ? saveError.message : "Impossible d'enregistrer le document.")
      }
    } finally {
      setSaving(false)
    }
  }

  const reloadFromConflict = () => {
    if (!conflict) return
    setDocument(conflict.serverDocument)
    setContent(conflict.serverDocument.content)
    setConflict(null)
  }

  const gbpDisabledReason = businessLocation
    ? `Publication Google disponible dans la prochaine étape — établissement « ${businessLocation.title} » prêt pour cette destination.`
    : 'Publication Google disponible dans la prochaine étape.'

  return (
    <div className="space-y-4">
      <div className="flex gap-1 lg:hidden">
        {(['brief', 'content', 'apercu'] as MobilePane[]).map((pane) => (
          <button
            key={pane}
            type="button"
            onClick={() => setMobilePane(pane)}
            className={`flex-1 rounded-lg px-3 py-2 text-xs font-bold uppercase tracking-wide ${
              mobilePane === pane ? 'bg-navy text-white' : 'bg-slate-bg text-muted'
            }`}
          >
            {pane === 'brief' ? 'Brief' : pane === 'content' ? 'Contenu' : 'Aperçu'}
          </button>
        ))}
      </div>

      {error && <div className="border-l-2 border-red-500 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      {conflict && (
        <div className="space-y-2 border-l-2 border-orange bg-orange-light/30 px-4 py-3">
          <p className="text-sm font-semibold text-orange-dark">
            Une autre modification existe déjà pour ce document — votre version n'a pas été enregistrée.
          </p>
          <p className="text-xs text-muted">
            Votre texte local est conservé ci-dessous pour que vous puissiez le copier avant de recharger la dernière version.
          </p>
          <textarea
            readOnly
            value={conflict.localContent}
            className="min-h-24 w-full rounded-lg border border-orange/40 bg-white p-2 text-xs text-dark"
          />
          <Button variant="outline" size="sm" icon={<RefreshCw size={13} />} onClick={reloadFromConflict}>
            Recharger la dernière version
          </Button>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[300px_1fr_320px]">
        <div className={`space-y-4 border-l-2 border-teal bg-white p-4 ${mobilePane === 'brief' ? '' : 'hidden lg:block'}`}>
          <label className="block text-xs font-bold text-navy">
            Type de contenu
            <select
              className="mt-2 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm"
              value={type}
              onChange={(event) => setType(event.target.value as DocumentType)}
            >
              {CONTENT_TYPES.map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </select>
          </label>

          <label className="block text-xs font-bold text-navy">
            Objectif
            <input
              className="mt-2 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm"
              value={objective}
              onChange={(event) => setObjective(event.target.value)}
              placeholder="Ex. Annoncer une nouvelle offre"
            />
          </label>

          <label className="block text-xs font-bold text-navy">
            Audience
            <input
              className="mt-2 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm"
              value={audience}
              onChange={(event) => setAudience(event.target.value)}
              placeholder="Ex. Clients locaux, particuliers"
            />
          </label>

          <label className="block text-xs font-bold text-navy">
            Ton
            <input
              className="mt-2 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm"
              value={tone}
              onChange={(event) => setTone(event.target.value)}
              placeholder="Ex. Chaleureux et professionnel"
            />
          </label>

          <label className="block text-xs font-bold text-navy">
            Langue
            <input
              className="mt-2 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm"
              value={locale}
              onChange={(event) => setLocale(event.target.value)}
              placeholder="fr-MG"
            />
          </label>

          <div>
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-navy">Faits vérifiables — informations fournies par vous</p>
              <Badge variant="gray">{facts.filter((f) => f.trim()).length}/{MAX_DOCUMENT_BRIEF_FACTS}</Badge>
            </div>
            <div className="mt-2 space-y-2">
              {facts.map((fact, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    className="min-w-0 flex-1 rounded-lg border border-border bg-white px-3 py-2 text-sm"
                    value={fact}
                    onChange={(event) => updateFact(index, event.target.value)}
                    placeholder="Ex. Ouvert 7j/7 de 8h à 20h"
                  />
                  {facts.length > 1 && (
                    <button type="button" onClick={() => removeFact(index)} className="text-muted hover:text-red-600" aria-label="Retirer ce fait">
                      <X size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addFact}
              disabled={facts.length >= MAX_DOCUMENT_BRIEF_FACTS}
              className="mt-2 flex items-center gap-1 text-xs font-semibold text-teal-dark disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Plus size={13} /> Ajouter un fait
            </button>
          </div>

          {type === 'gbp_post' && (
            <div className="border-t border-border pt-3">
              <Button variant="outline" size="sm" className="w-full" disabled title={gbpDisabledReason}>
                Publication Google disponible dans la prochaine étape
              </Button>
              <p className="mt-2 text-[11px] leading-4 text-muted">
                La connexion Google ne vaut pas autorisation de publier. Le connecteur reste en lecture seule dans cette version.
              </p>
            </div>
          )}

          <Button variant="primary" className="w-full" loading={generating} icon={<FilePlus2 size={14} />} onClick={() => void handleGenerate()}>
            Générer le brouillon
          </Button>
        </div>

        <div className={`space-y-3 bg-white ${mobilePane === 'content' ? '' : 'hidden lg:block'}`}>
          {!document ? (
            <p className="border-l-2 border-border bg-slate-bg/60 px-4 py-6 text-center text-sm text-muted">
              Générez un brouillon pour commencer à éditer.
            </p>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-bold text-navy">{document.title ?? 'Brouillon ROBIA'}</p>
                  <p className="text-xs text-muted">
                    Statut : {document.status ?? 'draft'} · Révision {document.revision ?? 1}
                  </p>
                </div>
                <Button variant="outline" size="sm" loading={saving} disabled={!isDirty} icon={<Save size={13} />} onClick={() => void handleSave()}>
                  Enregistrer
                </Button>
              </div>
              <textarea
                className="min-h-80 w-full rounded-lg border border-border bg-white p-4 text-sm leading-6 text-dark focus:border-teal focus:outline-none"
                value={content}
                onChange={(event) => setContent(event.target.value)}
              />

              {actionItem ? (
                <ActionApprovalWorkflow action={actionItem} onChanged={onDocumentPersisted} />
              ) : (
                <p className="mt-2 text-xs text-muted">
                  Ce document n'est pas encore relié à une Action — il reste consultable depuis Mes contenus.
                </p>
              )}
            </>
          )}
        </div>

        <div className={mobilePane === 'apercu' ? '' : 'hidden lg:block'}>
          <ContentPreview type={type} title={document?.title ?? ''} content={content} />
        </div>
      </div>
    </div>
  )
}
