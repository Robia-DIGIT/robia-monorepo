import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, CheckCircle2, Filter, Clock, Zap } from 'lucide-react'

import { Button, Card, Badge, PageHeader, EmptyState } from '../components/ui'
import {
  generateOpportunities,
  getCurrentOrganization,
  getLatestAudit,
  listOpportunities,
  listWebsites,
  oppImpact,
  oppEffort,
  oppIsDone,
  oppPriorityLabel,
  effortLabel,
  type Opportunity,
  type Website,
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
    <div className={`p-4 rounded-xl border transition-all duration-200 group ${done ? 'bg-teal-light/30 border-[#99F6E4]' : 'border-border-light hover:border-border hover:bg-slate-bg'}`}>
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
    </div>
  )
}

function OppColumn({ title, opps, total, onToggle }: { title: string; opps: Opportunity[]; total: number; onToggle: (id: string) => void }) {
  return (
    <Card className="p-6 flex flex-col">
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
    </Card>
  )
}

export default function PageOpportunites() {
  const [organizationName, setOrganizationName] = useState('')
  const [websites, setWebsites] = useState<Website[]>([])
  const [selectedWebsiteId, setSelectedWebsiteId] = useState('')
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [latestAuditId, setLatestAuditId] = useState('')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const activeOpps = useMemo(() => opportunities.filter((opp) => !oppIsDone(opp)), [opportunities])
  const doneOpps = useMemo(() => opportunities.filter((opp) => oppIsDone(opp)), [opportunities])
  const totalImpactPotential = useMemo(() => Math.round(activeOpps.reduce((a, o) => a + oppImpact(o), 0)), [activeOpps])
  const criticalCount = useMemo(() => activeOpps.filter((opp) => oppImpact(opp) >= 80).length, [activeOpps])

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
      const [org, websiteList] = await Promise.all([getCurrentOrganization(), listWebsites()])
      setOrganizationName(org.name ?? 'Organisation')
      setWebsites(websiteList)

      const websiteId = selectedWebsiteId || websiteList[0]?.id || ''
      setSelectedWebsiteId(websiteId)

      if (websiteId) {
        const audit = await getLatestAudit(websiteId)
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
  }, [])

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
      <PageHeader
        title="Opportunités détectées"
        subtitle={`Classées par impact potentiel pour ${organizationName}`}
        badge={<span className="bg-orange-light text-[#C2410C] text-xs font-bold px-2.5 py-0.5 rounded-full border border-[#FDBA74]/60">{opportunities.length} détectées</span>}
        actions={
          <>
            <Button variant="outline" size="sm" icon={<Filter size={14} />}>Filtrer</Button>
            <Button variant="primary" size="sm" loading={busy} icon={<Zap size={14} />} onClick={handleGenerate}>Régénérer</Button>
          </>
        }
      />

      {error && <div className="mb-6"><Card className="p-4 text-sm text-red-700 bg-red-50 border-red-200">{error}</Card></div>}

      <div className="mb-4 flex flex-wrap items-center gap-3 text-xs text-muted">
        <span>Site actif :</span>
        <select value={selectedWebsiteId} onChange={(event) => setSelectedWebsiteId(event.target.value)} className="min-w-0 rounded-xl border border-border bg-white px-3 py-2 text-sm text-dark outline-none">
          <option value="">Sélectionner</option>
          {websites.map((website) => (
            <option key={website.id ?? website.url} value={website.id ?? ''}>{website.name ?? website.url ?? 'Site'}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card key="impact" className="p-4 text-center">
          <div className="text-2xl font-bold" style={{ color: '#14B8A6' }}>+{totalImpactPotential}%</div>
          <div className="text-xs text-muted mt-0.5">de visibilité potentielle</div>
          <div className="text-[10px] text-[#94A3B8] mt-1">Impact total cumulé</div>
        </Card>
        <Card key="critical" className="p-4 text-center">
          <div className="text-2xl font-bold" style={{ color: '#F97316' }}>{criticalCount}</div>
          <div className="text-xs text-muted mt-0.5">à traiter en priorité</div>
          <div className="text-[10px] text-[#94A3B8] mt-1">Opportunités critiques (≥80)</div>
        </Card>
        <Card key="done" className="p-4 text-center">
          <div className="text-2xl font-bold" style={{ color: '#1D4ED8' }}>{doneOpps.length}</div>
          <div className="text-xs text-muted mt-0.5">actions marqué·es</div>
          <div className="text-[10px] text-[#94A3B8] mt-1">Réalisées dans cette session</div>
        </Card>
      </div>

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
