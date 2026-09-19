import { useState } from 'react'
import { CheckCircle2, Clock3, History, ShieldCheck, XCircle } from 'lucide-react'

import { Button, Badge } from './ui'
import {
  approveAction,
  getActionExecutionHistory,
  recordActionExecution,
  rejectAction,
  submitActionForApproval,
  type ActionExecutionEvent,
  type AssistedActionState,
} from '../lib/assistedExecution'

interface Props {
  action: AssistedActionState
  onChanged?: () => void | Promise<void>
}

function approvalLabel(status?: string) {
  if (status === 'approved') return { text: 'Approuvée', variant: 'green' as const }
  if (status === 'pending') return { text: 'En validation', variant: 'orange' as const }
  if (status === 'rejected') return { text: 'Rejetée', variant: 'red' as const }
  return { text: 'Brouillon', variant: 'gray' as const }
}

function executionLabel(status?: string) {
  if (status === 'succeeded') return { text: 'Exécutée', variant: 'green' as const }
  if (status === 'failed') return { text: 'Échec', variant: 'red' as const }
  if (status === 'ready') return { text: 'Prête', variant: 'blue' as const }
  return { text: 'Non démarrée', variant: 'gray' as const }
}

export default function ActionApprovalWorkflow({ action, onChanged }: Props) {
  const [state, setState] = useState(action)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [reason, setReason] = useState('')
  const [evidenceUrl, setEvidenceUrl] = useState('')
  const [failureNote, setFailureNote] = useState('')
  const [verificationAuditId, setVerificationAuditId] = useState('')
  const [history, setHistory] = useState<ActionExecutionEvent[]>([])
  const [showHistory, setShowHistory] = useState(false)

  const approval = approvalLabel(state.approvalStatus)
  const execution = executionLabel(state.executionStatus)

  const run = async (operation: () => Promise<{ action: AssistedActionState }>) => {
    setBusy(true)
    setError('')
    try {
      const result = await operation()
      setState((current) => ({ ...current, ...result.action }))
      await onChanged?.()
    } catch (operationError) {
      setError(operationError instanceof Error ? operationError.message : 'Action impossible.')
    } finally {
      setBusy(false)
    }
  }

  const loadHistory = async () => {
    if (showHistory) {
      setShowHistory(false)
      return
    }

    setBusy(true)
    setError('')
    try {
      setHistory(await getActionExecutionHistory(String(state.id)))
      setShowHistory(true)
    } catch (historyError) {
      setError(historyError instanceof Error ? historyError.message : "Impossible de charger l'historique.")
    } finally {
      setBusy(false)
    }
  }

  const recordSuccess = () => {
    if (!evidenceUrl.trim()) {
      setError("Ajoutez une URL de preuve avant d'enregistrer un succès.")
      return
    }

    void run(() =>
      recordActionExecution(String(state.id), {
        idempotencyKey: `dashboard-${state.id}-${Date.now()}`,
        outcome: 'succeeded',
        evidence: {
          url: evidenceUrl.trim(),
          source: 'robia_dashboard',
          recordedAt: new Date().toISOString(),
        },
        ...(verificationAuditId.trim() ? { verificationAuditId: verificationAuditId.trim() } : {}),
      }),
    )
  }

  const recordFailure = () => {
    if (!failureNote.trim()) {
      setError("Ajoutez une note d'erreur avant d'enregistrer un échec.")
      return
    }

    void run(() =>
      recordActionExecution(String(state.id), {
        idempotencyKey: `dashboard-${state.id}-${Date.now()}`,
        outcome: 'failed',
        evidence: {},
        note: failureNote.trim(),
        ...(verificationAuditId.trim() ? { verificationAuditId: verificationAuditId.trim() } : {}),
      }),
    )
  }

  return (
    <div className="mt-4 rounded-lg border border-border bg-slate-bg/70 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-wide text-muted">
          <span>Validation humaine</span>
          <Badge variant={approval.variant}>{approval.text}</Badge>
          <Badge variant={execution.variant}>{execution.text}</Badge>
          {(state.attemptCount ?? 0) > 0 && <span>{state.attemptCount} tentative{(state.attemptCount ?? 0) > 1 ? 's' : ''}</span>}
        </div>
        <Button variant="ghost" size="sm" icon={<History size={12} />} loading={busy} onClick={() => void loadHistory()}>
          Historique
        </Button>
      </div>

      {error && <div className="mt-3 border-l-2 border-red-500 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>}

      {(state.approvalStatus === undefined || state.approvalStatus === 'draft' || state.approvalStatus === 'rejected') && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" icon={<Clock3 size={12} />} loading={busy} onClick={() => void run(() => submitActionForApproval(String(state.id)))}>
            Soumettre pour validation
          </Button>
          {state.approvalStatus === 'rejected' && state.approvalReason && <span className="text-xs text-muted">Motif : {state.approvalReason}</span>}
        </div>
      )}

      {state.approvalStatus === 'pending' && (
        <div className="mt-3 space-y-2">
          <div className="flex flex-wrap gap-2">
            <Button variant="primary" size="sm" icon={<ShieldCheck size={12} />} loading={busy} onClick={() => void run(() => approveAction(String(state.id)))}>
              Approuver
            </Button>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input className="min-w-0 flex-1 rounded-lg border border-border bg-white px-3 py-2 text-xs text-dark outline-none focus:border-orange" value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Motif du rejet (min. 3 caractères)" />
            <Button variant="danger" size="sm" icon={<XCircle size={12} />} loading={busy} onClick={() => {
              if (reason.trim().length < 3) {
                setError('Le motif du rejet doit contenir au moins 3 caractères.')
                return
              }
              void run(() => rejectAction(String(state.id), reason.trim()))
            }}>
              Rejeter
            </Button>
          </div>
        </div>
      )}

      {state.approvalStatus === 'approved' && state.executionStatus !== 'succeeded' && (
        <div className="mt-3 space-y-2">
          <p className="text-xs font-semibold text-navy">Enregistrer une exécution assistée</p>
          <input className="w-full rounded-lg border border-border bg-white px-3 py-2 text-xs text-dark outline-none focus:border-teal" value={evidenceUrl} onChange={(event) => setEvidenceUrl(event.target.value)} placeholder="URL de preuve (capture, page modifiée, document…)" />
          <input className="w-full rounded-lg border border-border bg-white px-3 py-2 text-xs text-dark outline-none focus:border-teal" value={verificationAuditId} onChange={(event) => setVerificationAuditId(event.target.value)} placeholder="ID audit de vérification (optionnel)" />
          <div className="flex flex-wrap gap-2">
            <Button variant="primary" size="sm" icon={<CheckCircle2 size={12} />} loading={busy} onClick={recordSuccess}>
              Marquer réussie avec preuve
            </Button>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input className="min-w-0 flex-1 rounded-lg border border-border bg-white px-3 py-2 text-xs text-dark outline-none focus:border-red-400" value={failureNote} onChange={(event) => setFailureNote(event.target.value)} placeholder="Note d'échec" />
            <Button variant="danger" size="sm" loading={busy} onClick={recordFailure}>
              Enregistrer l'échec
            </Button>
          </div>
        </div>
      )}

      {state.executionStatus === 'succeeded' && (
        <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-teal-dark">
          <CheckCircle2 size={14} /> Exécution enregistrée avec preuve.
        </div>
      )}

      {showHistory && (
        <div className="mt-3 border-t border-border pt-3">
          {history.length === 0 ? (
            <p className="text-xs text-muted">Aucun événement RC14 enregistré.</p>
          ) : (
            <ol className="space-y-2">
              {history.map((event) => (
                <li key={event.id} className="flex flex-col gap-0.5 border-l-2 border-teal pl-3 text-xs">
                  <span className="font-bold text-navy">{event.eventType.replaceAll('_', ' ')}</span>
                  <span className="text-muted">{new Date(event.createdAt).toLocaleString()}</span>
                </li>
              ))}
            </ol>
          )}
        </div>
      )}
    </div>
  )
}
