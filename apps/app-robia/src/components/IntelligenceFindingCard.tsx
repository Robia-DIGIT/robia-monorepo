import { Badge } from "./ui";
import { INTELLIGENCE_PROVIDER_LABELS, type IntelligenceFinding } from "../lib/api";

function isEvidenceEntry(
  value: unknown,
): value is { observed?: unknown; expected?: unknown; url?: unknown } {
  return !!value && typeof value === "object";
}

function evidenceText(item: unknown): string {
  if (typeof item === "string") return item;
  if (isEvidenceEntry(item)) {
    const parts: string[] = [];
    if (typeof item.observed === "string") parts.push(`Constaté : ${item.observed}`);
    if (typeof item.expected === "string") parts.push(`Attendu : ${item.expected}`);
    if (parts.length > 0) return parts.join(" — ");
  }
  try {
    return JSON.stringify(item);
  } catch {
    return String(item);
  }
}

function recommendationList(
  recommendation: string | string[],
): string[] {
  return Array.isArray(recommendation) ? recommendation : [recommendation];
}

/**
 * RC-22 — one card per RC-21 finding. Renders only evidence the backend
 * actually provided (never a synthetic metric) and always shows whether
 * the finding influences the SEO score, per RC-21's own `scoreInfluence`
 * field — never inferred client-side.
 */
export function IntelligenceFindingCard({
  finding,
}: {
  finding: IntelligenceFinding;
}) {
  return (
    <article
      data-testid={`intelligence-finding-${finding.provider}-${finding.ruleCode}`}
      className="border-l-2 border-border px-4 py-4"
    >
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <Badge variant="gray">{INTELLIGENCE_PROVIDER_LABELS[finding.provider]}</Badge>
        <Badge variant="gray">{finding.category}</Badge>
        <Badge variant="gray">
          {finding.scoreInfluence ? "Contribue au score SEO" : "Hors score SEO"}
        </Badge>
        {finding.confidence && (
          <Badge variant={finding.confidence === "heuristic" ? "orange" : "teal"}>
            {finding.confidence === "heuristic" ? "Heuristique" : "Constat observé"}
          </Badge>
        )}
      </div>

      <h3 className="mb-1 text-sm font-semibold text-dark">{finding.title}</h3>
      <p className="mb-3 text-xs leading-relaxed text-muted">{finding.description}</p>

      {finding.evidence.length > 0 && (
        <div className="mb-3 rounded-lg bg-slate-bg px-3 py-2 text-xs text-dark">
          {finding.evidence.map((item, index) => (
            <p key={index} className={index > 0 ? "mt-1" : undefined}>
              {evidenceText(item)}
            </p>
          ))}
        </div>
      )}

      <div className="text-xs leading-relaxed text-dark">
        <span className="font-semibold">Recommandation :</span>{" "}
        {recommendationList(finding.recommendation).join(" ")}
      </div>

      <div className="mt-3 flex flex-wrap gap-3 text-[10px] font-bold uppercase tracking-wide text-muted">
        <span>Impact {finding.impactScore}/10</span>
        <span>Effort {finding.effortScore}/10</span>
        <span>Confiance {Math.round(finding.confidenceScore * 100)}%</span>
      </div>
    </article>
  );
}
