import { formatMeasuredAt } from '../lib/pagespeed-format'
import type { AuditSearchConsoleSignals } from '../lib/api'

const UNAVAILABLE_REASON_LABELS: Record<string, string> = {
  not_connected: 'Search Console non connecté',
  no_property_selected: 'aucune propriété Search Console sélectionnée',
  not_synced_recently: 'pas de synchronisation récente (moins de 28 jours)',
  temporarily_unavailable: 'temporairement indisponible, réessayez plus tard',
}

function reasonLabel(reason: string | null): string {
  if (!reason) return 'donnée indisponible'
  return UNAVAILABLE_REASON_LABELS[reason] ?? reason
}

/**
 * `temporarily_unavailable` means a transient read/backend error, not
 * anything about the connection itself — telling the user to reconnect or
 * resync Search Console would be misleading (and wrong) advice for that
 * case. The other three reasons are genuinely about the connection/sync
 * state, where that instruction is the correct next step.
 */
function unavailableMessage(reason: string | null): string {
  if (reason === 'temporarily_unavailable') {
    return 'Search Console est temporairement indisponible. Réessayez plus tard.'
  }
  return `Donnée indisponible (${reasonLabel(reason)}). Connectez ou synchronisez Search Console depuis Données Google.`
}

/**
 * Displays the RC-13 Search Console snapshot attached to an audit. This is
 * always a stale-but-real reading of what the "Google Data" page last
 * synced (never a live call made during the audit) — 'unavailable' with a
 * reason is a normal, expected value, not an error state to alarm about.
 * Purely informational: never influences global_score or seo_score_v2.
 */
export function SearchConsoleSignalsCard({
  signals,
}: {
  signals: AuditSearchConsoleSignals | null
}) {
  if (!signals) {
    return (
      <div
        className="rounded-xl border border-dashed border-border-light bg-slate-bg p-5"
        data-testid="search-console-card-not-measured"
      >
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted">
          Search Console
        </p>
        <p className="mt-2 text-sm text-muted">Non mesuré pour cette analyse.</p>
      </div>
    )
  }

  if (signals.status === 'unavailable' || !signals.summary) {
    return (
      <div
        className="rounded-xl border border-dashed border-border-light bg-slate-bg p-5"
        data-testid="search-console-card-unavailable"
      >
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted">
          Search Console
        </p>
        <p className="mt-2 text-sm text-muted">
          {unavailableMessage(signals.unavailableReason)}
        </p>
      </div>
    )
  }

  const { summary } = signals

  return (
    <div
      className="rounded-xl border border-border-light bg-white p-5"
      data-testid="search-console-card-ok"
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-teal-dark">
          Search Console
        </p>
        {signals.lastSyncedAt && (
          <span className="text-[10px] font-medium text-muted">
            Synchronisé le {formatMeasuredAt(signals.lastSyncedAt)}
          </span>
        )}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-border-light p-3">
          <p className="text-[10px] font-bold uppercase tracking-wide text-muted">Clics</p>
          <p className="mt-1 text-sm font-bold text-navy">{Math.round(summary.clicks)}</p>
        </div>
        <div className="rounded-lg border border-border-light p-3">
          <p className="text-[10px] font-bold uppercase tracking-wide text-muted">
            Impressions
          </p>
          <p className="mt-1 text-sm font-bold text-navy">{Math.round(summary.impressions)}</p>
        </div>
        <div className="rounded-lg border border-border-light p-3">
          <p className="text-[10px] font-bold uppercase tracking-wide text-muted">CTR</p>
          <p className="mt-1 text-sm font-bold text-navy">
            {(summary.ctr * 100).toFixed(1)}%
          </p>
        </div>
        <div className="rounded-lg border border-border-light p-3">
          <p className="text-[10px] font-bold uppercase tracking-wide text-muted">
            Position moyenne
          </p>
          <p className="mt-1 text-sm font-bold text-navy">{summary.position.toFixed(1)}</p>
        </div>
      </div>

      {signals.period && (
        <p className="mt-3 text-[10px] uppercase tracking-wide text-muted">
          Période : {signals.period.startDate} au {signals.period.endDate}
        </p>
      )}
    </div>
  )
}
