import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import PageAnalyse from './PageAnalyse'
import * as api from '../lib/api'
import type { Competitor, Opportunity } from '../lib/api'
import { useWebsiteContext } from '../components/WebsiteContext'

vi.mock('../lib/api')
vi.mock('../components/WebsiteContext')

const navigateMock = vi.fn()
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>()
  return { ...actual, useNavigate: () => navigateMock }
})

const mockedApi = vi.mocked(api)
const mockedUseWebsiteContext = vi.mocked(useWebsiteContext)

function renderPage() {
  return render(
    <MemoryRouter>
      <PageAnalyse />
    </MemoryRouter>,
  )
}

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
  mockedApi.listCompetitors.mockResolvedValue([])
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

    renderPage()

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

    renderPage()

    await waitFor(() => expect(screen.getByText('Erreur réseau simulée')).toBeInTheDocument())
    expect(screen.queryByTestId('pagespeed-card-ok')).not.toBeInTheDocument()
    expect(screen.queryByTestId('pagespeed-card-unavailable')).not.toBeInTheDocument()
    expect(screen.queryByTestId('pagespeed-card-not-measured')).not.toBeInTheDocument()
  })
})

describe('PageAnalyse — Recommandations tab "Exécuter" CTA', () => {
  function opportunity(overrides: Partial<Opportunity> = {}): Opportunity {
    return {
      id: 'opp-1',
      organizationId: 'o1',
      auditId: 'a1',
      title: 'Ajouter une balise meta description',
      description: 'Plusieurs pages sans meta description.',
      category: 'content',
      impactScore: 8,
      effortScore: 3,
      confidenceScore: 0.9,
      sourceData: { version: 2, ruleCode: 'content.meta_description_missing' },
      status: 'open',
      createdAt: '2026-09-14T00:00:00Z',
      ...overrides,
    }
  }

  beforeEach(async () => {
    // vi.mock('../lib/api') has no factory, so ALL exports (including pure
    // helpers like oppImpact/oppPriorityLabel) are auto-mocked to return
    // undefined. Earlier tests never hit the .map() rendering path that
    // calls them (opportunities was always []); this describe block does,
    // so it needs their real implementations wired back in.
    const actualApi = await vi.importActual<typeof api>('../lib/api')
    mockedApi.oppImpact.mockImplementation(actualApi.oppImpact)
    mockedApi.oppPriorityLabel.mockImplementation(actualApi.oppPriorityLabel)
    mockedApi.getLatestAudit.mockResolvedValue({
      id: 'a1',
      organizationId: 'o1',
      websiteId: 'w1',
      status: 'completed',
      globalScore: 62,
      resultJson: {
        summary: '',
        subscores: { local: 0, content: 0, technical: 0, performance: 0, ai_readiness: 0 },
        global_score: 62,
        missing_data: [],
      },
      errorMessage: null,
      createdAt: '2026-09-14T00:00:00Z',
      completedAt: '2026-09-14T00:00:00Z',
    })
    mockedApi.listOpportunities.mockResolvedValue([opportunity()])
  })

  it('navigates to /opportunites when "Exécuter" is clicked — it never silently does nothing', async () => {
    renderPage()

    fireEvent.click(await screen.findByRole('button', { name: 'Recommandations' }))
    const executeButton = await screen.findByRole('button', { name: /Exécuter/i })
    fireEvent.click(executeButton)

    expect(navigateMock).toHaveBeenCalledWith('/opportunites')
  })
})

