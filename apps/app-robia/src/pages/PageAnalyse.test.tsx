import { render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import PageAnalyse from './PageAnalyse'
import * as api from '../lib/api'
import { useWebsiteContext } from '../components/WebsiteContext'

vi.mock('../lib/api')
vi.mock('../components/WebsiteContext')

const mockedApi = vi.mocked(api)
const mockedUseWebsiteContext = vi.mocked(useWebsiteContext)

const website = { id: 'w1', url: 'https://example.com', name: 'Example' }

beforeEach(() => {
  vi.resetAllMocks()
  mockedUseWebsiteContext.mockReturnValue({
    websites: [website],
    activeWebsiteId: 'w1',
    activeWebsite: website,
    loadingWebsites: false,
    setActiveWebsiteId: vi.fn(),
    refreshWebsites: vi.fn().mockResolvedValue(undefined),
  } as ReturnType<typeof useWebsiteContext>)
  mockedApi.getCurrentOrganization.mockResolvedValue({
    id: 'o1',
    name: 'Orga',
    city: 'Antananarivo',
  } as Awaited<ReturnType<typeof api.getCurrentOrganization>>)
  mockedApi.listAudits.mockResolvedValue([])
  mockedApi.listOpportunities.mockResolvedValue([])
})

// This page has no PSI-specific loading/error state of its own: PageSpeed
// Insights data arrives embedded in the Audit object it already fetches
// (Audit.resultJson.site_audit.pagespeed_insights), so the page's existing
// loading skeleton and error alert are what RC-11 relies on for those two
// states. PageSpeedInsightsCard.test.tsx covers the PSI-specific states
// (full measurement, partial metrics, unavailable, not measured).

describe('PageAnalyse — loading state', () => {
  it('shows a loading skeleton while the audit is being fetched', async () => {
    let resolveAudit: (value: Awaited<ReturnType<typeof api.getLatestAudit>>) => void = () => {}
    mockedApi.getLatestAudit.mockReturnValue(
      new Promise((resolve) => {
        resolveAudit = resolve
      }),
    )

    render(<PageAnalyse />)

    expect(screen.getByText(/Chargement des données d'analyse/i)).toBeInTheDocument()

    resolveAudit({
      id: 'a1',
      organizationId: 'o1',
      websiteId: 'w1',
      status: 'completed',
      globalScore: 0,
      resultJson: { summary: '', subscores: { local: 0, content: 0, technical: 0, performance: 0, ai_readiness: 0 }, global_score: 0, missing_data: [] },
      errorMessage: null,
      createdAt: '2026-09-11T00:00:00Z',
      completedAt: '2026-09-11T00:00:00Z',
    })
    await waitFor(() =>
      expect(screen.queryByText(/Chargement des données d'analyse/i)).not.toBeInTheDocument(),
    )
  })
})

describe('PageAnalyse — network error', () => {
  it('shows an error alert and renders no PageSpeed data when the audit fetch fails', async () => {
    mockedApi.getLatestAudit.mockRejectedValue(new Error('Erreur réseau simulée'))

    render(<PageAnalyse />)

    await waitFor(() => expect(screen.getByText('Erreur réseau simulée')).toBeInTheDocument())
    expect(screen.queryByTestId('pagespeed-card-ok')).not.toBeInTheDocument()
    expect(screen.queryByTestId('pagespeed-card-unavailable')).not.toBeInTheDocument()
    expect(screen.queryByTestId('pagespeed-card-not-measured')).not.toBeInTheDocument()
  })
})
