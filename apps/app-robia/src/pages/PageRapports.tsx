import { useCallback, useEffect, useMemo, useState } from 'react'
import { Calendar, Download, FileText, MapPin, Radar, Share2, Sparkles, TrendingUp } from 'lucide-react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import { Button, Card, EmptyState, ProgressBar } from '../components/ui'
import WebsiteSelector from '../components/WebsiteSelector'
import { useWebsiteContext } from '../components/WebsiteContext'
import {
  exportActionPlan,
  getCurrentOrganization,
  getLatestAudit,
  listActions,
  listDocuments,
  listAudits,
  listOpportunities,
  listValidations,
  auditScore,
  actionProgressPct,
  oppIsDone,
  type Audit,
  type ActionItem,
  type Opportunity,
  type ValidationLog,
} from '../lib/api'

export default function PageRapports() {
  const [organizationName, setOrganizationName] = useState('')
  const { activeWebsiteId, activeWebsite } = useWebsiteContext()
  const [latestAudit, setLatestAudit] = useState<Audit | null>(null)
  const [audits, setAudits] = useState<Audit[]>([])
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [actions, setActions] = useState<ActionItem[]>([])
  const [validations, setValidations] = useState<ValidationLog[]>([])
  const [generated, setGenerated] = useState(false)
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const trendData = useMemo(() => {
    const source = audits.slice(0, 7).reverse()
    return source.length > 0
      ? source.map((audit, index) => ({
          month: `M${index + 1}`,
          score: auditScore(audit),
          visibility: auditScore(audit),
        }))
      : []
  }, [audits])

  const loadData = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const organization = await getCurrentOrganization()
      const latestAuditData = activeWebsiteId ? await getLatestAudit(activeWebsiteId) : null
      const [auditList, opportunityList] = await Promise.all([
        activeWebsiteId ? listAudits(activeWebsiteId) : Promise.resolve([]),
        latestAuditData?.id ? listOpportunities(String(latestAuditData.id)) : Promise.resolve([]),
      ])
      const opportunityIds = new Set(opportunityList.map((item) => String(item.id)))
      const [allActions, allValidations, documentGroups] = await Promise.all([
        listActions(),
        listValidations(),
        Promise.all(opportunityList.map((item) => listDocuments(String(item.id)).catch(() => []))),
      ])
      const documentIds = new Set(documentGroups.flat().map((item) => String(item.id)))

      setOrganizationName(organization.name ?? 'Organisation')
      setAudits(auditList)
      setOpportunities(opportunityList)
      setActions(allActions.filter((item) => opportunityIds.has(String(item.opportunityId))))
      setValidations(allValidations.filter((item) => documentIds.has(String(item.documentId))))
      setLatestAudit(latestAuditData)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Impossible de charger le rapport.')
    } finally {
      setLoading(false)
    }
  }, [activeWebsiteId])

  useEffect(() => {
    void loadData()
  }, [loadData])

  const handleGenerate = async () => {
    setBusy(true)
    setError('')

    try {
      await exportActionPlan(activeWebsiteId)
      setGenerated(true)
    } catch (generationError) {
      setError(generationError instanceof Error ? generationError.message : 'Impossible de générer le rapport.')
    } finally {
      setBusy(false)
    }
  }

  const handleExport = async () => {
    setBusy(true)
    setError('')

    try {
      const blob = await exportActionPlan(activeWebsiteId)
      const url = window.URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = `robia-rapport-${Date.now()}.pdf`
      anchor.click()
      window.URL.revokeObjectURL(url)
    } catch (exportError) {
      setError(exportError instanceof Error ? exportError.message : "Impossible d'exporter le PDF.")
    } finally {
      setBusy(false)
    }
  }

  const score = auditScore(latestAudit)
  const doneOpps = opportunities.filter((o) => oppIsDone(o)).length
  const doneActions = actions.filter((a) => actionProgressPct(a.status) >= 100).length
  const oppsWithId = opportunities.filter((o) => Boolean(o.id)).length
  const readiness = Math.round(([Boolean(latestAudit), opportunities.length > 0, actions.length > 0, validations.length > 0].filter(Boolean).length / 4) * 100)

  if (loading) {
    return <div className="p-6 lg:p-8 max-w-7xl mx-auto"><Card className="p-8"><div className="h-8 w-80 bg-slate-100 rounded-lg" /></Card></div>
  }

  return (
    <div className="mx-auto max-w-7xl animate-slide-up p-5 md:p-6 lg:p-8">
      <header className="mb-7 border-b border-border pb-6"><div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end"><div><p className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-teal-dark"><Radar size={15} /> Rapport de visibilité ROBIA</p><h1 className="text-[30px] font-bold leading-tight tracking-[-0.035em] text-navy md:text-[36px]">Comprendre les progrès et décider</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-muted">Une synthèse dédiée à {activeWebsite?.name ?? activeWebsite?.url ?? 'ce site'}, construite uniquement à partir de ses audits et actions.</p></div><div className="flex flex-wrap gap-2">{generated && <Button variant="outline" size="sm" icon={<Share2 size={14} />}>Partager</Button>}<Button variant="outline" size="sm" icon={<Calendar size={14} />}>Planifier</Button><Button variant="outline" size="sm" loading={busy} icon={<Download size={14} />} onClick={handleExport}>PDF</Button><Button variant="primary" size="sm" loading={busy} icon={<Sparkles size={14} />} onClick={handleGenerate}>{generated ? 'Régénérer' : 'Générer le rapport'}</Button></div></div></header>

      <div className="mb-6 flex flex-col gap-3 border-l-2 border-teal bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between"><div className="flex min-w-0 items-center gap-3"><MapPin size={17} className="shrink-0 text-teal-dark" /><div className="min-w-0"><p className="text-[10px] font-bold uppercase tracking-wide text-muted">Sources du rapport</p><p className="truncate text-sm font-bold text-navy">{organizationName} · {activeWebsite?.url ?? 'Aucun site sélectionné'}</p></div></div><WebsiteSelector className="w-full sm:w-auto sm:min-w-72" /></div>
      {error && <div className="mb-6 border-l-2 border-red-500 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <section className="mb-7 grid border-y border-border bg-white lg:grid-cols-[1.2fr_repeat(3,0.8fr)]">
        <div className="border-b border-border px-1 py-5 lg:border-r lg:border-b-0 lg:pr-6"><div className="flex justify-between text-[10px] font-bold uppercase tracking-[0.14em] text-muted"><span>Préparation du rapport</span><span>{readiness}%</span></div><div className="mt-4"><ProgressBar value={readiness} color="#14B8A6" /></div><p className="mt-2 text-xs text-muted">Audit, opportunités, actions et validations</p></div>
        <div className="border-b border-border px-1 py-5 lg:border-r lg:border-b-0 lg:px-5"><p className="text-[10px] font-bold uppercase tracking-wide text-muted">Score actuel</p><p className="mt-2 text-[28px] font-bold text-teal-dark">{score}<span className="text-sm text-muted">/100</span></p></div>
        <div className="border-b border-border px-1 py-5 lg:border-r lg:border-b-0 lg:px-5"><p className="text-[10px] font-bold uppercase tracking-wide text-muted">Opportunités</p><p className="mt-2 text-[28px] font-bold text-orange">{opportunities.length}</p></div>
        <div className="px-1 py-5 lg:pl-5"><p className="text-[10px] font-bold uppercase tracking-wide text-muted">Actions suivies</p><p className="mt-2 text-[28px] font-bold text-navy">{doneActions + validations.length}</p></div>
      </section>

      {!generated && <section className="mb-8 grid border-l-2 border-orange bg-orange-light/30 p-5 md:grid-cols-[1fr_auto] md:items-center md:gap-8"><div><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-orange-dark">Prochaine étape</p><h2 className="mt-2 text-lg font-bold text-navy">Transformer les données du site en synthèse décisionnelle</h2><p className="mt-2 text-sm leading-6 text-muted">Le rapport expliquera ce qui a changé, pourquoi cela compte et quelles actions poursuivre.</p></div><Button variant="primary" className="mt-4 md:mt-0" loading={busy} onClick={handleGenerate} icon={<Sparkles size={15} />}>Générer maintenant</Button></section>}

      <div className="grid gap-8 lg:grid-cols-[1.35fr_0.65fr]">
        <section className="border-t border-border pt-5"><div className="mb-4 flex items-center gap-2"><TrendingUp size={16} className="text-teal-dark" /><div><h2 className="font-bold text-navy">Évolution de la visibilité</h2><p className="text-xs text-muted">Historique exclusif au site actif</p></div></div>{trendData.length === 0 ? <EmptyState icon={<TrendingUp size={18} />} title="Aucun historique disponible" description="Lancez plusieurs audits pour suivre l’évolution du score." /> : <ResponsiveContainer width="100%" height={240}><AreaChart data={trendData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" /><XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} /><YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} domain={[0, 100]} /><Tooltip contentStyle={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: '8px', boxShadow: 'none', fontSize: 12 }} /><Area type="monotone" dataKey="score" stroke="#14B8A6" fill="#CCFBF1" strokeWidth={2.5} dot={false} /><Area type="monotone" dataKey="visibility" stroke="#1D4ED8" fill="transparent" strokeWidth={2} dot={false} /></AreaChart></ResponsiveContainer>}</section>
        <aside className="border-t border-border pt-5"><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted">Éléments vérifiés</p><div className="mt-4 divide-y divide-border">{[['Audits', audits.length], ['Opportunités', oppsWithId], ['Actions', actions.length], ['Validations', validations.length]].map(([label,value]) => <div key={String(label)} className="flex items-center justify-between py-3 text-sm"><span className="text-muted">{label}</span><span className="font-bold text-navy">{value}</span></div>)}</div><div className="mt-5 border-l-2 border-teal bg-teal-light/25 px-4 py-3 text-xs leading-5 text-teal-dark">{latestAudit ? `${doneOpps} opportunité(s) et ${doneActions} action(s) terminée(s) sont intégrées à la synthèse.` : 'Aucun audit actif pour ce site.'}</div></aside>
      </div>

      {generated && <section className="mt-8 flex flex-col justify-between gap-4 border-t-2 border-teal bg-white pt-5 sm:flex-row sm:items-center"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-navy text-white"><FileText size={18} /></div><div><h2 className="font-bold text-navy">Rapport prêt</h2><p className="text-xs text-muted">Construit à partir des dernières données du site actif.</p></div></div><Button variant="outline" loading={busy} icon={<Download size={14} />} onClick={handleExport}>Télécharger le PDF</Button></section>}
    </div>
  )
}