describe('PageAnalyse — Concurrents tab', () => {
  function competitor(overrides: Partial<Competitor> = {}): Competitor {
    return {
      id: 'comp-1',
      organizationId: 'o1',
      websiteId: 'w1',
      url: 'https://concurrent.example.com',
      name: null,
      status: 'completed',
      globalScore: 80,
      resultJson: null,
      errorMessage: null,
      createdAt: '2026-09-14T00:00:00Z',
      completedAt: '2026-09-14T00:00:00Z',
      ...overrides,
    }
  }

  async function renderOnConcurrentsTab() {
    renderPage()
    fireEvent.click(await screen.findByRole('button', { name: 'Concurrents' }))
  }

  beforeEach(async () => {
    // vi.mock('../lib/api') auto-mocks every export, including the pure
    // helpers competitorScore and auditScore — wire the real
    // implementations back in since this tab's rendering path actually
    // calls both (same auto-mock gap as oppImpact/oppPriorityLabel
    // elsewhere in this file: no earlier test in this file exercises the
    // full "hasAnalyzed" success view with real numbers).
    const actualApi = await vi.importActual<typeof api>('../lib/api')
    mockedApi.competitorScore.mockImplementation(actualApi.competitorScore)
    mockedApi.auditScore.mockImplementation(actualApi.auditScore)

    mockedApi.getLatestAudit.mockResolvedValue({
      id: 'a1',
      organizationId: 'o1',
      websiteId: 'w1',
      status: 'completed',
      globalScore: 62,
      resultJson: {
        summary: '',
        subscores: { local: 0, content: 0, technical: 0, performance: 0, ai_readiness: 0 },
        global_score: 62,
        missing_data: [],
      },
      errorMessage: null,
      createdAt: '2026-09-14T00:00:00Z',
      completedAt: '2026-09-14T00:00:00Z',
    })
  })

  it('shows an empty state when no competitor is tracked yet', async () => {
    await renderOnConcurrentsTab()

    expect(await screen.findByText('Aucun concurrent suivi')).toBeInTheDocument()
  })

  it('adds a competitor and shows its score compared to the own site', async () => {
    mockedApi.createCompetitor.mockResolvedValue(competitor({ status: 'completed', globalScore: 80 }))

    await renderOnConcurrentsTab()

    const input = await screen.findByRole('textbox', { name: /URL du site concurrent/i })
    fireEvent.change(input, { target: { value: 'https://concurrent.example.com' } })
    fireEvent.click(screen.getByRole('button', { name: /Ajouter un concurrent/i }))

    await waitFor(() =>
      expect(mockedApi.createCompetitor).toHaveBeenCalledWith({
        websiteId: 'w1',
        url: 'https://concurrent.example.com',
      }),
    )
    expect((await screen.findAllByText('https://concurrent.example.com')).length).toBeGreaterThan(0)
    // Own score is 62, competitor's is 80 — a real, unfabricated delta.
    // Text is split across sibling JSX expressions ('+', 18, ' vs vous'),
    // so match on the element's full textContent rather than exact text.
    expect(
      await screen.findByText((_, element) => element?.textContent === '+18 vs vous'),
    ).toBeInTheDocument()
  })

  it('never fabricates a score for a competitor that hasn’t completed an audit yet', async () => {
    mockedApi.listCompetitors.mockResolvedValue([competitor({ status: 'pending', globalScore: null })])

    await renderOnConcurrentsTab()

    expect(await screen.findByText('En attente')).toBeInTheDocument()
    expect(screen.getByText('—')).toBeInTheDocument()
  })

  it('runs a competitor benchmark and updates its score from the real result', async () => {
    mockedApi.listCompetitors.mockResolvedValue([competitor({ status: 'pending', globalScore: null })])
    mockedApi.runCompetitor.mockResolvedValue(competitor({ status: 'completed', globalScore: 55 }))

    await renderOnConcurrentsTab()

    fireEvent.click(await screen.findByRole('button', { name: 'Analyser' }))

    await waitFor(() => expect(mockedApi.runCompetitor).toHaveBeenCalledWith('comp-1'))
    expect(await screen.findByText('55')).toBeInTheDocument()
  })

  it('removes a competitor when "Retirer" is clicked', async () => {
    mockedApi.listCompetitors.mockResolvedValue([competitor()])
    mockedApi.deleteCompetitor.mockResolvedValue({ deleted: true })

    await renderOnConcurrentsTab()

    fireEvent.click(await screen.findByRole('button', { name: 'Retirer' }))

    await waitFor(() => expect(mockedApi.deleteCompetitor).toHaveBeenCalledWith('comp-1'))
    await waitFor(() =>
      expect(screen.queryByText('https://concurrent.example.com')).not.toBeInTheDocument(),
    )
  })
})
