import { useCallback, useEffect, useMemo, useState } from 'react'
import { Calendar, Download, FileText,  Share2, Sparkles, TrendingUp } from 'lucide-react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import { Button, Card, EmptyState, PageHeader } from '../components/ui'
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
  const visibility = score
  const doneOpps = opportunities.filter((o) => oppIsDone(o)).length
  const doneActions = actions.filter((a) => actionProgressPct(a.status) >= 100).length
  const oppsWithId = opportunities.filter((o) => Boolean(o.id)).length

  if (loading) {
    return <div className="p-6 lg:p-8 max-w-7xl mx-auto"><Card className="p-8"><div className="h-8 w-80 bg-slate-100 rounded-lg" /></Card></div>
  }

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto animate-slide-up">
      <PageHeader
        title="Rapports & Analytics"
        subtitle={`Synthèse dédiée à ${activeWebsite?.name ?? activeWebsite?.url ?? "ce site"} · ${organizationName}`}
        actions={
          <>
            {generated && <Button variant="outline" size="sm" icon={<Share2 size={14} />}>Partager</Button>}
            <Button variant="outline" size="sm" icon={<Calendar size={14} />}>Planifier</Button>
            <Button variant="outline" size="sm" loading={busy} icon={<Download size={14} />} onClick={handleExport}>PDF</Button>
            <Button variant="primary" size="sm" loading={busy} icon={<Sparkles size={14} />} onClick={handleGenerate}>{generated ? 'Régénérer' : 'Générer le rapport'}</Button>
          </>
        }
      />

      <WebsiteSelector className="mb-6 md:max-w-xl" />

      {error && <div className="mb-6"><Card className="p-4 text-sm text-red-700 bg-red-50 border-red-200">{error}</Card></div>}

      {!generated && (
        <Card className="flex flex-col items-center justify-center py-16 text-center mb-6">
          <div className="w-20 h-20 rounded-3xl bg-linear-to-br from-navy to-navy-light flex items-center justify-center shadow-xl shadow-navy/20">
            <FileText size={36} color="white" strokeWidth={1.5} />
          </div>
          <h3 className="text-xl font-bold text-dark mt-6 mb-2">Rapport prêt à générer</h3>
          <p className="text-sm text-muted max-w-lg leading-relaxed mb-6">Le backend a déjà les audits, les opportunités, les actions et les validations. Lancez la génération pour produire le PDF final.</p>
          <Button variant="primary" size="lg" loading={busy} onClick={handleGenerate} icon={<Sparkles size={16} />}>Générer le rapport complet</Button>
        </Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card className="p-4">
          <div className="text-2xl font-bold" style={{ color: '#14B8A6' }}>{score}<span className="text-sm font-normal text-muted">/100</span></div>
          <div className="text-xs text-muted mt-1">Score SEO</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold" style={{ color: '#60A5FA' }}>{visibility}<span className="text-sm font-normal text-muted">%</span></div>
          <div className="text-xs text-muted mt-1">Visibilité</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold" style={{ color: '#F97316' }}>{doneActions + validations.length}</div>
          <div className="text-xs text-muted mt-1">Actions suivies</div>
        </Card>
      </div>

      <Card className="p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={16} className="text-teal" />
          <h3 className="font-semibold text-dark">Tendance des audits</h3>
        </div>
        {trendData.length === 0 ? (
          <EmptyState
            icon={<TrendingUp size={18} />}
            title="Aucun historique disponible"
            description="Lancez plusieurs audits pour voir la tendance de vos scores."
          />
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={trendData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} domain={[0, 100]} />
              <Tooltip contentStyle={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: '12px', boxShadow: '0 4px 16px rgba(0,0,0,0.08)', fontSize: 12 }} />
              <Area type="monotone" dataKey="score" stroke="#14B8A6" fill="#14B8A620" strokeWidth={2.5} dot={false} />
              <Area type="monotone" dataKey="visibility" stroke="#1D4ED8" fill="#1D4ED820" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-6 lg:col-span-2">
          <h3 className="font-semibold text-dark mb-4">Résumé exécutif</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-slate-bg border border-border-light p-4 text-sm text-muted">
              {latestAudit ? 'Dernier audit connecté au backend.' : 'Aucun audit actif sur le site sélectionné.'}
            </div>
            <div className="rounded-xl bg-slate-bg border border-border-light p-4 text-sm text-muted">
              {opportunities.length} opportunités récupérées côté backend ({doneOpps} traitées).
            </div>
            <div className="rounded-xl bg-slate-bg border border-border-light p-4 text-sm text-muted">
              {actions.length} actions générées ({doneActions} terminées).
            </div>
            <div className="rounded-xl bg-slate-bg border border-border-light p-4 text-sm text-muted">
              {validations.length} validations enregistrées.
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold text-dark mb-4">Statut du rapport</h3>
          <div className="space-y-3 text-sm text-muted">
            <div className="flex items-center justify-between"><span>Opportunités</span><span className="font-semibold text-dark">{oppsWithId}</span></div>
            <div className="flex items-center justify-between"><span>Actions</span><span className="font-semibold text-dark">{actions.length}</span></div>
            <div className="flex items-center justify-between"><span>Validations</span><span className="font-semibold text-dark">{validations.length}</span></div>
            <div className="flex items-center justify-between"><span>Score actuel</span><span className="font-semibold text-teal">{score}</span></div>
          </div>
        </Card>
      </div>

      {generated && (
        <div className="mt-6">
          <Card className="p-6">
            <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
              <div>
                <h3 className="font-semibold text-dark">Rapport généré</h3>
                <p className="text-sm text-muted">Prêt à être exporté au format PDF.</p>
              </div>
              <Button variant="outline" size="sm" loading={busy} icon={<Download size={14} />} onClick={handleExport}>Télécharger le PDF</Button>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-xl bg-slate-bg border border-border-light p-4 text-sm text-muted">Rapport construit à partir des dernières données connectées au backend.</div>
              <div className="rounded-xl bg-slate-bg border border-border-light p-4 text-sm text-muted">{oppsWithId} opportunités identifiées dans les sources de données.</div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
