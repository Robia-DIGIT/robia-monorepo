import { useCallback, useEffect, useMemo, useState } from 'react'
import { AlertCircle, Download, Play, RefreshCw, Settings2, ShieldCheck } from 'lucide-react'

import { Button, Card, Badge, PageHeader, ProgressBar, EmptyState } from '../components/ui'
import WebsiteSelector from '../components/WebsiteSelector'
import { useWebsiteContext } from '../components/WebsiteContext'
import {
  exportActionPlan,
  generateActions,
  getCurrentOrganization,
  getLatestAudit,
  listActions,
  listDocuments,
  listOpportunities,
  listValidations,
  updateActionStatus,
  actionStatusLabel,
  actionProgressPct,
  type ActionItem,
  type ValidationLog,
} from '../lib/api'

function ActionCard({ item, onUpdate }: { item: ActionItem; onUpdate: (id: string, status: string) => Promise<void> }) {
  const { label: statusLabel, badge } = actionStatusLabel(item.status)
  const progress = actionProgressPct(item.status)
  const dotColor =
    progress >= 100 ? 'bg-teal' :
    progress >= 50 ? 'bg-[#1D4ED8]' :
    progress >= 20 ? 'bg-[#94A3B8]' :
    'bg-red-500'

  return (
    <Card className="p-5 flex flex-col gap-4 hover:shadow-md hover:border-[#CBD5E1] transition-all duration-200 group">
      <div className="flex items-start justify-between">
        <div>
          <div className="font-semibold text-dark text-sm">{item.title ?? 'Action à exécuter'}</div>
          <div className="text-xs text-muted mt-0.5">{item.priority ?? 'Priorité backend'}</div>
        </div>
        <div className="flex items-center gap-1.5">
          <div className={`w-1.5 h-1.5 rounded-full ${dotColor} ${progress >= 50 && progress < 100 ? 'animate-pulse' : ''}`} />
          <Badge variant={badge}>{statusLabel}</Badge>
        </div>
      </div>

      <div>
        <div className="text-xs text-muted mb-2">Échéance: {item.dueDate ?? 'Non définie'}</div>
        <ProgressBar value={progress} color={
          progress >= 80 ? '#14B8A6' :
          progress >= 40 ? '#1D4ED8' :
          progress >= 20 ? '#94A3B8' :
          '#EF4444'
        } showValue height="h-1.5" />
      </div>

      <div className="grid grid-cols-3 gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button variant="outline" size="sm" icon={<Settings2 size={12} />} onClick={() => void onUpdate(String(item.id), 'in_progress')}>En cours</Button>
        <Button variant="primary" size="sm" icon={<ShieldCheck size={12} />} onClick={() => void onUpdate(String(item.id), 'done')}>Terminer</Button>
        <Button variant="ghost" size="sm" icon={<Play size={12} />} onClick={() => void onUpdate(String(item.id), 'planned')}>Planifier</Button>
      </div>
    </Card>
  )
}

