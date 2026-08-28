import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, CheckCircle2, Filter, Clock, MapPin, Radar, Zap } from 'lucide-react'

import { Button, Card, Badge, EmptyState } from '../components/ui'
import WebsiteSelector from '../components/WebsiteSelector'
import { useWebsiteContext } from '../components/WebsiteContext'
import {
  generateOpportunities,
  getCurrentOrganization,
  getLatestAudit,
  listOpportunities,
  oppImpact,
  oppEffort,
  oppIsDone,
  oppPriorityLabel,
  effortLabel,
  type Opportunity,
} from '../lib/api'

function ImpactMeter({ value }: { value: number }) {
  const color = value >= 80 ? '#F97316' : value >= 60 ? '#14B8A6' : '#94A3B8'

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-border-light rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${Math.min(100, value)}%`, backgroundColor: color }} />
      </div>
      <span className="text-xs font-bold tabular-nums" style={{ color }}>{value}</span>
    </div>
  )
}

function OppCard({ opp, onToggle }: { opp: Opportunity; onToggle: (id: string) => void }) {
  const impact = oppImpact(opp)
  const priority = oppPriorityLabel(impact)
  const done = oppIsDone(opp)

  return (
    <article className={`group border-l-2 px-4 py-4 transition-colors ${done ? 'border-teal bg-teal-light/25' : priority.variant === 'orange' ? 'border-orange hover:bg-orange-light/15' : 'border-border hover:border-teal hover:bg-slate-bg'}`}>
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant={priority.variant}>{priority.label}</Badge>
          <Badge variant="gray">{opp.category ?? 'Divers'}</Badge>
        </div>
        {done && <CheckCircle2 size={18} className="text-teal shrink-0" />}
      </div>
      <h3 className="font-semibold text-dark text-sm mb-1">{opp.title ?? 'Opportunité sans titre'}</h3>
      <p className="text-xs text-muted leading-relaxed mb-3">{opp.description ?? 'Détail fourni par le backend.'}</p>
      <div className="mb-3">
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-[10px] text-[#94A3B8] uppercase tracking-wide">Impact potentiel</span>
          <div className="flex items-center gap-1 text-[10px] text-muted">
            <Clock size={10} />
            Effort: <span className="font-medium">{effortLabel(oppEffort(opp))}</span>
          </div>
        </div>
        <ImpactMeter value={impact} />
      </div>
      <Button
        variant={done ? 'outline' : 'primary'}
        size="sm"
        className="w-full"
        onClick={() => onToggle(String(opp.id))}
        icon={done ? undefined : <ArrowRight size={12} />}
      >
        {done ? '✓ Réalisé' : 'Prendre en charge'}
      </Button>
    </article>
  )
}

function OppColumn({ title, opps, total, onToggle }: { title: string; opps: Opportunity[]; total: number; onToggle: (id: string) => void }) {
  return (
    <section className="border-t border-border pt-5">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="font-semibold text-dark">{title}</h2>
          <p className="text-xs text-muted mt-0.5">{opps.length} opportunités · Impact moy. {opps.length > 0 ? Math.round(opps.reduce((a, o) => a + oppImpact(o), 0) / opps.length) : 0}</p>
        </div>
        <div className="text-2xl font-bold text-dark">+{total}<span className="text-sm font-normal text-muted">% pot.</span></div>
      </div>
      <div className="space-y-3 flex-1">
        {opps.length === 0 ? (
          <EmptyState
            icon={<Zap size={18} />}
            title="Aucune opportunité"
            description="Lancez une génération depuis un audit pour obtenir des actions à traiter."
          />
        ) : (
          opps.map((opp) => <OppCard key={String(opp.id)} opp={opp} onToggle={onToggle} />)
        )}
      </div>
    </section>
  )
}

export default function PageOpportunites() {
  const [organizationName, setOrganizationName] = useState('')
  const { activeWebsite, activeWebsiteId: selectedWebsiteId } = useWebsiteContext()
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [latestAuditId, setLatestAuditId] = useState('')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const activeOpps = useMemo(() => opportunities.filter((opp) => !oppIsDone(opp)), [opportunities])
  const doneOpps = useMemo(() => opportunities.filter((opp) => oppIsDone(opp)), [opportunities])
  const totalImpactPotential = useMemo(() => Math.round(activeOpps.reduce((a, o) => a + oppImpact(o), 0)), [activeOpps])
  const criticalCount = useMemo(() => activeOpps.filter((opp) => oppImpact(opp) >= 80).length, [activeOpps])
  const topOpportunity = useMemo(() => activeOpps.slice().sort((left, right) => oppImpact(right) - oppImpact(left))[0] ?? null, [activeOpps])

  const categorized = useMemo(() => {
    const groups = new Map<string, Opportunity[]>()
    for (const opp of activeOpps) {
      const cat = opp.category?.trim() || 'Divers'
      if (!groups.has(cat)) groups.set(cat, [])
      groups.get(cat)!.push(opp)
    }
    const entries = Array.from(groups.entries())
    if (entries.length === 0) return []
    if (entries.length === 1) {
      const [cat, items] = entries[0]
      const mid = Math.ceil(items.length / 2)
      return [
        { category: `${cat} — A`, items: items.slice(0, mid) },
        { category: `${cat} — B`, items: items.slice(mid) },
      ]
    }
    return entries.map(([category, items]) => ({ category, items }))
  }, [activeOpps])

  const loadData = async () => {
    setLoading(true)
    setError('')

    try {
      const org = await getCurrentOrganization()
      setOrganizationName(org.name ?? 'Organisation')

      if (selectedWebsiteId) {
        const audit = await getLatestAudit(selectedWebsiteId)
        setLatestAuditId(audit.id ?? '')
        setOpportunities(audit.id ? await listOpportunities(String(audit.id)) : [])
      } else {
        setLatestAuditId('')
        setOpportunities([])
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Impossible de charger les opportunités.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedWebsiteId])

  const handleGenerate = async () => {
    if (!latestAuditId) {
      setError('Lancez d\'abord un audit avant de générer des opportunités.')
      return
    }

    setBusy(true)
    setError('')

    try {
      setOpportunities(await generateOpportunities({ auditId: latestAuditId }))
    } catch (generationError) {
      setError(generationError instanceof Error ? generationError.message : 'Impossible de générer les opportunités.')
    } finally {
      setBusy(false)
    }
  }

  const toggleDone = (id: string) => {
    setOpportunities((current) => current.map((opp) => {
      if (opp.id !== id) return opp
      const wasDone = oppIsDone(opp)
      return { ...opp, status: wasDone ?   'open' : 'done' }
    }))
  }

  if (loading) {
    return <div className="p-6 lg:p-8 max-w-7xl mx-auto"><Card className="p-8"><div className="h-8 w-72 bg-slate-100 rounded-lg" /></Card></div>
  }

  const colA = categorized[0] ?? { category: 'Visibilité & Présence', items: [] }
  const colB = categorized[1] ?? { category: 'Contenu & Technique', items: [] }

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto animate-slide-up">
      <header className="mb-7 border-b border-border pb-6">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div><p className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-orange-dark"><Radar size={15} /> Signal d’opportunités ROBIA</p><h1 className="text-[30px] font-bold leading-tight tracking-[-0.035em] text-navy md:text-[36px]">Où gagner en visibilité maintenant ?</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-muted">Les recommandations sont classées selon leur impact potentiel pour {organizationName}, sans mélanger les données d’un autre site.</p></div>
          <div className="flex flex-wrap gap-2"><Button variant="outline" size="sm" icon={<Filter size={14} />}>Filtrer</Button><Button variant="primary" size="sm" loading={busy} icon={<Zap size={14} />} onClick={handleGenerate}>Actualiser les opportunités</Button></div>
        </div>
      </header>

      <div className="mb-6 flex flex-col gap-3 border-l-2 border-teal bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between"><div className="flex min-w-0 items-center gap-3"><MapPin size={17} className="shrink-0 text-teal-dark" /><div className="min-w-0"><p className="text-[10px] font-bold uppercase tracking-wide text-muted">Site analysé</p><p className="truncate text-sm font-bold text-navy">{activeWebsite?.name ?? activeWebsite?.url ?? 'Aucun site sélectionné'}</p></div></div><WebsiteSelector className="w-full sm:w-auto sm:min-w-72" /></div>

      {error && <div className="mb-6"><Card className="p-4 text-sm text-red-700 bg-red-50 border-red-200">{error}</Card></div>}

      <section className="mb-7 grid border-y border-border bg-white sm:grid-cols-3">
        <div className="border-b border-border px-1 py-5 sm:border-r sm:border-b-0 sm:pr-5"><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted">Impact potentiel</p><p className="mt-2 text-[30px] font-bold tracking-[-0.04em] text-teal-dark">+{totalImpactPotential}<span className="text-sm text-muted">%</span></p><p className="mt-1 text-xs text-muted">Gain cumulé estimé</p></div>
        <div className="border-b border-border px-1 py-5 sm:border-r sm:border-b-0 sm:px-5"><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted">Priorité immédiate</p><p className="mt-2 text-[30px] font-bold tracking-[-0.04em] text-orange">{criticalCount}</p><p className="mt-1 text-xs text-muted">Impact supérieur ou égal à 80</p></div>
        <div className="px-1 py-5 sm:pl-5"><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted">Progression</p><p className="mt-2 text-[30px] font-bold tracking-[-0.04em] text-navy">{doneOpps.length}</p><p className="mt-1 text-xs text-muted">Opportunités réalisées</p></div>
      </section>

      {topOpportunity && <section className="mb-8 grid border-l-2 border-orange bg-orange-light/30 p-5 md:grid-cols-[1fr_auto] md:items-center md:gap-8"><div><div className="flex flex-wrap items-center gap-2"><span className="text-[10px] font-bold uppercase tracking-[0.14em] text-orange-dark">Meilleure prochaine action</span><Badge variant="gray">{topOpportunity.category || 'Divers'}</Badge></div><h2 className="mt-2 text-lg font-bold text-navy">{topOpportunity.title}</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-muted">{topOpportunity.description}</p><div className="mt-3 flex max-w-sm items-center gap-3"><span className="text-[10px] font-bold uppercase tracking-wide text-muted">Impact</span><ImpactMeter value={oppImpact(topOpportunity)} /><span className="text-xs text-muted">Effort {effortLabel(oppEffort(topOpportunity))}</span></div></div><Button variant="primary" className="mt-5 md:mt-0" iconRight={<ArrowRight size={14} />} onClick={() => toggleDone(String(topOpportunity.id))}>Prendre en charge</Button></section>}

      <div className="mb-5"><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted">Toutes les opportunités</p><h2 className="mt-1 text-xl font-bold text-navy">File d’actions par signal</h2></div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <OppColumn
          title={colA.category}
          opps={colA.items}
          total={Math.round(colA.items.reduce((a, o) => a + oppImpact(o), 0))}
          onToggle={toggleDone}
        />
        <OppColumn
          title={colB.category}
          opps={colB.items}
          total={Math.round(colB.items.reduce((a, o) => a + oppImpact(o), 0))}
          onToggle={toggleDone}
        />
      </div>

      {doneOpps.length > 0 && (
        <div className="mt-6">
          <Card className="p-6">
            <h3 className="font-semibold text-dark mb-4">Actions marquées comme réalisées</h3>
            <div className="grid gap-3 md:grid-cols-2">
              {doneOpps.map((opp) => (
                <div key={String(opp.id)} className="rounded-xl border border-border p-4 text-sm text-muted">
                  {opp.title ?? 'Opportunité'}
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
