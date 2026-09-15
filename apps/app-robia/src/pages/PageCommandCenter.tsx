import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, LayoutDashboard, Layers, MapPin, Workflow, Zap } from 'lucide-react'

import { Badge, Card, EmptyState, PageHeader } from '../components/ui'
import WebsiteSelector from '../components/WebsiteSelector'
import { useWebsiteContext } from '../components/WebsiteContext'
import { IntelligenceProviderCard } from '../components/IntelligenceProviderCard'
import { IntelligenceFindingCard } from '../components/IntelligenceFindingCard'
import {
  auditScore,
  getIntelligenceFindings,
  getIntelligenceStatus,
  intelligenceConfigureRoute,
  listAudits,
  orderIntelligenceSignals,
  type Audit,
  type IntelligenceFinding,
  type IntelligenceSignal,
} from '../lib/api'

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback
}

/**
 * RC-22 — Unified Command Center. Renders RC-21's normalized providers
 * signals/findings without ever recomputing a score: `seo_score_v2` and
 * `global_score` are only ever read as already-existing backend values
 * (see the "Score SEO existant" card below, sourced from the audit
 * itself, never from combining providers client-side).
 *
 * Resilience (issue #40 §7): the provider status grid and the findings
 * list are fetched and rendered independently — a failure in one must
 * never blank out the other.
 */
