import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { SeoScoreV2Card } from './SeoScoreV2Card'
import type { SeoScoreV2 } from '../lib/api'

function score(overrides?: Partial<SeoScoreV2>): SeoScoreV2 {
  return {
    version: 'v2',
    globalScore: 82,
    categories: {
      local: { score: 90, weight: 0.25, measured: true, findingsEvaluated: 3 },
      technical: { score: 65, weight: 0.2, measured: true, findingsEvaluated: 8 },
      performance: { score: null, weight: 0.2, measured: false, findingsEvaluated: 0 },
    },
    ...overrides,
  }
}

describe('SeoScoreV2Card', () => {
  it('renders "not measured" when score is null, never a zero score', () => {
    render(<SeoScoreV2Card score={null} />)

    expect(screen.getByTestId('seo-score-v2-card-not-measured')).toBeInTheDocument()
    expect(screen.getByText('Non mesuré pour cette analyse.')).toBeInTheDocument()
    expect(screen.queryByText('0')).not.toBeInTheDocument()
  })

  it('renders the global score and per-category breakdown', () => {
    render(<SeoScoreV2Card score={score()} />)

    expect(screen.getByText('82')).toBeInTheDocument()
    expect(screen.getByText('Google Business (local)')).toBeInTheDocument()
    expect(screen.getByText('90 — Bon')).toBeInTheDocument()
    expect(screen.getByText('Cohérence NAP / Technique')).toBeInTheDocument()
    expect(screen.getByText('65 — À améliorer')).toBeInTheDocument()
  })

  it('shows "non mesuré" for an unmeasured category instead of a fabricated score', () => {
    render(<SeoScoreV2Card score={score()} />)

    expect(screen.getByText('Performance site')).toBeInTheDocument()
    expect(screen.getByText('Non mesuré')).toBeInTheDocument()
  })

  it('renders a global "nothing measured yet" message when globalScore is null', () => {
    render(
      <SeoScoreV2Card
        score={score({
          globalScore: null,
          categories: {
            local: { score: null, weight: 0.25, measured: false, findingsEvaluated: 0 },
          },
        })}
      />,
    )

    expect(screen.getByText(/le score global s'affichera/)).toBeInTheDocument()
  })
})
