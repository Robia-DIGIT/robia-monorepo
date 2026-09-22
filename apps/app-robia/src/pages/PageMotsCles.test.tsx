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
  it('classifies positions 1 to 3 as a strong position, never confused with beyond-20', () => {
    expect(opportunityTier(1)).toBe('fort')
    expect(opportunityTier(3)).toBe('fort')
  })

  it('classifies a page-1-but-not-top-3 position (4 to 10) as a quick win', () => {
    expect(opportunityTier(4)).toBe('quick_win')
    expect(opportunityTier(10)).toBe('quick_win')
  })

  it('classifies a page-2 position (11 to 20) as needing more work', () => {
    expect(opportunityTier(10.5)).toBe('a_developper')
    expect(opportunityTier(20)).toBe('a_developper')
  })

  it('classifies anything beyond position 20 as its own "hors Top 20" tier, not as strong', () => {
    expect(opportunityTier(21)).toBe('hors_top20')
    expect(opportunityTier(87)).toBe('hors_top20')
  })

  it('classifies a missing or invalid position as unknown rather than defaulting to strong', () => {
    expect(opportunityTier(Number.NaN)).toBe('position_inconnue')
    expect(opportunityTier(0)).toBe('position_inconnue')
    expect(opportunityTier(-1)).toBe('position_inconnue')
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

  it('displays which Search Console property is actually being analyzed', async () => {
    mockedApi.getSearchConsoleStatus.mockResolvedValue(status({ selectedSiteUrl: 'https://autre-site.mg' }))
    mockedApi.getSearchConsolePerformance.mockResolvedValue(performance([query({})]))

    render(<MemoryRouter><PageMotsCles /></MemoryRouter>)

    await waitFor(() => expect(screen.getByText('https://autre-site.mg')).toBeInTheDocument())
    expect(screen.getByText(/Propriété Search Console analysée/)).toBeInTheDocument()
  })

  it('renders a query with a missing/invalid position under its own tier, never mislabelled as strong', async () => {
    mockedApi.getSearchConsoleStatus.mockResolvedValue(status())
    mockedApi.getSearchConsolePerformance.mockResolvedValue(
      performance([query({ key: 'position non fournie', position: Number.NaN })]),
    )

    render(<MemoryRouter><PageMotsCles /></MemoryRouter>)

    await waitFor(() => expect(screen.getByText('Position inconnue')).toBeInTheDocument())
    expect(screen.queryByText('Position forte')).not.toBeInTheDocument()
  })
})
