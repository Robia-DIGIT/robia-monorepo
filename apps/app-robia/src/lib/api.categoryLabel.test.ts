import { describe, expect, it } from 'vitest'
import { categoryLabel, competitorSubscores, type Competitor } from './api'

function baseCompetitor(resultJson: Competitor['resultJson']): Competitor {
  return {
    id: 'c1',
    organizationId: 'o1',
    websiteId: 'w1',
    url: 'https://concurrent.fr',
    name: 'Concurrent SA',
    status: 'completed',
    globalScore: 80,
    resultJson,
    errorMessage: null,
    createdAt: '2026-09-11T00:00:00Z',
    completedAt: '2026-09-11T00:05:00Z',
  }
}

describe('categoryLabel', () => {
  it('translates every real backend category value to a non-technical French label', () => {
    expect(categoryLabel('technical')).toBe('Technique')
    expect(categoryLabel('content')).toBe('Contenu')
    expect(categoryLabel('local')).toBe('Local')
    expect(categoryLabel('performance')).toBe('Performance')
    expect(categoryLabel('ai_readiness')).toBe('Données structurées')
    expect(categoryLabel('social')).toBe('Réseaux sociaux')
  })

  it('falls back to "Divers" for a null/empty category and passes through an unknown one', () => {
    expect(categoryLabel(null)).toBe('Divers')
    expect(categoryLabel(undefined)).toBe('Divers')
    expect(categoryLabel('')).toBe('Divers')
    expect(categoryLabel('some_future_category')).toBe('some_future_category')
  })
})

describe('competitorSubscores', () => {
  it('returns null when the competitor has no resultJson yet (pending/running/failed)', () => {
    expect(competitorSubscores(baseCompetitor(null))).toBeNull()
  })

  it('returns the subscores from a completed competitor analysis — same shape as an audit', () => {
    const subscores = { local: 90, content: 60, technical: 70, performance: 55, ai_readiness: 40 }
    expect(
      competitorSubscores(
        baseCompetitor({
          summary: '',
          subscores,
          global_score: 80,
          missing_data: [],
        }),
      ),
    ).toEqual(subscores)
  })
})