export default function PageCommandCenter() {
  const { activeWebsite, activeWebsiteId } = useWebsiteContext()

  const [signals, setSignals] = useState<IntelligenceSignal[]>([])
  const [statusLoading, setStatusLoading] = useState(true)
  const [statusError, setStatusError] = useState('')

  const [audit, setAudit] = useState<Audit | null>(null)
  const [auditLoading, setAuditLoading] = useState(true)

  const [findings, setFindings] = useState<IntelligenceFinding[]>([])
  const [findingsLoading, setFindingsLoading] = useState(false)
  const [findingsError, setFindingsError] = useState('')

  useEffect(() => {
    let mounted = true
    setStatusLoading(true)
    setStatusError('')

    getIntelligenceStatus()
      .then((result) => {
        if (mounted) setSignals(result)
      })
      .catch((error) => {
        if (mounted) setStatusError(errorMessage(error, "Impossible de charger l'état des providers."))
      })
      .finally(() => {
        if (mounted) setStatusLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    let mounted = true
    setAuditLoading(true)
    setAudit(null)

    if (!activeWebsiteId) {
      setAuditLoading(false)
      return () => {
        mounted = false
      }
    }

    // `/audits/latest` only sorts by createdAt — a newer pending/failed
    // audit would hide an earlier completed one from `getLatestAudit()`.
    // `listAudits()` is already sorted desc by createdAt (Robia-Back's
    // findAllForWebsite), so the first `completed` entry in it is the
    // real "latest completed audit" RC-21's findings endpoint requires,
    // even when a more recent, non-completed audit exists (Codex review).
    listAudits(activeWebsiteId)
      .then((audits) => {
        if (!mounted) return
        setAudit(audits.find((item) => item.status === 'completed') ?? null)
      })
      .catch(() => {
        if (mounted) setAudit(null)
      })
      .finally(() => {
        if (mounted) setAuditLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [activeWebsiteId])

  useEffect(() => {
    let mounted = true

    if (!audit?.id) {
      setFindings([])
      setFindingsError('')
      return () => {
        mounted = false
      }
    }

    setFindingsLoading(true)
    setFindingsError('')

    getIntelligenceFindings(audit.id)
      .then((result) => {
        if (mounted) setFindings(result)
      })
      .catch((error) => {
        if (mounted) setFindingsError(errorMessage(error, 'Impossible de charger les findings providers.'))
      })
      .finally(() => {
        if (mounted) setFindingsLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [audit?.id])

  const orderedSignals = useMemo(() => orderIntelligenceSignals(signals), [signals])
  const availableCount = useMemo(
    () => signals.filter((signal) => signal.status === 'ok' || signal.status === 'partial').length,
    [signals],
  )
  // Only counts providers that actually have a configuration surface
  // (search_console/ga4/meta → /google-data or /meta-data) — GBP is
  // always 'not_connected' in RC-21 but has no real connector to set up
  // yet, so it must never inflate this count (Codex review).
  const toConfigureCount = useMemo(
    () =>
      signals.filter(
        (signal) =>
          (signal.status === 'not_connected' || signal.status === 'not_configured') &&
          intelligenceConfigureRoute(signal.provider) !== null,
      ).length,
    [signals],
  )

  const seoScore = audit ? auditScore(audit) : null

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto animate-slide-up">
      <PageHeader
        title="Command Center"
        subtitle="Vue unifiée des signaux RC-21 (SEO, PageSpeed, Search Console, GA4, Meta, GBP) — lecture seule, sans recalcul de score."
        badge={<Badge variant="gray">Vue unifiée</Badge>}
      />

      <div className="mb-6 flex flex-col gap-3 border-l-2 border-teal bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <MapPin size={17} className="shrink-0 text-teal-dark" aria-hidden="true" />
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wide text-muted">Site analysé</p>
            <p className="truncate text-sm font-bold text-navy">
              {activeWebsite?.name ?? activeWebsite?.url ?? 'Aucun site sélectionné'}
            </p>
          </div>
        </div>
        <WebsiteSelector className="w-full sm:w-auto sm:min-w-72" />
      </div>

      <section className="mb-7 grid border-y border-border bg-white sm:grid-cols-3">
        <div className="border-b border-border px-1 py-5 sm:border-r sm:border-b-0 sm:pr-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted">Providers disponibles</p>
          <p className="mt-2 text-[30px] font-bold tracking-[-0.04em] text-teal-dark">{availableCount}</p>
        </div>
        <div className="border-b border-border px-1 py-5 sm:border-r sm:border-b-0 sm:px-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted">À configurer</p>
          <p className="mt-2 text-[30px] font-bold tracking-[-0.04em] text-orange">{toConfigureCount}</p>
        </div>
        <div className="px-1 py-5 sm:pl-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted">Findings observés</p>
          <p className="mt-2 text-[30px] font-bold tracking-[-0.04em] text-navy">{findings.length}</p>
        </div>
      </section>

      {seoScore !== null && (
        <div className="mb-7">
          <Card className="p-4 text-sm text-dark" data-testid="command-center-seo-score">
            <span className="font-semibold">Score SEO existant :</span> {seoScore}/100
            <span className="ml-2 text-xs text-muted">
              (valeur déjà calculée par l'audit — jamais recalculée dans le Command Center)
            </span>
          </Card>
        </div>
      )}

      <section className="mb-8">
        <h2 className="mb-4 text-lg font-bold text-navy">État des providers</h2>
        {statusError ? (
          <Card className="p-4 text-sm text-red-700 bg-red-50 border-red-200" data-testid="intelligence-status-error">
            {statusError}
          </Card>
        ) : statusLoading ? (
          <Card className="p-8">
            <div className="h-8 w-72 bg-slate-100 rounded-lg" />
          </Card>
        ) : orderedSignals.length === 0 ? (
          <EmptyState
            icon={<LayoutDashboard size={18} />}
            title="Aucun signal provider"
            description="Aucun provider n'est encore rattaché à cette organisation."
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {orderedSignals.map((signal) => (
              <IntelligenceProviderCard key={signal.provider} signal={signal} />
            ))}
          </div>
        )}
      </section>

      <section className="mb-8">
        <h2 className="mb-4 text-lg font-bold text-navy">Findings</h2>
        {auditLoading ? (
          <Card className="p-8">
            <div className="h-8 w-72 bg-slate-100 rounded-lg" />
          </Card>
        ) : !audit ? (
          <EmptyState
            icon={<Zap size={18} />}
            title="Aucun audit terminé"
            description="Lancez un audit complet pour ce site afin d'obtenir des findings providers."
            action={
              <Link
                to="/analyse"
                className="inline-flex items-center gap-2 rounded-lg bg-[#F97316] px-4 py-2 text-sm font-semibold text-white hover:bg-[#EA580C]"
              >
                Aller à l'analyse
                <ArrowRight size={14} aria-hidden="true" />
              </Link>
            }
          />
        ) : findingsError ? (
          <Card
            className="p-4 text-sm text-red-700 bg-red-50 border-red-200"
            data-testid="intelligence-findings-error"
          >
            {findingsError}
          </Card>
        ) : findingsLoading ? (
          <Card className="p-8">
            <div className="h-8 w-72 bg-slate-100 rounded-lg" />
          </Card>
        ) : findings.length === 0 ? (
          <EmptyState
            icon={<Zap size={18} />}
            title="Aucun finding"
            description="Aucun provider n'a signalé de finding pour cet audit."
          />
        ) : (
          <div className="divide-y divide-border rounded-xl border border-border bg-white">
            {findings.map((finding) => (
              <IntelligenceFindingCard key={`${finding.provider}:${finding.ruleCode}`} finding={finding} />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-4 text-lg font-bold text-navy">Passer à l'action</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Link
            to="/opportunites"
            className="flex items-center justify-between gap-3 rounded-xl border border-border bg-white p-5 shadow-sm transition-colors hover:border-teal"
          >
            <div>
              <p className="text-sm font-semibold text-navy">Opportunités</p>
              <p className="mt-1 text-xs text-muted">Findings &amp; opportunités priorisées</p>
            </div>
            <Zap size={18} className="shrink-0 text-teal-dark" aria-hidden="true" />
          </Link>
          <Link
            to="/execution"
            className="flex items-center justify-between gap-3 rounded-xl border border-border bg-white p-5 shadow-sm transition-colors hover:border-teal"
          >
            <div>
              <p className="text-sm font-semibold text-navy">Actions (RC-14)</p>
              <p className="mt-1 text-xs text-muted">Suivi des actions gouvernées</p>
            </div>
            <Layers size={18} className="shrink-0 text-teal-dark" aria-hidden="true" />
          </Link>
          <Link
            to="/ops/automations"
            className="flex items-center justify-between gap-3 rounded-xl border border-border bg-white p-5 shadow-sm transition-colors hover:border-teal"
          >
            <div>
              <p className="text-sm font-semibold text-navy">Automatisations (RC-20)</p>
              <p className="mt-1 text-xs text-muted">Workflows internes</p>
            </div>
            <Workflow size={18} className="shrink-0 text-teal-dark" aria-hidden="true" />
          </Link>
        </div>
      </section>
    </div>
  )
}
