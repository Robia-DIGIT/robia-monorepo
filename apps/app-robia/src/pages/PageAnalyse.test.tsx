import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi, beforeEach } from 'vitest'
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
    mockedApi.auditSubscores.mockImplementation(actualApi.auditSubscores)
    mockedApi.competitorSubscores.mockImplementation(actualApi.competitorSubscores)

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

  // Real-world case (Novotel, RC-24 follow-up): the backend engine can
  // return global_score: 0 as a placeholder when it couldn't actually read
  // the page — never a real score. A failed competitor must show that
  // explicitly, not a bare "—" that reads the same as "not run yet".
  it('shows "Analyse indisponible" — not a 0 score — for a competitor whose audit failed to read the page', async () => {
    mockedApi.listCompetitors.mockResolvedValue([
      competitor({
        status: 'failed',
        globalScore: null,
        errorMessage: 'Site inaccessible : redirection non suivie par le scraper',
      }),
    ])

    await renderOnConcurrentsTab()

    expect(await screen.findByText('Échec')).toBeInTheDocument()
    expect(screen.getByText('Analyse indisponible')).toBeInTheDocument()
    expect(
      screen.getByText('Site inaccessible : redirection non suivie par le scraper'),
    ).toBeInTheDocument()
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

  it('surfaces a real, category-specific recommendation when a completed competitor leads by a meaningful margin', async () => {
    mockedApi.listCompetitors.mockResolvedValue([
      competitor({
        name: 'Concurrent SA',
        status: 'completed',
        globalScore: 70,
        // Own site's subscores are all 0 (beforeEach) — a 45-point lead on
        // 'content' clears the 10-point threshold, a 3-point lead on
        // 'local' does not and must never appear as a recommendation.
        resultJson: {
          summary: '',
          subscores: { local: 3, content: 45, technical: 0, performance: 0, ai_readiness: 0 },
          global_score: 70,
          missing_data: [],
        },
      }),
    ])

    await renderOnConcurrentsTab()

    expect(await screen.findByText('Recommandations basées sur la concurrence')).toBeInTheDocument()
    expect(
      screen.getByText(
        (_, element) =>
          element?.tagName.toLowerCase() === 'p' &&
          element.textContent === 'Concurrent SA vous devance de 45 points sur Contenu local (45/100 contre 0/100) — priorisez vos opportunités de cette catégorie.',
      ),
    ).toBeInTheDocument()
    // 'Local' only leads by 3 points — below the meaningful-gap threshold,
    // never surfaced as its own recommendation line.
    expect(screen.queryByText(/vous devance.*Présence locale/)).not.toBeInTheDocument()
  })

  it('never shows a competition-based recommendation for a competitor that has not completed an analysis', async () => {
    mockedApi.listCompetitors.mockResolvedValue([
      competitor({ status: 'pending', globalScore: null, resultJson: null }),
    ])

    await renderOnConcurrentsTab()

    expect(await screen.findByText('En attente')).toBeInTheDocument()
    expect(screen.queryByText('Recommandations basées sur la concurrence')).not.toBeInTheDocument()
  })
})