export default function PageExecution() {
  const [organizationName, setOrganizationName] = useState('')
  const { activeWebsiteId, activeWebsite } = useWebsiteContext()
  const [actions, setActions] = useState<ActionItem[]>([])
  const [validations, setValidations] = useState<ValidationLog[]>([])
  const [sourceOpportunityId, setSourceOpportunityId] = useState('')
  const [opportunityCount, setOpportunityCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const pendingCount = useMemo(() => actions.filter((a) => actionProgressPct(a.status) < 50 && actionProgressPct(a.status) > 5).length, [actions])
  const activeCount = useMemo(() => actions.filter((a) => {
    const p = actionProgressPct(a.status)
    return p >= 50 && p < 100
  }).length, [actions])
  const doneCount = useMemo(() => actions.filter((a) => actionProgressPct(a.status) >= 100).length, [actions])
  const errorCount = useMemo(() => actions.filter((a) => actionProgressPct(a.status) <= 5 && a.status.toLowerCase().includes('error')).length, [actions])

  const loadData = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const organization = await getCurrentOrganization()
      const audit = activeWebsiteId ? await getLatestAudit(activeWebsiteId) : null
      const opportunities = audit?.id ? await listOpportunities(String(audit.id)) : []
      const opportunityIds = new Set(opportunities.map((item) => String(item.id)))
      const [allActions, allValidations, documentGroups] = await Promise.all([
        listActions(),
        listValidations(),
        Promise.all(opportunities.map((item) => listDocuments(String(item.id)).catch(() => []))),
      ])
      const documentIds = new Set(documentGroups.flat().map((item) => String(item.id)))

      setOrganizationName(organization.name ?? 'Organisation')
      setSourceOpportunityId(opportunities[0]?.id ? String(opportunities[0].id) : '')
      setActions(allActions.filter((item) => opportunityIds.has(String(item.opportunityId))))
      setValidations(allValidations.filter((item) => documentIds.has(String(item.documentId))))
      setOpportunityCount(opportunities.length)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Impossible de charger les actions.')
    } finally {
      setLoading(false)
    }
  }, [activeWebsiteId])

  useEffect(() => {
    void loadData()
  }, [loadData])

  const handleGenerate = async () => {
    const firstOpportunityId = sourceOpportunityId || actions.find((item) => item.opportunityId)?.opportunityId

    if (!firstOpportunityId) {
      setError('Aucune opportunité liée trouvée pour générer des actions.')
      return
    }

    setBusy(true)
    setError('')

    try {
      setActions(await generateActions(firstOpportunityId))
    } catch (generationError) {
      setError(generationError instanceof Error ? generationError.message : 'Impossible de générer les actions.')
    } finally {
      setBusy(false)
    }
  }

  const handleExport = async () => {
    setBusy(true)
    setError('')

    try {
      const blob = await exportActionPlan(activeWebsiteId)
      const file = new Blob([blob], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(file)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = `robia-action-plan-${Date.now()}.pdf`
      anchor.click()
      window.URL.revokeObjectURL(url)
    } catch (exportError) {
      setError(exportError instanceof Error ? exportError.message : "Impossible d'exporter le plan.")
    } finally {
      setBusy(false)
    }
  }

  const handleUpdateStatus = async (id: string, status: string) => {
    setError('')

    try {
      const updated = await updateActionStatus(id, status)
      setActions((current) => current.map((item) => (item.id === id ? { ...item, ...updated } : item)))
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'Impossible de mettre à jour le statut.')
    }
  }

  if (loading) {
    return <div className="p-6 lg:p-8 max-w-7xl mx-auto"><Card className="p-8"><div className="h-8 w-80 bg-slate-100 rounded-lg" /></Card></div>
  }

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto animate-slide-up">
      <PageHeader
        title="Exécution automatisée"
        subtitle={`Actions dédiées à ${activeWebsite?.name ?? activeWebsite?.url ?? "ce site"} · ${organizationName}`}
        actions={
          <>
            {errorCount > 0 && (
              <Button variant="danger" size="sm" icon={<AlertCircle size={14} />}>
                {errorCount} erreur{errorCount > 1 ? 's' : ''}
              </Button>
            )}
            <Button variant="outline" size="sm" icon={<Download size={14} />} onClick={handleExport} loading={busy}>Exporter</Button>
            <Button variant="primary" size="sm" icon={<RefreshCw size={14} />} loading={busy} onClick={handleGenerate}>Synchroniser</Button>
          </>
        }
      />

      <WebsiteSelector className="mb-6 md:max-w-xl" />

      {error && <div className="mb-6"><Card className="p-4 text-sm text-red-700 bg-red-50 border-red-200">{error}</Card></div>}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <Card className="p-4">
          <div className="text-2xl font-bold" style={{ color: '#14B8A6' }}>{activeCount}</div>
          <div className="text-xs text-muted mt-1">Intégrations actives</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold" style={{ color: '#1D4ED8' }}>{pendingCount}</div>
          <div className="text-xs text-muted mt-1">En attente</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold" style={{ color: '#64748B' }}>{actions.length}</div>
          <div className="text-xs text-muted mt-1">Actions générées</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold" style={{ color: '#EF4444' }}>{validations.length}</div>
          <div className="text-xs text-muted mt-1">Validations</div>
        </Card>
      </div>

      {doneCount > 0 && (
        <div className="mb-6">
          <Card className="p-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <div className="text-sm font-semibold text-dark">Avancement global</div>
                <div className="text-xs text-muted mt-0.5">{doneCount} action{doneCount > 1 ? 's' : ''} terminée{doneCount > 1 ? 's' : ''} sur {actions.length}</div>
              </div>
              <div className="w-64">
                <ProgressBar value={actions.length > 0 ? Math.round((doneCount / actions.length) * 100) : 0} showValue color="#14B8A6" />
              </div>
            </div>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {actions.length === 0 ? (
          <div className="lg:col-span-3">
            <EmptyState
              icon={<RefreshCw size={18} />}
              title="Aucune action disponible"
              description={`Le backend ne renvoie pas encore de plan d'action pour ce compte. Opportunités connues: ${opportunityCount}.`}
              action={<Button variant="primary" onClick={handleGenerate}>Générer les actions</Button>}
            />
          </div>
        ) : (
          actions.map((item) => <ActionCard key={String(item.id)} item={item} onUpdate={handleUpdateStatus} />)
        )}
      </div>
    </div>
  )
}
