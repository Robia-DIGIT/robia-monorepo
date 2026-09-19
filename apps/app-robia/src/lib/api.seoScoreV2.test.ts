import { describe, expect, it } from 'vitest'
import {
  auditGoogleSearchConsole,
  auditSeoScoreV2,
  type Audit,
  type AuditSearchConsoleSignals,
  type SeoScoreV2,
} from './api'

function baseAudit(overrides?: {
  site_audit?: { seo_score_v2?: SeoScoreV2 | null }
  google_search_console?: AuditSearchConsoleSignals | null
}): Audit {
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
      ...(overrides?.site_audit ? { site_audit: overrides.site_audit } : {}),
      ...(overrides?.google_search_console !== undefined
        ? { google_search_console: overrides.google_search_console }
        : {}),
    },
    errorMessage: null,
    createdAt: '2026-09-12T00:00:00Z',
    completedAt: '2026-09-12T00:05:00Z',
  }
}

describe('auditSeoScoreV2', () => {
  it('returns null when there is no audit', () => {
    expect(auditSeoScoreV2(null)).toBeNull()
    expect(auditSeoScoreV2(undefined)).toBeNull()
  })

  it('returns null when the audit predates RC-12 (no seo_score_v2 field at all)', () => {
    expect(auditSeoScoreV2(baseAudit())).toBeNull()
    expect(auditSeoScoreV2(baseAudit({ site_audit: {} }))).toBeNull()
  })

  it('returns the structured score as-is when present', () => {
    const score: SeoScoreV2 = {
      version: 'v2',
      globalScore: 78,
      categories: {
        local: { score: 90, weight: 0.25, measured: true, findingsEvaluated: 3 },
        performance: { score: null, weight: 0.2, measured: false, findingsEvaluated: 0 },
      },
    }

    expect(auditSeoScoreV2(baseAudit({ site_audit: { seo_score_v2: score } }))).toEqual(score)
  })
})

describe('auditGoogleSearchConsole', () => {
  it('returns null when there is no audit', () => {
    expect(auditGoogleSearchConsole(null)).toBeNull()
    expect(auditGoogleSearchConsole(undefined)).toBeNull()
  })

  it('returns null when the audit predates RC-13 (no google_search_console field at all)', () => {
    expect(auditGoogleSearchConsole(baseAudit())).toBeNull()
  })

  it('returns the structured signals as-is when present, ok or unavailable alike', () => {
    const unavailable: AuditSearchConsoleSignals = {
      status: 'unavailable',
      source: 'search_console',
      siteUrl: null,
      period: null,
      summary: null,
      lastSyncedAt: null,
      unavailableReason: 'not_connected',
    }
    expect(
      auditGoogleSearchConsole(baseAudit({ google_search_console: unavailable })),
    ).toEqual(unavailable)

    const ok: AuditSearchConsoleSignals = {
      status: 'ok',
      source: 'search_console',
      siteUrl: 'sc-domain:robiacopilot.site',
      period: { startDate: '2026-08-15', endDate: '2026-09-11' },
      summary: { clicks: 120, impressions: 4300, ctr: 0.0279, position: 12.4 },
      lastSyncedAt: '2026-09-11T08:00:00Z',
      unavailableReason: null,
    }
    expect(auditGoogleSearchConsole(baseAudit({ google_search_console: ok }))).toEqual(ok)
  })
})
