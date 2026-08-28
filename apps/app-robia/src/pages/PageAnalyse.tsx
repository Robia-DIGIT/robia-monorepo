import { useEffect, useMemo, useState, type FormEvent } from 'react'
import {
  Activity,
  MapPin,
  Radar,
  ArrowRight,
  Eye,
  Search,
  TrendingUp,
  Users,
} from 'lucide-react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  PolarAngleAxis,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { Alert, Badge, Button, Card, EmptyState, ProgressBar, SearchBar, Tabs } from '../components/ui'
import { useWebsiteContext } from '../components/WebsiteContext'
import {
  createWebsite,
  generateOpportunities,
  getCurrentOrganization,
  getLatestAudit,
  listAudits,
  listOpportunities,
  runAudit,
  auditScore,
  auditSubscores,
  oppImpact,
  oppPriorityLabel,
  type Audit,
  type Opportunity,
  type Organization,
} from '../lib/api'

const tabs = ["Vue d'ensemble", 'Historique', 'Recommandations', 'Concurrents']

export default function PageAnalyse() {
  const [organization, setOrganization] = useState<Organization | null>(null)
  const { websites, activeWebsite, activeWebsiteId: selectedWebsiteId, setActiveWebsiteId: setSelectedWebsiteId, refreshWebsites } = useWebsiteContext()
  const [latestAudit, setLatestAudit] = useState<Audit | null>(null)
  const [audits, setAudits] = useState<Audit[]>([])
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [query, setQuery] = useState('')
  const [activeTab, setActiveTab] = useState(tabs[0])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [hasAnalyzed, setHasAnalyzed] = useState(false)

  const trendData = useMemo(() => {
    const source = audits.slice(0, 7).reverse()
    return source.length > 0
      ? source.map((audit, index) => ({
        month: `S${index + 1}`,
        score: auditScore(audit),
      }))
      : []
  }, [audits])

  const summaryScore = auditScore(latestAudit)
  const scoreLabel = summaryScore >= 75 ? 'Bon' : summaryScore >= 50 ? 'À améliorer' : 'Faible'
  const radialData = [{ name: 'Score', value: summaryScore, fill: '#14B8A6' }]
  const subscores = auditSubscores(latestAudit)

  const filteredRecommendations = useMemo(() => {
    return opportunities
      .slice()
      .sort((left, right) => oppImpact(right) - oppImpact(left))
      .slice(0, 5)
  }, [opportunities])

  const loadData = async () => {
    setLoading(true)
    setError('')

    try {
      const organizationData = await getCurrentOrganization()
      setOrganization(organizationData)

      if (selectedWebsiteId) {
        const [auditData, auditsData] = await Promise.all([
          getLatestAudit(selectedWebsiteId),
          listAudits(selectedWebsiteId),
        ])

        setLatestAudit(auditData)
        setAudits(auditsData)
        setOpportunities(auditData?.id ? await listOpportunities(String(auditData.id)) : [])
        setHasAnalyzed(Boolean(auditData?.id))
      } else {
        setLatestAudit(null)
        setAudits([])
        setOpportunities([])
        setHasAnalyzed(false)
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Impossible de charger les données.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedWebsiteId])

  // Clear the success notice on its own after a few seconds so it doesn't linger forever
  useEffect(() => {
    if (!notice) return
    const timeout = setTimeout(() => setNotice(''), 5000)
    return () => clearTimeout(timeout)
  }, [notice])

  const handleAnalyse = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    setNotice('')

    try {
      let websiteId = selectedWebsiteId

      if (query.trim()) {
        const website = await createWebsite({ url: query.trim() })
        websiteId = website.id ?? websiteId
        await refreshWebsites(websiteId)
      }

      if (!websiteId) {
        throw new Error('Créez ou sélectionnez un site avant de lancer une analyse.')
      }

      const audit = await runAudit({ websiteId })
      const generated = await generateOpportunities({ auditId: audit.id ?? '' })

      setSelectedWebsiteId(websiteId)
      setLatestAudit(audit)
      setAudits((current) => [audit, ...current.filter((item) => item.id !== audit.id)])
      setOpportunities(generated.length > 0 ? generated : audit.id ? await listOpportunities(String(audit.id)) : [])
      setHasAnalyzed(true)
      setNotice('Nouvelle analyse lancée et opportunités mises à jour.')
      setQuery('')
    } catch (analyseError) {
      setError(analyseError instanceof Error ? analyseError.message : "Impossible de lancer l'analyse.")
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-4" aria-busy="true" aria-live="polite">
        <span className="sr-only">Chargement des données d'analyse…</span>
        <Card className="p-8 animate-pulse">
          <div className="h-7 w-72 rounded-lg bg-slate-100" />
          <div className="mt-4 h-4 w-96 rounded-lg bg-slate-100" />
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="h-28 rounded-2xl bg-slate-100" />
            <div className="h-28 rounded-2xl bg-slate-100" />
            <div className="h-28 rounded-2xl bg-slate-100" />
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto animate-slide-up">
      <header className="mb-7 border-b border-border pb-6">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <p className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-teal-dark"><Radar size={15} /> Tableau de visibilité locale</p>
            <h1 className="text-[30px] font-bold leading-tight tracking-[-0.035em] text-navy md:text-[36px]">Bonjour, que voulez-vous améliorer aujourd’hui ?</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">ROBIA observe les signaux de {organization?.name ?? 'votre entreprise'}, mesure leur impact et transforme le prochain progrès en action claire.</p>
          </div>
          <div className="flex items-center gap-3 border-l-2 border-teal pl-4">
            <MapPin size={18} className="text-teal-dark" />
            <div><p className="text-[10px] font-bold uppercase tracking-wide text-muted">Zone locale</p><p className="text-sm font-semibold text-navy">{organization?.city ?? 'Localisation à définir'}</p></div>
          </div>
        </div>
      </header>

      <section className="mb-7 grid overflow-hidden rounded-xl border border-navy-light bg-navy lg:grid-cols-[1fr_260px]">
        <div className="p-5 md:p-7">
          <div className="mb-5 flex min-w-0 flex-wrap items-center gap-3">
            <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/45">Site observé</span>
            {websites.length > 0 ? <select id="website-select" value={selectedWebsiteId} onChange={(event) => setSelectedWebsiteId(event.target.value)} className="min-w-0 max-w-full border-0 border-b border-white/20 bg-transparent px-0 py-1 text-sm font-bold text-white outline-none focus:border-teal">
              {websites.map((website) => <option key={website.id ?? website.url} value={website.id ?? ''} className="text-dark">{website.name ?? website.url ?? 'Site'}</option>)}
            </select> : <span className="text-sm font-semibold text-white">Aucun site configuré</span>}
          </div>
          <h2 className="max-w-xl text-xl font-bold tracking-tight text-white md:text-2xl">{hasAnalyzed ? 'Actualiser le signal de visibilité' : 'Lancer votre premier diagnostic local'}</h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-white/55">{activeWebsite?.url ?? 'Ajoutez une URL pour mesurer sa présence, sa performance et ses opportunités locales.'}</p>
          <form onSubmit={handleAnalyse} className="mt-5 flex flex-col gap-3 sm:flex-row">
            <SearchBar value={query} onChange={(event) => setQuery(event.target.value)} placeholder="https://votre-site.fr" aria-label="URL du site à analyser" className="flex-1" />
            <Button variant="primary" size="lg" loading={busy} type="submit" disabled={busy || (!query.trim() && !selectedWebsiteId)} icon={<Search size={16} strokeWidth={2.5} />}>{busy ? 'Analyse en cours…' : hasAnalyzed ? 'Actualiser l’analyse' : 'Analyser ce site'}</Button>
          </form>
        </div>
        <div className="relative hidden min-h-56 overflow-hidden border-l border-white/10 lg:block" aria-hidden="true">
          <div className="absolute inset-0 opacity-25" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.12) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.12) 1px,transparent 1px)', backgroundSize: '28px 28px' }} />
          <div className="absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full border border-teal/15" />
          <div className="absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full border border-teal/30" />
          <div className="absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-teal text-lg font-bold text-white">{hasAnalyzed ? summaryScore : <MapPin size={22} />}</div>
          <span className="absolute bottom-5 left-0 right-0 text-center text-[10px] font-bold uppercase tracking-[0.16em] text-white/40">Signal ROBIA</span>
        </div>
      </section>

      {(error || notice) && (
        <div className="mb-6 space-y-3" role="status" aria-live="polite">
          {error && <Alert variant="error" title="Erreur">{error}</Alert>}
          {!error && notice && <Alert variant="success" title="Succès">{notice}</Alert>}
        </div>
      )}

      {!hasAnalyzed && !busy && (
        <div className="mb-6 rounded-xl border border-dashed border-border bg-white/80 p-8 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-light text-teal">
            <Search size={22} strokeWidth={2.5} />
          </div>
          <h2 className="mt-4 text-lg font-semibold text-dark">Aucune analyse à afficher</h2>
          <p className="mt-2 text-sm text-muted">Saisissez un site et lancez une analyse pour voir apparaître les scores et recommandations.</p>
        </div>
      )}

      {busy && (
        <div className="mb-6 rounded-xl border border-teal/20 bg-teal-light/30 p-8 shadow-sm" role="status" aria-live="polite">
          <div className="flex flex-col items-center text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-teal text-white shadow-lg shadow-teal/20">
              <Search size={22} strokeWidth={2.5} />
            </div>
            <h2 className="mt-4 text-xl font-semibold text-dark">Analyse en cours…</h2>
            <p className="mt-2 max-w-xl text-sm text-muted">
              ROBIA collecte les données, traite le site et prépare les recommandations en quelques secondes.
            </p>
            <div className="mt-5 flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full bg-teal animate-pulse" />
              <div className="h-2.5 w-2.5 rounded-full bg-teal/70 animate-pulse [animation-delay:120ms]" />
              <div className="h-2.5 w-2.5 rounded-full bg-teal/40 animate-pulse [animation-delay:240ms]" />
            </div>
          </div>
        </div>
      )}

      {hasAnalyzed && !busy && (
        <>
          <section className="mb-7 grid gap-0 overflow-hidden border-y border-border bg-white lg:grid-cols-[1.05fr_0.95fr]">
            <div className="flex items-center gap-6 border-b border-border px-1 py-6 lg:border-r lg:border-b-0 lg:pr-8">
              <div className="relative flex h-28 w-28 shrink-0 items-center justify-center rounded-full border-[10px] border-teal-light">
                <span className="text-[38px] font-bold tracking-[-0.06em] text-navy">{summaryScore}</span>
                <span className="absolute -bottom-2 rounded-sm bg-teal px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-white">sur 100</span>
              </div>
              <div><p className="text-[10px] font-bold uppercase tracking-[0.15em] text-teal-dark">ROBIA Visibility Score</p><h2 className="mt-2 text-xl font-bold text-navy">Visibilité {scoreLabel.toLowerCase()}</h2><p className="mt-2 max-w-sm text-sm leading-6 text-muted">Ce score synthétise les signaux locaux, le contenu, la technique et la capacité du site à être compris.</p></div>
            </div>
            <div className="grid sm:grid-cols-2">
              <div className="border-b border-border p-5 sm:border-r sm:border-b-0"><Eye size={18} className="text-teal-dark" /><p className="mt-5 text-[28px] font-bold tracking-tight text-navy">{summaryScore}<span className="text-sm text-muted">%</span></p><p className="mt-1 text-xs font-semibold text-muted">Visibilité mesurée</p></div>
              <div className="p-5"><Users size={18} className="text-orange" /><p className="mt-5 text-[28px] font-bold tracking-tight text-navy">{opportunities.length}</p><p className="mt-1 text-xs font-semibold text-muted">Opportunités détectées</p></div>
            </div>
          </section>

          <section className="mb-7 grid border-l-2 border-orange bg-orange-light/35 p-5 md:grid-cols-[1fr_auto] md:items-center md:gap-6">
            <div><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-orange-dark">Prochaine action recommandée</p><h2 className="mt-2 text-base font-bold text-navy">{filteredRecommendations[0]?.title ?? 'Consulter les signaux prioritaires du site'}</h2><p className="mt-1 text-sm leading-6 text-muted">{filteredRecommendations[0]?.description ?? 'ROBIA affichera ici l’action ayant le meilleur rapport impact / effort après l’analyse.'}</p></div>
            <Button variant="primary" className="mt-4 md:mt-0" iconRight={<ArrowRight size={14} />} onClick={() => setActiveTab('Recommandations')}>Voir les opportunités</Button>
          </section>

          <Card className="p-5 md:p-6 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-lg font-semibold text-dark">Évolution de la performance</h2>
                <p className="text-sm text-muted mt-0.5">Données issues des audits et des opportunités générées</p>
              </div>
              <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} />
            </div>

            {activeTab === "Vue d'ensemble" && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  {trendData.length === 0 ? (
                    <EmptyState
                      icon={<TrendingUp size={18} />}
                      title="Aucun historique d'audit"
                      description="Lancez une première analyse pour commencer à suivre l'évolution de votre score."
                    />
                  ) : (
                    <ResponsiveContainer width="100%" height={260}>
                      <AreaChart data={trendData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="gScore" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#14B8A6" stopOpacity={0.15} />
                            <stop offset="100%" stopColor="#14B8A6" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                        <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} domain={[0, 100]} />
                        <Tooltip contentStyle={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: '12px', boxShadow: '0 4px 16px rgba(0,0,0,0.08)', fontSize: 12 }} itemStyle={{ color: '#1E293B' }} />
                        <Area type="monotone" dataKey="score" stroke="#14B8A6" strokeWidth={2.5} fill="url(#gScore)" dot={false} activeDot={{ r: 5, fill: '#14B8A6', strokeWidth: 0 }} name="Score SEO" />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>

                <div className="flex flex-col gap-4">
                  <div className="text-center">
                    <ResponsiveContainer width="100%" height={160}>
                      <RadialBarChart cx="50%" cy="50%" innerRadius="65%" outerRadius="85%" data={radialData} startAngle={90} endAngle={-270}>
                        <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                        <RadialBar dataKey="value" cornerRadius={8} background={{ fill: '#F1F5F9' }} />
                      </RadialBarChart>
                    </ResponsiveContainer>
                    <div className="-mt-4">
                      <div className="text-4xl font-bold text-dark">{summaryScore}</div>
                      <div className="text-xs text-muted mt-1">Score global</div>
                      <Badge variant="teal" className="mt-2">{scoreLabel}</Badge>
                    </div>
                  </div>
                  <div className="space-y-3 mt-2">
                    {subscores ? (
                      <>
                        <ProgressBar value={subscores.local} label="Google Business (local)" showValue color="#14B8A6" />
                        <ProgressBar value={subscores.content} label="Contenu local" showValue color="#1D4ED8" />
                        <ProgressBar value={subscores.technical} label="Cohérence NAP / Technique" showValue color="#F97316" />
                        <ProgressBar value={subscores.performance} label="Performance site" showValue color="#1D4ED8" />
                        <ProgressBar value={subscores.ai_readiness} label="Prêt pour l'IA" showValue color="#F97316" />
                      </>
                    ) : (
                      <EmptyState
                        icon={<Activity size={14} />}
                        title="Sous-scores indisponibles"
                        description="Lancez un audit pour accéder aux 5 axes d'évaluation."
                      />
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'Recommandations' && (
              <div className="space-y-3">
                {filteredRecommendations.length === 0 ? (
                  <EmptyState
                    icon={<Search size={18} />}
                    title="Aucune opportunité disponible"
                    description="Lancez un audit pour générer des recommandations exploitables."
                  />
                ) : (
                  filteredRecommendations.map((recommendation) => {
                    const impact = oppImpact(recommendation)
                    const priority = oppPriorityLabel(impact)
                    return (
                      <div
                        key={recommendation.id ?? recommendation.title}
                        className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-4 rounded-xl border border-border hover:border-teal/40 hover:bg-slate-bg transition-all group focus-within:border-teal/40 focus-within:bg-slate-bg"
                      >
                        <div className="shrink-0">
                          <Badge variant={priority.variant}>{priority.label}</Badge>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-dark text-sm">{recommendation.title ?? 'Opportunité sans titre'}</div>
                          <div className="text-xs text-muted mt-0.5">{recommendation.category ?? 'Backend'}</div>
                        </div>
                        <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-6">
                          <div className="text-right shrink-0">
                            <div className="text-sm font-bold text-teal">+{impact}%</div>
                            <div className="text-[10px] text-muted">impact</div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100 transition-opacity"
                            icon={<ArrowRight size={12} />}
                          >
                            Exécuter
                          </Button>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            )}

            {activeTab === 'Concurrents' && (
              <EmptyState
                icon={<Users size={18} />}
                title="Comparatif concurrents"
                description="Le module d'analyse concurrentielle est en cours d'implémentation côté backend. Cette section sera mise à jour dès que les données seront disponibles."
              />
            )}

            {activeTab === 'Historique' && (
              <div className="space-y-2">
                {trendData.length === 0 ? (
                  <EmptyState
                    icon={<Search size={18} />}
                    title="Aucun historique"
                    description="Lancez des audits successifs pour voir apparaître l'historique de vos scores."
                  />
                ) : (
                  trendData.slice().reverse().map((entry) => (
                    <div key={entry.month} className="flex items-center justify-between p-3 rounded-xl bg-slate-bg border border-border-light">
                      <span className="text-sm text-muted font-medium">{entry.month}</span>
                      <span className="text-sm"><span className="text-[#94A3B8] mr-1">Score:</span><span className="font-semibold text-teal">{entry.score}</span></span>
                    </div>
                  ))
                )}
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  )
}