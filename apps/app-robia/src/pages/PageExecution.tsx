import { useCallback, useEffect, useMemo, useState } from 'react'
import { AlertCircle, Download, MapPin, Play, Radar, RefreshCw, Settings2, ShieldCheck } from 'lucide-react'

import { Button, Card, Badge, ProgressBar, EmptyState } from '../components/ui'
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
  const completed = progress >= 100

  return (
    <article className={`border-l-2 px-4 py-4 transition-colors ${completed ? 'border-teal bg-teal-light/20' : progress >= 50 ? 'border-electric bg-white' : 'border-border bg-white hover:border-orange hover:bg-orange-light/10'}`}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2"><Badge variant={badge}>{statusLabel}</Badge><span className="text-[10px] font-bold uppercase tracking-wide text-muted">{item.priority ?? 'Priorité à définir'}</span></div>
          <h3 className="mt-2 text-sm font-bold text-navy">{item.title ?? 'Action à exécuter'}</h3>
          {item.description && <p className="mt-1 text-xs leading-5 text-muted">{item.description}</p>}
          <div className="mt-4 max-w-md"><div className="mb-1.5 flex justify-between text-[10px] text-muted"><span>Échéance : {item.dueDate ?? 'Non définie'}</span><span>{progress}%</span></div><ProgressBar value={progress} color={completed ? '#14B8A6' : progress >= 40 ? '#1D4ED8' : '#F97316'} height="h-1.5" /></div>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2 sm:max-w-56 sm:justify-end">
          <Button variant="outline" size="sm" icon={<Settings2 size={12} />} onClick={() => void onUpdate(String(item.id), 'in_progress')}>Démarrer</Button>
          <Button variant="primary" size="sm" icon={<ShieldCheck size={12} />} onClick={() => void onUpdate(String(item.id), 'done')}>Terminer</Button>
          <Button variant="ghost" size="sm" icon={<Play size={12} />} onClick={() => void onUpdate(String(item.id), 'planned')}>Planifier</Button>
        </div>
      </div>
    </article>
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
  const progressPct = actions.length > 0 ? Math.round((doneCount / actions.length) * 100) : 0
  const nextAction = useMemo(() => actions.find((item) => actionProgressPct(item.status) < 100) ?? null, [actions])

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
    <div className="mx-auto max-w-7xl animate-slide-up p-5 md:p-6 lg:p-8">
      <header className="mb-7 border-b border-border pb-6">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div><p className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-teal-dark"><Radar size={15} /> Plan d’action ROBIA</p><h1 className="text-[30px] font-bold leading-tight tracking-[-0.035em] text-navy md:text-[36px]">Transformer les signaux en résultats</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-muted">Chaque action appartient à {activeWebsite?.name ?? activeWebsite?.url ?? 'ce site'} et reste reliée à l’opportunité qui l’a déclenchée.</p></div>
          <div className="flex flex-wrap gap-2">{errorCount > 0 && <Button variant="danger" size="sm" icon={<AlertCircle size={14} />}>{errorCount} erreur{errorCount > 1 ? 's' : ''}</Button>}<Button variant="outline" size="sm" icon={<Download size={14} />} onClick={handleExport} loading={busy}>Exporter</Button><Button variant="primary" size="sm" icon={<RefreshCw size={14} />} loading={busy} onClick={handleGenerate}>Actualiser le plan</Button></div>
        </div>
      </header>

      <div className="mb-6 flex flex-col gap-3 border-l-2 border-teal bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between"><div className="flex min-w-0 items-center gap-3"><MapPin size={17} className="shrink-0 text-teal-dark" /><div className="min-w-0"><p className="text-[10px] font-bold uppercase tracking-wide text-muted">Contexte d’exécution</p><p className="truncate text-sm font-bold text-navy">{organizationName} · {activeWebsite?.url ?? 'Aucun site sélectionné'}</p></div></div><WebsiteSelector className="w-full sm:w-auto sm:min-w-72" /></div>

      {error && <div className="mb-6 border-l-2 border-red-500 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <section className="mb-7 grid border-y border-border bg-white sm:grid-cols-[1.2fr_repeat(3,0.8fr)]">
        <div className="border-b border-border px-1 py-5 sm:border-r sm:border-b-0 sm:pr-6"><div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.14em] text-muted"><span>Progression globale</span><span>{progressPct}%</span></div><div className="mt-4"><ProgressBar value={progressPct} color="#14B8A6" /></div><p className="mt-2 text-xs text-muted">{doneCount} terminée{doneCount > 1 ? 's' : ''} sur {actions.length}</p></div>
        <div className="border-b border-border px-1 py-5 sm:border-r sm:border-b-0 sm:px-5"><p className="text-[10px] font-bold uppercase tracking-wide text-muted">En cours</p><p className="mt-2 text-[28px] font-bold text-teal-dark">{activeCount}</p></div>
        <div className="border-b border-border px-1 py-5 sm:border-r sm:border-b-0 sm:px-5"><p className="text-[10px] font-bold uppercase tracking-wide text-muted">À démarrer</p><p className="mt-2 text-[28px] font-bold text-orange">{pendingCount}</p></div>
        <div className="px-1 py-5 sm:pl-5"><p className="text-[10px] font-bold uppercase tracking-wide text-muted">Validations</p><p className="mt-2 text-[28px] font-bold text-navy">{validations.length}</p></div>
      </section>

      {nextAction && <section className="mb-8 grid border-l-2 border-orange bg-orange-light/30 p-5 md:grid-cols-[1fr_auto] md:items-center md:gap-8"><div><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-orange-dark">À faire maintenant</p><h2 className="mt-2 text-lg font-bold text-navy">{nextAction.title}</h2><p className="mt-2 text-sm leading-6 text-muted">{nextAction.description ?? 'Cette action est la prochaine étape active du plan pour ce site.'}</p></div><Button variant="primary" className="mt-4 md:mt-0" icon={<Play size={14} />} onClick={() => void handleUpdateStatus(String(nextAction.id), 'in_progress')}>Démarrer cette action</Button></section>}

      <div className="mb-5"><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted">File d’exécution</p><h2 className="mt-1 text-xl font-bold text-navy">Toutes les actions du site</h2></div>
      <div className="space-y-3">
        {actions.length === 0 ? <EmptyState icon={<RefreshCw size={18} />} title="Aucune action disponible" description={`Générez un plan à partir des ${opportunityCount} opportunité(s) connues pour ce site.`} action={<Button variant="primary" onClick={handleGenerate}>Générer les actions</Button>} /> : actions.map((item) => <ActionCard key={String(item.id)} item={item} onUpdate={handleUpdateStatus} />)}
      </div>
    </div>
  )
}