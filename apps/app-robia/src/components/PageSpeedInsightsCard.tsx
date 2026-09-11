import { Badge } from './ui'
import { pageSpeedReasonLabel, formatMeasuredAt } from '../lib/pagespeed-format'
import type { PageSpeedInsightsResult } from '../lib/api'

type CwvAppreciation = 'Bon' | 'À améliorer' | 'Faible'

function appreciate(value: number, good: number, poor: number): CwvAppreciation {
  if (value <= good) return 'Bon'
  if (value <= poor) return 'À améliorer'
  return 'Faible'
}

function appreciationVariant(level: CwvAppreciation): 'teal' | 'orange' | 'gray' {
  if (level === 'Bon') return 'teal'
  if (level === 'À améliorer') return 'orange'
  return 'gray'
}

function CwvMetric({
  label,
  value,
  formatValue,
  good,
  poor,
}: {
  label: string
  value: number | null
  formatValue: (value: number) => string
  good: number
  poor: number
}) {
  if (value === null) {
    return (
      <div className="rounded-lg border border-border-light p-3">
        <p className="text-[10px] font-bold uppercase tracking-wide text-muted">{label}</p>
        <p className="mt-1 text-xs text-muted">Non fourni par Google</p>
      </div>
    )
  }

  const level = appreciate(value, good, poor)
  return (
    <div className="rounded-lg border border-border-light p-3">
      <p className="text-[10px] font-bold uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 text-sm font-bold text-navy">{formatValue(value)}</p>
      <Badge variant={appreciationVariant(level)} className="mt-1">{level}</Badge>
    </div>
  )
}

/**
 * Displays the RC-10 PageSpeed Insights contract (mobile strategy only).
 * `psi === null` covers both "no audit yet" and "audit predates RC-10"
 * (the backend field is optional) — both render as "non mesuré", never
 * as a performance score of zero.
 */
export function PageSpeedInsightsCard({ psi }: { psi: PageSpeedInsightsResult | null }) {
  if (!psi) {
    return (
      <div className="rounded-xl border border-dashed border-border-light bg-slate-bg p-5" data-testid="pagespeed-card-not-measured">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted">PageSpeed mobile</p>
        <p className="mt-2 text-sm text-muted">Non mesuré pour cette analyse.</p>
      </div>
    )
  }

  if (psi.status === 'unavailable') {
    return (
      <div className="rounded-xl border border-dashed border-border-light bg-slate-bg p-5" data-testid="pagespeed-card-unavailable">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted">PageSpeed mobile</p>
        <p className="mt-2 text-sm text-muted">
          Mesure indisponible pour le moment
          {psi.unavailableReason ? ` (${pageSpeedReasonLabel(psi.unavailableReason)})` : ''}.
          Une nouvelle tentative aura lieu au prochain audit.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border-light bg-white p-5" data-testid="pagespeed-card-ok">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-teal-dark">PageSpeed mobile</p>
        {psi.fetchedAt && (
          <span className="text-[10px] font-medium text-muted">Mesuré le {formatMeasuredAt(psi.fetchedAt)}</span>
        )}
      </div>

      {psi.performanceScore !== null ? (
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-bold text-navy">{psi.performanceScore}</span>
          <span className="text-xs text-muted">/ 100</span>
        </div>
      ) : (
        <p className="mt-2 text-sm text-muted">Score de performance non fourni par Google pour cette page.</p>
      )}

      <div className="mt-4 grid grid-cols-2 gap-3">
        <CwvMetric
          label="LCP"
          value={psi.metrics.lcpMs}
          formatValue={(ms) => `${(ms / 1000).toFixed(1)}s`}
          good={2500}
          poor={4000}
        />
        <CwvMetric
          label="CLS"
          value={psi.metrics.cls}
          formatValue={(value) => value.toFixed(2)}
          good={0.1}
          poor={0.25}
        />
      </div>

      {psi.metrics.tbtMs !== null && (
        <p className="mt-3 text-[11px] leading-5 text-muted">
          TBT (indicateur de laboratoire, pas un Core Web Vital) : {Math.round(psi.metrics.tbtMs)}ms
        </p>
      )}

      <p className="mt-3 text-[10px] uppercase tracking-wide text-muted">Source : {psi.source}</p>
    </div>
  )
}
