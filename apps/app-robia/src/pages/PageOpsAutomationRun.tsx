import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, Circle, Loader2, XCircle } from 'lucide-react'

import { Badge, Button, Card } from '../components/ui'
import {
  approveAutomationRun,
  getAutomationRun,
  rejectAutomationRun,
  runStatusLabel,
  stepStatusLabel,
  type AutomationRun,
  type AutomationStepRun,
} from '../lib/api'

function formatDate(value: string | null) {
  if (!value) return '—'
  return new Date(value).toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

function StepIcon({ status }: { status: AutomationStepRun['status'] }) {
  if (status === 'succeeded') return <CheckCircle2 size={18} className="text-teal" />
  if (status === 'failed') return <XCircle size={18} className="text-red-500" />
  if (status === 'running') return <Loader2 size={18} className="animate-spin text-electric" />
  return <Circle size={18} className="text-[#CBD5E1]" />
}

function StepTimelineItem({ step }: { step: AutomationStepRun }) {
  const status = stepStatusLabel(step.status)
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <StepIcon status={step.status} />
        <div className="mt-1 w-px flex-1 bg-border" />
      </div>
      <div className="flex-1 pb-6">
        <div className="mb-1 flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-dark">{step.sequence}. {step.actionType}</span>
          <Badge variant={status.variant}>{status.label}</Badge>
        </div>
        <p className="text-xs text-muted">
          {formatDate(step.startedAt)} → {formatDate(step.finishedAt)}
        </p>
        {step.evidence && (
          <pre className="mt-2 overflow-x-auto rounded-lg bg-slate-bg px-3 py-2 text-xs text-dark">
            {JSON.stringify(step.evidence, null, 2)}
          </pre>
        )}
        {step.error && (
          <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700 border border-red-200">
            {step.error}
          </p>
        )}
      </div>
    </div>
  )
}

export default function PageOpsAutomationRun() {
  const { runId = '' } = useParams()
  const [run, setRun] = useState<AutomationRun | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')

  const loadData = async () => {
    setLoading(true)
    setError('')
    try {
      setRun(await getAutomationRun(runId))
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Impossible de charger ce run.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runId])

  const handleApprove = async () => {
    setBusy(true)
    setError('')
    try {
      setRun(await approveAutomationRun(runId, reason || undefined))
    } catch (approveError) {
      setError(approveError instanceof Error ? approveError.message : "Impossible d'approuver ce run.")
    } finally {
      setBusy(false)
    }
  }

  const handleReject = async () => {
    setBusy(true)
    setError('')
    try {
      setRun(await rejectAutomationRun(runId, reason || undefined))
    } catch (rejectError) {
      setError(rejectError instanceof Error ? rejectError.message : 'Impossible de rejeter ce run.')
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6 lg:p-8 max-w-4xl mx-auto">
        <Card className="p-8">
          <div className="h-8 w-72 bg-slate-100 rounded-lg" />
        </Card>
      </div>
    )
  }

  if (!run) {
    return (
      <div className="p-6 lg:p-8 max-w-4xl mx-auto">
        <Card className="p-6 text-sm text-red-700 bg-red-50 border-red-200">{error || 'Run non trouvé.'}</Card>
      </div>
    )
  }

  const status = runStatusLabel(run.status)
  const steps = run.steps ?? []
  const plannedSteps = run.plannedSteps ?? []
  const isWaitingApproval = run.status === 'waiting_approval'

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto animate-slide-up">
      <Link
        to={`/ops/automations/${run.automationId}`}
        className="mb-4 inline-flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-navy"
      >
        <ArrowLeft size={14} /> Retour à l'automatisation
      </Link>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-5">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Badge variant={status.variant}>{status.label}</Badge>
            <Badge variant="gray">Déclenchement : {run.triggerType}</Badge>
          </div>
          <h1 className="text-2xl font-bold text-navy">Exécution du {formatDate(run.createdAt)}</h1>
        </div>
      </div>

      {error && (
        <div className="mb-6">
          <Card className="p-4 text-sm text-red-700 bg-red-50 border-red-200">{error}</Card>
        </div>
      )}

      {isWaitingApproval && (
        <Card className="mb-6 p-5 border-orange/40 bg-orange-light/10">
          <h2 className="mb-2 text-sm font-bold text-orange-dark">Validation requise</h2>
          <p className="mb-3 text-xs leading-relaxed text-dark">
            Cette exécution respecte ses conditions mais nécessite une validation humaine avant de lancer la moindre
            étape — aucune action n'a encore été exécutée.
          </p>
          <div className="mb-3">
            <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-orange-dark">Étapes prévues</h3>
            {plannedSteps.length === 0 ? (
              <p className="text-xs text-muted">Aucune étape planifiée.</p>
            ) : (
              <ul className="space-y-2">
                {plannedSteps.map((step, index) => (
                  <li key={`${step.actionType}-${index}`} className="rounded-lg bg-white/70 px-3 py-2">
                    <span className="text-xs font-semibold text-dark">
                      {index + 1}. {step.actionType}
                    </span>
                    {step.input && Object.keys(step.input).length > 0 && (
                      <pre className="mt-1 overflow-x-auto rounded-lg bg-slate-bg px-2 py-1 text-[11px] text-dark">
                        {JSON.stringify(step.input, null, 2)}
                      </pre>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <p className="mb-3 text-xs leading-relaxed text-dark">
            L'approbation exécutera exactement ce plan, même si l'automation a été modifiée depuis le déclenchement de
            ce run.
          </p>
          <textarea
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Raison (optionnel)"
            className="mb-3 w-full rounded-xl border border-border px-3 py-2 text-sm focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/30"
            rows={2}
          />
          <div className="flex gap-2">
            <Button variant="primary" size="sm" loading={busy} onClick={() => void handleApprove()}>
              Approuver et exécuter
            </Button>
            <Button variant="outline" size="sm" loading={busy} onClick={() => void handleReject()}>
              Rejeter
            </Button>
          </div>
        </Card>
      )}

      {run.status === 'cancelled' && (
        <Card className="mb-6 p-4 text-sm text-dark bg-slate-bg">
          Ce run a été rejeté{run.approvalReason ? ` : ${run.approvalReason}` : ''} — aucune étape n'a été exécutée.
        </Card>
      )}

      {run.status === 'skipped' && (
        <Card className="mb-6 p-4 text-sm text-dark bg-slate-bg">
          Ce run a été ignoré{run.errorMessage ? ` : ${run.errorMessage}` : ' (conditions non remplies)'}.
        </Card>
      )}

      <div className="mb-4">
        <h2 className="text-lg font-bold text-navy">Étapes</h2>
      </div>

      {steps.length === 0 ? (
        <p className="text-sm text-muted">Aucune étape exécutée pour ce run.</p>
      ) : (
        <div>
          {steps.map((step) => (
            <StepTimelineItem key={step.id} step={step} />
          ))}
        </div>
      )}
    </div>
  )
}
