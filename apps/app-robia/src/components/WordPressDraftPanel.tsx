import { useEffect, useRef, useState } from 'react'
import { CheckCircle2, CircleHelp, ExternalLink, FileWarning, Link2, ShieldCheck } from 'lucide-react'

import { Button, Badge } from './ui'
import {
  ApiError,
  approveWordPressDraft,
  createWordPressDraft,
  getWordPressStatus,
  listWordPressAttempts,
  reconcileWordPressDraft,
  type ActionItem,
  type DocumentItem,
  type WordPressConnection,
  type WordPressDraftAttempt,
  type WordPressPostType,
} from '../lib/api'

interface ActionWorkflowFields {
  approvalStatus?: string
  executionStatus?: string
}

interface Props {
  websiteId: string
  document: DocumentItem
  actionItem: (ActionItem & ActionWorkflowFields) | null
}

type Phase =
  | 'loading'
  | 'not_approved'
  | 'not_connected'
  | 'capability_missing'
  | 'confirm'
  | 'submitting'
  | 'confirmed'
  | 'unknown'
  | 'failed'
  | 'context_invalid'
  | 'load_error'

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Une erreur inattendue est survenue.'
}

function generateIdempotencyKey(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID()
  return `wp-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

// RC42 — the WordPress "authorize and create a draft" flow for one exact
// document revision. Everything here creates a DRAFT only: no button or
// text in this component ever claims or offers a public publish.
//
// Once POST /drafts has been called once for this approval, it is never
// called again from here — a timeout or an HTTP 503 moves the flow to the
// 'unknown' phase, which can only be resolved through POST .../reconcile.
// Editing the document to a new revision remounts this whole panel (see the
// `key` at its call site) and starts a genuinely fresh flow instead.
export default function WordPressDraftPanel({ websiteId, document, actionItem }: Props) {
  const [postType, setPostType] = useState<WordPressPostType>('post')
  const [connection, setConnection] = useState<WordPressConnection | null>(null)
  const [phase, setPhase] = useState<Phase>('loading')
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState<WordPressDraftAttempt | null>(null)
  const mountedRef = useRef(true)
  const draftPostedRef = useRef(false)
  const idempotencyKeyRef = useRef<string | null>(null)

  const approved = actionItem?.approvalStatus === 'approved'
  const ready = actionItem?.executionStatus === 'ready'

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    if (!actionItem) return

    if (!(approved && ready)) {
      setPhase('not_approved')
      return
    }

    setPhase('loading')
    setError('')

    void getWordPressStatus(websiteId)
      .then((status) => {
        if (cancelled) return
        setConnection(status.connection)

        if (!status.connection || status.connection.status !== 'ready') {
          setPhase('not_connected')
          return
        }

        const conn = status.connection
        if (!conn.canCreatePosts && !conn.canCreatePages) {
          setPhase('capability_missing')
          return
        }

        setPostType((current) => {
          if (current === 'post' && !conn.canCreatePosts) return 'page'
          if (current === 'page' && !conn.canCreatePages) return 'post'
          return current
        })
        setPhase('confirm')
      })
      .catch((loadError: unknown) => {
        if (cancelled) return
        if (loadError instanceof ApiError && loadError.status === 404) {
          setPhase('context_invalid')
        } else {
          setError(errorMessage(loadError))
          setPhase('load_error')
        }
      })

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reload strictly on site/action-readiness change, not on every postType toggle
  }, [websiteId, actionItem?.id, approved, ready])

  async function reloadAttemptFor(forApprovalId: string) {
    const attempts = await listWordPressAttempts(websiteId)
    if (!mountedRef.current) return
    const found = attempts.find((item) => item.approvalId === forApprovalId) ?? null
    setAttempt(found)

    if (!found) {
      setPhase('unknown') // the durable row itself could not be found — never assumed to mean "nothing happened"
      return
    }

    if (found.status === 'confirmed') setPhase('confirmed')
    else if (found.status === 'failed') setPhase('failed')
    else setPhase('unknown') // 'unknown' or a still-'in_flight' row this long after dispatch — neither is safe to treat as done
  }

  async function handleAuthorizeAndCreate() {
    // The button that calls this only renders while phase === 'confirm', and
    // this is the very first thing that moves it off that phase — a second
    // click (or an accidental double invocation) can never re-enter this
    // function while the first call is still in flight.
    if (phase !== 'confirm' || !actionItem) return
    setPhase('submitting')
    setError('')

    let approvalId: string
    try {
      const approvalResult = await approveWordPressDraft({
        websiteId,
        documentId: document.id,
        actionItemId: actionItem.id,
        expectedRevision: document.revision ?? 1,
        postType,
      })
      if (!mountedRef.current) return
      approvalId = approvalResult.approval.id
    } catch (approveError) {
      if (!mountedRef.current) return
      if (approveError instanceof ApiError && approveError.status === 404) {
        setPhase('context_invalid')
      } else {
        // Nothing was ever sent to WordPress — safe to show the error and
        // let the operator retry the approval itself.
        setError(errorMessage(approveError))
        setPhase('confirm')
      }
      return
    }

    if (draftPostedRef.current) return // the invariant this whole flow relies on, stated explicitly rather than only implied by the phase check above
    draftPostedRef.current = true
    const key = idempotencyKeyRef.current ?? generateIdempotencyKey()
    idempotencyKeyRef.current = key

    try {
      await createWordPressDraft({ approvalId, idempotencyKey: key })
      if (!mountedRef.current) return
      await reloadAttemptFor(approvalId)
    } catch (createError) {
      if (!mountedRef.current) return
      if (createError instanceof ApiError && createError.status === 404) {
        setPhase('context_invalid')
      } else if (createError instanceof ApiError && (createError.status === 409 || createError.status === 422)) {
        // A definite, synchronous rejection — WordPress (or ROBIA's own
        // pre-dispatch guard) never left this ambiguous.
        setError(errorMessage(createError))
        setPhase('failed')
      } else {
        // 503 (WordPress gave an ambiguous or unreadable answer), a network
        // failure, or anything unexpected: the draft may or may not exist.
        // Never resent automatically from here — only reconciliation can
        // resolve it.
        setPhase('unknown')
      }
      // Whatever the client-side outcome, the durable attempt row is the
      // real source of truth — reload it so a result the server actually
      // confirmed is never masked by a lost response.
      try {
        await reloadAttemptFor(approvalId)
      } catch {
        // Reload itself failing does not change the conclusion already set above.
      }
    }
  }

  async function handleReconcile() {
    if (!attempt) return
    setError('')
    try {
      const result = await reconcileWordPressDraft(attempt.id)
      if (!mountedRef.current) return
      if ('found' in result && result.found === false) {
        setPhase('unknown')
        setError('La réconciliation n’a rien trouvé côté WordPress pour le moment. Une vérification humaine est nécessaire.')
        return
      }
      await reloadAttemptFor(attempt.approvalId)
    } catch (reconcileError) {
      if (!mountedRef.current) return
      setError(errorMessage(reconcileError))
    }
  }

  if (!actionItem) return null

  return (
    <div className="mt-4 rounded-lg border border-border bg-slate-bg/70 p-3">
      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wide text-muted">
        <span>Brouillon WordPress</span>
        {phase === 'confirmed' && <Badge variant="teal">Brouillon créé</Badge>}
        {phase === 'unknown' && <Badge variant="orange">Résultat à vérifier</Badge>}
        {phase === 'failed' && <Badge variant="red">Refusé</Badge>}
      </div>

      {error && (
        <div role="alert" className="mt-3 border-l-2 border-red-500 bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </div>
      )}

      {phase === 'loading' && <p className="mt-3 text-xs text-muted">Vérification de la connexion WordPress…</p>}

      {phase === 'not_approved' && (
        <p className="mt-3 text-xs text-muted">
          Cette Action doit d’abord être approuvée et prête avant de créer un brouillon WordPress.
        </p>
      )}

      {phase === 'load_error' && <p className="mt-3 text-xs text-muted">Impossible de vérifier la connexion WordPress pour ce site.</p>}

      {phase === 'context_invalid' && (
        <p className="mt-3 text-xs text-red-700">Ce site ou cette organisation n’est plus valide pour cette opération.</p>
      )}

      {phase === 'not_connected' && (
        <p className="mt-3 text-xs text-muted">
          WordPress n’est pas connecté pour ce site. Configurez la connexion WordPress de ce site avant de créer un brouillon.
        </p>
      )}

      {phase === 'capability_missing' && (
        <p className="mt-3 text-xs text-orange-dark">
          Le compte WordPress connecté ne peut créer ni brouillon d’article ni brouillon de page.
        </p>
      )}

      {(phase === 'confirm' || phase === 'submitting') && connection && (
        <div className="mt-3 space-y-3">
          <div className="flex gap-1.5">
            <button
              type="button"
              disabled={phase === 'submitting' || !connection.canCreatePosts}
              onClick={() => setPostType('post')}
              className={`rounded-lg border px-2.5 py-1.5 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-40 ${postType === 'post' ? 'border-teal bg-teal-light/40 text-teal-dark' : 'border-border text-muted'}`}
            >
              Article
            </button>
            <button
              type="button"
              disabled={phase === 'submitting' || !connection.canCreatePages}
              onClick={() => setPostType('page')}
              className={`rounded-lg border px-2.5 py-1.5 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-40 ${postType === 'page' ? 'border-teal bg-teal-light/40 text-teal-dark' : 'border-border text-muted'}`}
            >
              Page
            </button>
          </div>

          <dl className="space-y-1 text-xs text-dark">
            <div className="flex justify-between gap-2">
              <dt className="shrink-0 text-muted">Site WordPress</dt>
              <dd className="min-w-0 max-w-[60%] truncate text-right font-semibold text-navy">{connection.siteUrl}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="shrink-0 text-muted">Document</dt>
              <dd className="min-w-0 max-w-[60%] truncate text-right font-semibold text-navy">{document.title ?? 'Document sans titre'}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-muted">Révision</dt>
              <dd className="font-semibold text-navy">{document.revision ?? 1}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-muted">Type</dt>
              <dd className="font-semibold text-navy">{postType === 'post' ? 'Article' : 'Page'}</dd>
            </div>
          </dl>

          <p className="border-l-2 border-teal bg-white px-3 py-2 text-[11px] leading-4 text-dark">
            Un brouillon sera créé. Rien ne sera publié automatiquement.
          </p>

          <Button
            variant="primary"
            size="sm"
            className="w-full"
            loading={phase === 'submitting'}
            disabled={phase === 'submitting'}
            icon={<ShieldCheck size={13} />}
            onClick={() => void handleAuthorizeAndCreate()}
          >
            Autoriser et créer le brouillon
          </Button>
        </div>
      )}

      {phase === 'confirmed' && attempt && (
        <div className="mt-3 space-y-2">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-teal-dark">
            <CheckCircle2 size={14} /> Brouillon créé sur WordPress.
          </p>
          {attempt.remoteEditorUrl && (
            <a
              href={attempt.remoteEditorUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-electric hover:underline"
            >
              <ExternalLink size={13} /> Ouvrir le brouillon dans l’éditeur WordPress
            </a>
          )}
          <p className="text-[11px] text-muted">Cette création a été enregistrée comme preuve pour l’Action liée.</p>
        </div>
      )}

      {phase === 'unknown' && attempt && (
        <div className="mt-3 space-y-2">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-orange-dark">
            <FileWarning size={14} /> Résultat à vérifier — l’envoi vers WordPress n’a pas pu être confirmé.
          </p>
          <Button variant="outline" size="sm" icon={<CircleHelp size={13} />} onClick={() => void handleReconcile()}>
            Vérifier dans WordPress
          </Button>
        </div>
      )}

      {phase === 'failed' && (
        <p className="mt-3 flex items-center gap-1.5 text-xs text-red-700">
          <Link2 size={13} /> La création du brouillon a été refusée. Corrigez le document ou la connexion avant de réessayer.
        </p>
      )}
    </div>
  )
}
