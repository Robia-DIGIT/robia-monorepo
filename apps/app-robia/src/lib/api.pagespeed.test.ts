import { describe, expect, it } from 'vitest'
import { auditPageSpeedInsights, type Audit, type PageSpeedInsightsResult } from './api'

function baseAudit(siteAudit?: { pagespeed_insights?: PageSpeedInsightsResult | null }): Audit {
  return {
    id: 'a1',
    organizationId: 'o1',
    websiteId: 'w1',
    status: 'completed',
    globalScore: 72,
    resultJson: {
      summary: '',
      subscores: { local: 60, content: 70, technical: 80, performance: 50, ai_readiness: 65 },
      global_score: 72,
      missing_data: [],
      ...(siteAudit ? { site_audit: siteAudit } : {}),
    },
    errorMessage: null,
    createdAt: '2026-09-11T00:00:00Z',
    completedAt: '2026-09-11T00:05:00Z',
  }
}

describe('auditPageSpeedInsights', () => {
  it('returns null when there is no audit', () => {
    expect(auditPageSpeedInsights(null)).toBeNull()
    expect(auditPageSpeedInsights(undefined)).toBeNull()
  })

  it('returns null when the audit predates RC-10 (no site_audit field at all)', () => {
    expect(auditPageSpeedInsights(baseAudit())).toBeNull()
  })

  it('returns null when site_audit exists but pagespeed_insights is absent', () => {
    expect(auditPageSpeedInsights(baseAudit({}))).toBeNull()
  })

  it('returns the structured result as-is when present', () => {
    const psi: PageSpeedInsightsResult = {
      status: 'ok',
      strategy: 'mobile',
      performanceScore: 87,
      metrics: { lcpMs: 1800, cls: 0.05, tbtMs: 90, fcpMs: 900 },
      fetchedAt: '2026-09-11T08:00:00+00:00',
      analyzedUrl: 'https://example.com',
      finalUrl: 'https://example.com/',
      source: 'google_pagespeed_insights',
      unavailableReason: null,
    }

    expect(auditPageSpeedInsights(baseAudit({ pagespeed_insights: psi }))).toEqual(psi)
  })
})
