import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Workflow } from 'lucide-react'

import { Badge, Button, Card, EmptyState, PageHeader } from '../components/ui'
import {
  automationModeLabel,
  automationTriggerLabel,
  listAutomations,
  setAutomationEnabled,
  triggerAutomation,
  type Automation,
} from '../lib/api'
import { formatNextRunAt } from '../lib/cron-schedule'

function formatDate(value: string | null) {
  if (!value) return 'Jamais exécutée'
  return new Date(value).toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function AutomationCard({
  automation,
  onToggle,
  onRun,
  busy,
}: {
  automation: Automation
  onToggle: (id: string, enabled: boolean) => void
  onRun: (id: string) => void
  busy: boolean
}) {
  const mode = automationModeLabel(automation)
  return (
    <Card className="p-5">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="mb-1.5 flex flex-wrap items-center gap-2">
            <Badge variant={automation.enabled ? 'teal' : 'gray'}>
              {automation.enabled ? 'Activée' : 'Désactivée'}
            </Badge>
            <Badge variant={mode.variant}>{mode.label}</Badge>
            <Badge variant="gray">{automationTriggerLabel(automation.trigger)}</Badge>
          </div>
          <Link to={`/ops/automations/${automation.id}`} className="text-sm font-semibold text-navy hover:underline">
            {automation.name}
          </Link>
          {automation.description && (
            <p className="mt-1 text-xs leading-relaxed text-muted">{automation.description}</p>
          )}
        </div>
      </div>
      <div className={automation.trigger.type === 'scheduled' ? 'mb-1' : 'mb-4'}>
        <span className="text-xs text-muted">Dernière exécution : {formatDate(automation.lastRunAt)}</span>
      </div>
      {automation.trigger.type === 'scheduled' && (
        <div className="mb-4 space-y-0.5 text-xs text-muted">
          <div>Fuseau : {automation.trigger.timezone ?? 'UTC'}</div>
          <div>Prochaine exécution : {formatNextRunAt(automation.nextRunAt, automation.trigger.timezone)}</div>
        </div>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          loading={busy}
          onClick={() => onToggle(automation.id, !automation.enabled)}
        >
          {automation.enabled ? 'Désactiver' : 'Activer'}
        </Button>
        <Button variant="primary" size="sm" loading={busy} onClick={() => onRun(automation.id)}>
          Lancer maintenant
        </Button>
        <Link to={`/ops/automations/${automation.id}`} className="ml-auto text-xs font-semibold text-electric hover:underline">
          Voir les exécutions
        </Link>
      </div>
    </Card>
  )
}

export default function PageOpsAutomations() {
  const navigate = useNavigate()
  const [automations, setAutomations] = useState<Automation[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState('')
  const [error, setError] = useState('')

  const loadData = async () => {
    setLoading(true)
    setError('')
    try {
      setAutomations(await listAutomations())
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Impossible de charger les automatisations.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [])

  const handleToggle = async (id: string, enabled: boolean) => {
    setBusyId(id)
    setError('')
    try {
      const updated = await setAutomationEnabled(id, enabled)
      setAutomations((current) => current.map((item) => (item.id === id ? updated : item)))
    } catch (toggleError) {
      setError(toggleError instanceof Error ? toggleError.message : "Impossible de modifier l'automatisation.")
    } finally {
      setBusyId('')
    }
  }

  const handleRun = async (id: string) => {
    setBusyId(id)
    setError('')
    try {
      const run = await triggerAutomation(id)
      navigate(`/ops/automations/runs/${run.id}`)
    } catch (runError) {
      setError(runError instanceof Error ? runError.message : "Impossible de lancer l'automatisation.")
    } finally {
      setBusyId('')
    }
  }

  if (loading) {
    return (
      <div className="p-6 lg:p-8 max-w-7xl mx-auto">
        <Card className="p-8">
          <div className="h-8 w-72 bg-slate-100 rounded-lg" />
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto animate-slide-up">
      <PageHeader
        title="Automatisations ROBIA"
        subtitle="Moteur d'automatisation interne : conditions déterministes, allowlist d'actions sûres, validation humaine pour tout ce qui est sensible."
        actions={
          <Button variant="primary" icon={<Plus size={14} />} onClick={() => navigate('/ops/automations/new')}>
            Nouvelle automation
          </Button>
        }
      />

      {error && (
        <div className="mb-6">
          <Card className="p-4 text-sm text-red-700 bg-red-50 border-red-200">{error}</Card>
        </div>
      )}

      {automations.length === 0 ? (
        <EmptyState
          icon={<Workflow size={22} />}
          title="Aucune automatisation"
          description="Créez votre première automatisation ROBIA — diagnostic de site, régénération d'opportunités, rapport ou tâche interne."
          action={
            <Button variant="primary" icon={<Plus size={14} />} onClick={() => navigate('/ops/automations/new')}>
              Nouvelle automation
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {automations.map((automation) => (
            <AutomationCard
              key={automation.id}
              automation={automation}
              onToggle={(id, enabled) => void handleToggle(id, enabled)}
              onRun={(id) => void handleRun(id)}
              busy={busyId === automation.id}
            />
          ))}
        </div>
      )}
    </div>
  )
}
