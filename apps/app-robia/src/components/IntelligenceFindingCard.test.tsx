import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { IntelligenceFindingCard } from './IntelligenceFindingCard'
import type { IntelligenceFinding } from '../lib/api'

function finding(overrides: Partial<IntelligenceFinding> = {}): IntelligenceFinding {
  return {
    provider: 'meta',
    ruleCode: 'META_INSTAGRAM_NOT_LINKED',
    title: 'Aucun compte Instagram professionnel lié',
    description: "La Page Facebook active est sélectionnée, mais aucun compte Instagram n'y est lié.",
    category: 'social',
    evidence: [
      {
        observed: 'Page Facebook sélectionnée sans compte Instagram business lié',
        expected: 'Un compte Instagram professionnel lié à la Page',
      },
    ],
    recommendation: 'Liez un compte Instagram professionnel à la Page Facebook.',
    impactScore: 3,
    effortScore: 2,
    confidenceScore: 0.9,
    scoreInfluence: false,
    ...overrides,
  }
}

describe('IntelligenceFindingCard', () => {
  it('preserves confidence:"observed" and renders it as a directly-observed fact, not a heuristic', () => {
    render(<IntelligenceFindingCard finding={finding({ confidence: 'observed' })} />)
    expect(screen.getByText('Constat observé')).toBeInTheDocument()
    expect(screen.queryByText('Heuristique')).not.toBeInTheDocument()
  })

  it('preserves confidence:"heuristic" and renders it as a heuristic, never as an observed fact', () => {
    render(
      <IntelligenceFindingCard
        finding={finding({ ruleCode: 'META_LOW_RECENT_ACTIVITY', confidence: 'heuristic' })}
      />,
    )
    expect(screen.getByText('Heuristique')).toBeInTheDocument()
    expect(screen.queryByText('Constat observé')).not.toBeInTheDocument()
  })

  it('renders no confidence badge at all when the finding does not carry one', () => {
    render(<IntelligenceFindingCard finding={finding({ confidence: undefined })} />)
    expect(screen.queryByText('Constat observé')).not.toBeInTheDocument()
    expect(screen.queryByText('Heuristique')).not.toBeInTheDocument()
  })

  it('shows "Hors score SEO" when scoreInfluence is false', () => {
    render(<IntelligenceFindingCard finding={finding({ scoreInfluence: false })} />)
    expect(screen.getByText('Hors score SEO')).toBeInTheDocument()
  })

  it('shows "Contribue au score SEO" when scoreInfluence is true', () => {
    render(<IntelligenceFindingCard finding={finding({ scoreInfluence: true })} />)
    expect(screen.getByText('Contribue au score SEO')).toBeInTheDocument()
  })

  it('renders the real evidence provided by the backend, never a synthetic metric', () => {
    render(<IntelligenceFindingCard finding={finding()} />)
    expect(
      screen.getByText(/Constaté : Page Facebook sélectionnée sans compte Instagram business lié/),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/Attendu : Un compte Instagram professionnel lié à la Page/),
    ).toBeInTheDocument()
  })

  it('renders impact, effort and confidence exactly as provided, on the same 0-10 scale', () => {
    render(<IntelligenceFindingCard finding={finding({ impactScore: 7, effortScore: 4, confidenceScore: 0.5 })} />)
    expect(screen.getByText('Impact 7/10')).toBeInTheDocument()
    expect(screen.getByText('Effort 4/10')).toBeInTheDocument()
    expect(screen.getByText('Confiance 50%')).toBeInTheDocument()
  })
})
