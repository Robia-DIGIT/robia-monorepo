import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Pencil } from 'lucide-react'

import { Badge, Button, Card, EmptyState, PageHeader } from '../components/ui'
import {
  automationModeLabel,
  automationTriggerLabel,
  getAutomation,
  listAutomationRuns,
  runStatusLabel,
  setAutomationEnabled,
  triggerAutomation,
  type Automation,
  type AutomationRun,
} from '../lib/api'

function formatDate(value: string | null) {
  if (!value) return '—'
  return new Date(value).toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function PageOpsAutomationDetail() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const [automation, setAutomation] = useState<Automation | null>(null)
  const [runs, setRuns] = useState<AutomationRun[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const loadData = async () => {
    setLoading(true)
    setError('')
    try {
      const [automationData, runsData] = await Promise.all([getAutomation(id), listAutomationRuns(id)])
      setAutomation(automationData)
      setRuns(runsData)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Impossible de charger cette automatisation.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const handleToggle = async () => {
    if (!automation) return
    setBusy(true)
    setError('')
    try {
      setAutomation(await setAutomationEnabled(automation.id, !automation.enabled))
    } catch (toggleError) {
      setError(toggleError instanceof Error ? toggleError.message : "Impossible de modifier l'automatisation.")
    } finally {
      setBusy(false)
    }
  }

  const handleRun = async () => {
    if (!automation) return
    setBusy(true)
    setError('')
    try {
      const run = await triggerAutomation(automation.id)
      navigate(`/ops/automations/runs/${run.id}`)
    } catch (runError) {
      setError(runError instanceof Error ? runError.message : "Impossible de lancer l'automatisation.")
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6 lg:p-8 max-w-5xl mx-auto">
        <Card className="p-8">
          <div className="h-8 w-72 bg-slate-100 rounded-lg" />
        </Card>
      </div>
    )
  }

  if (!automation) {
    return (
      <div className="p-6 lg:p-8 max-w-5xl mx-auto">
        <Card className="p-6 text-sm text-red-700 bg-red-50 border-red-200">
          {error || 'Automatisation non trouvée.'}
        </Card>
      </div>
    )
  }

  const mode = automationModeLabel(automation)

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto animate-slide-up">
      <Link to="/ops/automations" className="mb-4 inline-flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-navy">
        <ArrowLeft size={14} /> Retour aux automatisations
      </Link>

      <PageHeader
        title={automation.name}
        subtitle={automation.description ?? undefined}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" icon={<Pencil size={14} />} onClick={() => navigate(`/ops/automations/${automation.id}/edit`)}>
              Modifier
            </Button>
            <Button variant="outline" size="sm" loading={busy} onClick={() => void handleToggle()}>
              {automation.enabled ? 'Désactiver' : 'Activer'}
            </Button>
            <Button variant="primary" size="sm" loading={busy} onClick={() => void handleRun()}>
              Lancer maintenant
            </Button>
          </div>
        }
      />

      {error && (
        <div className="mb-6">
          <Card className="p-4 text-sm text-red-700 bg-red-50 border-red-200">{error}</Card>
        </div>
      )}

      <Card className="mb-6 p-5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={automation.enabled ? 'teal' : 'gray'}>{automation.enabled ? 'Activée' : 'Désactivée'}</Badge>
          <Badge variant={mode.variant}>{mode.label}</Badge>
          <Badge variant="gray">{automationTriggerLabel(automation.trigger)}</Badge>
        </div>
        <dl className="mt-4 grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-[10px] font-bold uppercase tracking-wide text-muted">Dernière exécution</dt>
            <dd className="mt-1 text-dark">{formatDate(automation.lastRunAt)}</dd>
          </div>
          <div>
            <dt className="text-[10px] font-bold uppercase tracking-wide text-muted">Étapes</dt>
            <dd className="mt-1 text-dark">{automation.steps.length} action(s) : {automation.steps.map((s) => s.actionType).join(', ')}</dd>
          </div>
        </dl>
      </Card>

      <div className="mb-4">
        <h2 className="text-lg font-bold text-navy">Historique des exécutions</h2>
      </div>

      {runs.length === 0 ? (
        <EmptyState
          icon={<Pencil size={18} />}
          title="Aucune exécution"
          description="Lancez cette automatisation pour voir apparaître son historique ici."
        />
      ) : (
        <div className="space-y-3">
          {runs.map((run) => {
            const status = runStatusLabel(run.status)
            return (
              <Link key={run.id} to={`/ops/automations/runs/${run.id}`}>
                <Card className="p-4 hover:border-teal transition-colors" hover>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={status.variant}>{status.label}</Badge>
                      <span className="text-xs text-muted">Déclenchement : {run.triggerType}</span>
                    </div>
                    <span className="text-xs text-muted">{formatDate(run.createdAt)}</span>
                  </div>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