// POST /audits/run is a single synchronous call with no job id, step or
// percentage of its own — the "Analyse en cours… X%" bar is a time-based
// estimate computed client-side (see the useEffect in PageAnalyse.tsx),
// never a value read from the backend. These tests drive that estimate
// directly with fake timers instead of waiting on real wall-clock time.
describe('PageAnalyse — estimated progress during analysis', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  function completedAudit(): Awaited<ReturnType<typeof api.runAudit>> {
    return {
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
      createdAt: '2026-09-24T00:00:00Z',
      completedAt: '2026-09-24T00:00:00Z',
    }
  }

  it('advances the estimated progress upward over time while the analysis is running', async () => {
    mockedApi.runAudit.mockReturnValue(new Promise(() => {})) // never resolves in this test

    renderPage()
    const submit = await screen.findByRole('button', { name: /Analyser ce site/i })

    vi.useFakeTimers()
    fireEvent.click(submit)

    // eased = 92 * (1 - e^(-4/18)) ≈ 18.33 -> rounds to 18 at t = 4s exactly.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(4000)
    })

    expect(
      screen.getByText(
        (_, element) => element?.tagName.toLowerCase() === 'h2' && element.textContent === 'Analyse en cours… 18%',
      ),
    ).toBeInTheDocument()
  })

  it('caps the estimated progress at 92% and never claims completion before the real response', async () => {
    mockedApi.runAudit.mockReturnValue(new Promise(() => {})) // still never resolves

    renderPage()
    const submit = await screen.findByRole('button', { name: /Analyser ce site/i })

    vi.useFakeTimers()
    fireEvent.click(submit)

    // Five minutes in, the ease curve is at ~100% of its asymptote — the
    // Math.min(92, …) clamp is what must be doing the actual capping here.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(5 * 60 * 1000)
    })

    expect(
      screen.getByText(
        (_, element) => element?.tagName.toLowerCase() === 'h2' && element.textContent === 'Analyse en cours… 92%',
      ),
    ).toBeInTheDocument()
  })

  it('resets progress to 0 for a fresh run rather than continuing from the previous run’s value', async () => {
    let resolveFirstRun: (value: Awaited<ReturnType<typeof api.runAudit>>) => void = () => {}
    mockedApi.runAudit.mockReturnValueOnce(new Promise((resolve) => { resolveFirstRun = resolve }))
    mockedApi.generateOpportunities.mockResolvedValue([])

    renderPage()
    const submit = await screen.findByRole('button', { name: /Analyser ce site/i })

    vi.useFakeTimers()
    fireEvent.click(submit)
    // Push the first run's estimate all the way to its 92% ceiling.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(5 * 60 * 1000)
    })
    expect(
      screen.getByText(
        (_, element) => element?.tagName.toLowerCase() === 'h2' && element.textContent === 'Analyse en cours… 92%',
      ),
    ).toBeInTheDocument()

    // Finish the first run, then immediately start a second one.
    mockedApi.runAudit.mockReturnValueOnce(new Promise(() => {})) // second run never resolves in this test
    await act(async () => {
      resolveFirstRun(completedAudit())
      await vi.advanceTimersByTimeAsync(0)
    })
    fireEvent.click(screen.getByRole('button', { name: /Analyser ce site|Actualiser l’analyse/i }))

    // t = 0.4s into the SECOND run: eased ≈ 2.02 -> rounds to 2. A leftover
    // 92% here would mean the estimate never reset for the new run.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(400)
    })
    expect(
      screen.getByText(
        (_, element) => element?.tagName.toLowerCase() === 'h2' && element.textContent === 'Analyse en cours… 2%',
      ),
    ).toBeInTheDocument()
  })

  it('clears the progress interval once the analysis finishes, leaving no leaked timer', async () => {
    let resolveRun: (value: Awaited<ReturnType<typeof api.runAudit>>) => void = () => {}
    mockedApi.runAudit.mockReturnValue(new Promise((resolve) => { resolveRun = resolve }))
    mockedApi.generateOpportunities.mockResolvedValue([])

    renderPage()
    const submit = await screen.findByRole('button', { name: /Analyser ce site/i })

    vi.useFakeTimers()
    const clearIntervalSpy = vi.spyOn(globalThis, 'clearInterval')
    const setIntervalSpy = vi.spyOn(globalThis, 'setInterval')

    fireEvent.click(submit)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(400)
    })
    expect(setIntervalSpy).toHaveBeenCalledTimes(1)
    expect(clearIntervalSpy).not.toHaveBeenCalled()

    await act(async () => {
      resolveRun(completedAudit())
      await vi.advanceTimersByTimeAsync(0)
    })

    expect(clearIntervalSpy).toHaveBeenCalledTimes(1)
    // Nothing left running: advancing far past this point raises no further
    // "Analyse en cours…" text and no unhandled state update outside React.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(60_000)
    })
    expect(screen.queryByText(/Analyse en cours…/)).not.toBeInTheDocument()
  })
})
