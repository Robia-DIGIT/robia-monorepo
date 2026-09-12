import { Badge } from './ui'
import type { SeoScoreV2 } from '../lib/api'

const CATEGORY_LABELS: Record<string, string> = {
  local: 'Google Business (local)',
  content: 'Contenu local',
  technical: 'Cohérence NAP / Technique',
  performance: 'Performance site',
  ai_readiness: "Prêt pour l'IA",
}

function categoryLabel(category: string): string {
  return CATEGORY_LABELS[category] ?? category
}

type Appreciation = 'Bon' | 'À améliorer' | 'Faible'

function appreciate(score: number): Appreciation {
  if (score >= 75) return 'Bon'
  if (score >= 50) return 'À améliorer'
  return 'Faible'
}

function appreciationVariant(level: Appreciation): 'teal' | 'orange' | 'gray' {
  if (level === 'Bon') return 'teal'
  if (level === 'À améliorer') return 'orange'
  return 'gray'
}

/**
 * Displays the RC-12 explainable score (categories scored only from their
 * own tested findings — a category with nothing tested shows "non mesuré",
 * never a fabricated 0). Additive alongside the legacy score/subscores
 * shown elsewhere on this page — never replaces them; see auditSeoScoreV2's
 * doc comment for why.
 */
export function SeoScoreV2Card({ score }: { score: SeoScoreV2 | null }) {
  if (!score) {
    return (
      <div
        className="rounded-xl border border-dashed border-border-light bg-slate-bg p-5"
        data-testid="seo-score-v2-card-not-measured"
      >
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted">
          Score explicable (V2)
        </p>
        <p className="mt-2 text-sm text-muted">Non mesuré pour cette analyse.</p>
      </div>
    )
  }

  const categories = Object.entries(score.categories).filter(
    ([category]) => category in CATEGORY_LABELS,
  )

  return (
    <div
      className="rounded-xl border border-border-light bg-white p-5"
      data-testid="seo-score-v2-card"
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-teal-dark">
          Score explicable (V2)
        </p>
        <span className="text-[10px] font-medium text-muted">{score.version}</span>
      </div>

      {score.globalScore !== null ? (
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-bold text-navy">{score.globalScore}</span>
          <span className="text-xs text-muted">/ 100</span>
        </div>
      ) : (
        <p className="mt-2 text-sm text-muted">
          Aucun axe mesuré pour le moment — le score global s'affichera dès qu'un axe aura des constats testés.
        </p>
      )}

      <div className="mt-4 space-y-2">
        {categories.map(([category, data]) => (
          <div
            key={category}
            className="flex items-center justify-between rounded-lg border border-border-light p-3"
          >
            <div>
              <p className="text-xs font-semibold text-navy">{categoryLabel(category)}</p>
              {data.measured && (
                <p className="text-[10px] text-muted">
                  {data.findingsEvaluated} constat{data.findingsEvaluated > 1 ? 's' : ''} évalué
                  {data.findingsEvaluated > 1 ? 's' : ''}
                </p>
              )}
            </div>
            {data.measured && data.score !== null ? (
              <Badge variant={appreciationVariant(appreciate(data.score))}>
                {data.score} — {appreciate(data.score)}
              </Badge>
            ) : (
              <span className="text-[11px] text-muted">Non mesuré</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
