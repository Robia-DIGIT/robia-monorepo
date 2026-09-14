import { describe, expect, it } from 'vitest'
import { oppPriorityScore, type Opportunity } from './api'

function metaOpportunity(impactScore: number): Opportunity {
  return {
    id: 'opp-meta-1',
    organizationId: 'org-1',
    auditId: 'audit-1',
    title: 'Aucun média Instagram récent',
    description: "Aucun média n'a été retourné pour ce compte Instagram.",
    category: 'social',
    impactScore,
    effortScore: 4,
    confidenceScore: 0.9,
    sourceData: {
      version: 1,
      source: 'meta',
      ruleCode: 'META_NO_RECENT_MEDIA',
      confidence: 'observed',
      evidence: [],
      recommendation: 'Publiez du contenu sur Instagram.',
      scoreInfluence: false,
    },
    status: 'open',
    createdAt: '2026-09-14T00:00:00Z',
  }
}

describe('oppPriorityScore — Meta/SEO impact scale coexistence (Codex review)', () => {
  // Robia-Back's Meta rules assign impactScore on the same 0-10 integer
  // scale as SEO findings (python-service/app/agents/audit_rules.py).
  // Before that backend fix, Meta findings used impactScore 20-50, which
  // this fallback (impactScore * 10, clamped to 100) would have silently
  // saturated to 100 for every single Meta finding regardless of its real
  // severity — making Meta findings look artificially critical next to SEO
  // ones. These tests are a non-regression guard on the frontend side.
  it('never saturates a Meta opportunity to 100 from realistic 0-10 impact scores', () => {
    expect(oppPriorityScore(metaOpportunity(2))).toBe(20)
    expect(oppPriorityScore(metaOpportunity(3))).toBe(30)
    expect(oppPriorityScore(metaOpportunity(4))).toBe(40)
    expect(oppPriorityScore(metaOpportunity(5))).toBe(50)
  })

  it('only reaches 100 when the impact score is genuinely at the scale maximum (10)', () => {
    expect(oppPriorityScore(metaOpportunity(10))).toBe(100)
  })
})
