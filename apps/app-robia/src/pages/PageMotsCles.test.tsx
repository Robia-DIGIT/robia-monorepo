import { render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'

import PageMotsCles, { opportunityTier } from './PageMotsCles'
import * as api from '../lib/api'
import type { SearchConsoleMetric, SearchConsolePerformance, SearchConsoleStatus } from '../lib/api'

vi.mock('../lib/api', async (importOriginal) => {
  const actual = await importOriginal<typeof api>()
  return { ...actual, getSearchConsoleStatus: vi.fn(), getSearchConsolePerformance: vi.fn() }
})

const mockedApi = vi.mocked(api)

function status(overrides: Partial<SearchConsoleStatus> = {}): SearchConsoleStatus {
  return {
    connected: true,
    googleAccountEmail: 'demo@robia.dev',
    selectedSiteUrl: 'https://example.fr',
    permissionLevel: 'siteOwner',
    connectedAt: '2026-09-01T00:00:00Z',
    lastSyncedAt: '2026-09-20T00:00:00Z',
    selectedAnalyticsPropertyId: null,
    selectedAnalyticsPropertyName: null,
    lastAnalyticsSyncedAt: null,
    analyticsAuthorized: false,
    ...overrides,
  }
}

function query(overrides: Partial<SearchConsoleMetric>): SearchConsoleMetric {
  return { key: 'plombier antananarivo', clicks: 10, impressions: 100, ctr: 0.1, position: 5, ...overrides }
}

function performance(topQueries: SearchConsoleMetric[]): SearchConsolePerformance {
  return {
    siteUrl: 'https://example.fr',
    startDate: '2026-08-24',
    endDate: '2026-09-20',
    summary: { clicks: 10, impressions: 100, ctr: 0.1, position: 5 },
    daily: [],
    topQueries,
    topPages: [],
    lastSyncedAt: '2026-09-20T00:00:00Z',
  }
}

beforeEach(() => vi.resetAllMocks())

describe('opportunityTier', () => {
  it('classifies a page-1-but-not-top-3 position as a quick win', () => {
    expect(opportunityTier(4)).toBe('quick_win')
    expect(opportunityTier(10)).toBe('quick_win')
  })

  it('classifies a page-2 position as needing more work', () => {
    expect(opportunityTier(10.5)).toBe('a_developper')
    expect(opportunityTier(20)).toBe('a_developper')
  })

  it('classifies top-3 and beyond-page-2 as already strong / not prioritized', () => {
    expect(opportunityTier(1)).toBe('fort')
    expect(opportunityTier(3)).toBe('fort')
    expect(opportunityTier(25)).toBe('fort')
  })
})

describe('PageMotsCles', () => {
  it('prompts to connect Search Console when not connected', async () => {
    mockedApi.getSearchConsoleStatus.mockResolvedValue(status({ connected: false, selectedSiteUrl: null }))

    render(<MemoryRouter><PageMotsCles /></MemoryRouter>)

    await waitFor(() => expect(screen.getByText('Search Console non connecté')).toBeInTheDocument())
    expect(mockedApi.getSearchConsolePerformance).not.toHaveBeenCalled()
  })

  it('shows real queries sorted with quick wins first, ahead of already-strong positions', async () => {
    mockedApi.getSearchConsoleStatus.mockResolvedValue(status())
    mockedApi.getSearchConsolePerformance.mockResolvedValue(
      performance([
        query({ key: 'déjà numéro un', position: 1, impressions: 500 }),
        query({ key: 'gain rapide prioritaire', position: 5, impressions: 50 }),
        query({ key: 'page deux', position: 15, impressions: 200 }),
      ]),
    )

    render(<MemoryRouter><PageMotsCles /></MemoryRouter>)

    await waitFor(() => expect(screen.getByText('gain rapide prioritaire')).toBeInTheDocument())
    const rendered = screen.getAllByText(/déjà numéro un|gain rapide prioritaire|page deux/)
    expect(rendered.map((node) => node.textContent)).toEqual([
      'gain rapide prioritaire',
      'page deux',
      'déjà numéro un',
    ])
  })

  it('shows an empty state when Search Console is connected but has no query data yet', async () => {
    mockedApi.getSearchConsoleStatus.mockResolvedValue(status())
    mockedApi.getSearchConsolePerformance.mockResolvedValue(performance([]))

    render(<MemoryRouter><PageMotsCles /></MemoryRouter>)

    await waitFor(() => expect(screen.getByText('Aucune requête disponible')).toBeInTheDocument())
  })
})
