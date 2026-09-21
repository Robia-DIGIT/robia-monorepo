import {
  BarChart3,
  Building2,
  Gauge,
  LineChart,
  Lock,
  Search,
  Share2,
  type LucideIcon,
} from "lucide-react";
import { Link } from "react-router-dom";

import { Badge } from "./ui";
import {
  intelligenceConfigureRoute,
  intelligenceReasonLabel,
  intelligenceStatusLabel,
  INTELLIGENCE_PROVIDER_LABELS,
  type IntelligenceProvider,
  type IntelligenceSignal,
} from "../lib/api";

const PROVIDER_ICONS: Record<IntelligenceProvider, LucideIcon> = {
  seo: Search,
  pagespeed: Gauge,
  search_console: BarChart3,
  ga4: LineChart,
  meta: Share2,
  gbp: Building2,
  ops: Building2,
};

function formatObservedAt(observedAt: string | null): string | null {
  if (!observedAt) return null;
  const date = new Date(observedAt);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/**
 * RC-22 — one card per RC-21 provider signal. Never renders a numeric
 * value derived from `data` when `status` isn't `ok`/`partial`: a
 * `null`/`unavailable`/`not_connected`/`not_configured` provider is
 * rendered as exactly that, never silently turned into 0.
 */
export function IntelligenceProviderCard({
  signal,
}: {
  signal: IntelligenceSignal;
}) {
  const Icon = PROVIDER_ICONS[signal.provider] ?? Building2;
  const statusMeta = intelligenceStatusLabel(signal.status);
  const observedLabel = formatObservedAt(signal.observedAt);
  const showReason = signal.status !== "ok" && signal.status !== "partial";
  const configureRoute = intelligenceConfigureRoute(signal.provider);
  // 'unavailable' means connected/configured but the read itself failed
  // transiently — there is nothing to "configure" in that state (Codex
  // review). Only 'not_connected'/'not_configured' are actionable here.
  const needsConfiguration = signal.status === "not_connected" || signal.status === "not_configured";

  return (
    <article
      data-testid={`intelligence-card-${signal.provider}`}
      className="flex flex-col gap-3 rounded-xl border border-border bg-white p-5 shadow-sm"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-bg text-navy">
            <Icon size={17} aria-hidden="true" />
          </div>
          <div>
            <p className="text-sm font-semibold text-navy">
              {INTELLIGENCE_PROVIDER_LABELS[signal.provider]}
            </p>
            {signal.readOnly && (
              <p className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-muted">
                <Lock size={10} aria-hidden="true" /> Lecture seule
              </p>
            )}
          </div>
        </div>
        <Badge variant={statusMeta.badge}>{statusMeta.label}</Badge>
      </div>

      {showReason ? (
        <p className="text-xs leading-relaxed text-muted" data-testid={`intelligence-reason-${signal.provider}`}>
          {`Raison : ${intelligenceReasonLabel(signal.unavailableReason)}.`}
        </p>
      ) : (
        <p className="text-xs leading-relaxed text-muted">
          {observedLabel ? `Dernière observation : ${observedLabel}.` : "Donnée à jour disponible."}
        </p>
      )}

      <div className="mt-auto flex flex-wrap items-center gap-2 pt-1">
        <Badge variant="gray">
          {signal.scoreInfluence ? "Contribue au score SEO" : "Hors score SEO"}
        </Badge>
        {configureRoute && needsConfiguration && (
          <Link
            to={configureRoute}
            className="ml-auto rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-navy transition-colors hover:border-teal hover:text-teal-dark"
          >
            Configurer
          </Link>
        )}
      </div>
    </article>
  );
}
