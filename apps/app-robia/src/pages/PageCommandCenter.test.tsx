import { render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'

import PageCommandCenter from './PageCommandCenter'
import * as api from '../lib/api'
import { useWebsiteContext } from '../components/WebsiteContext'
import type { Audit, IntelligenceFinding, IntelligenceSignal } from '../lib/api'

vi.mock('../lib/api', async (importOriginal) => {
  const actual = await importOriginal<typeof api>()
  return {
    ...actual,
    getIntelligenceStatus: vi.fn(),
    getIntelligenceFindings: vi.fn(),
    listAudits: vi.fn(),
  }
})
vi.mock('../components/WebsiteContext')

const mockedApi = vi.mocked(api)
const mockedUseWebsiteContext = vi.mocked(useWebsiteContext)

const website = { id: 'w1', url: 'https://example.com', name: 'Example' }

function signal(overrides: Partial<IntelligenceSignal> = {}): IntelligenceSignal {
  return {
    provider: 'seo',
    status: 'ok',
    organizationId: 'org-1',
    observedAt: '2026-09-10T00:00:00.000Z',
    readOnly: true,
    scoreInfluence: true,
    data: { version: 'v2', globalScore: 75, categories: {} },
    unavailableReason: null,
    ...overrides,
  }
}

function fullStatus(): IntelligenceSignal[] {
  return [
    signal({ provider: 'seo', status: 'ok', scoreInfluence: true }),
    signal({ provider: 'pagespeed', status: 'ok', scoreInfluence: false }),
    signal({ provider: 'search_console', status: 'not_configured', scoreInfluence: false, data: null }),
    signal({ provider: 'ga4', status: 'not_connected', scoreInfluence: false, data: null }),
    signal({
      provider: 'meta',
      status: 'not_connected',
      scoreInfluence: false,
      data: null,
      unavailableReason: 'not_connected',
    }),
    signal({
      provider: 'gbp',
      status: 'not_connected',
      scoreInfluence: false,
      data: null,
      unavailableReason: 'not_connected',
    }),
  ]
}

function finding(overrides: Partial<IntelligenceFinding> = {}): IntelligenceFinding {
  return {
    provider: 'meta',
    ruleCode: 'META_INSTAGRAM_NOT_LINKED',
    title: 'Aucun compte Instagram professionnel lié',
    description: "Aucun compte Instagram professionnel n'est lié.",
    category: 'social',
    evidence: [],
    recommendation: 'Liez un compte Instagram professionnel.',
    impactScore: 3,
    effortScore: 2,
    confidenceScore: 0.9,
    confidence: 'observed',
    scoreInfluence: false,
    ...overrides,
  }
}

function completedAudit(overrides: Partial<Audit> = {}): Audit {
  return {
    id: 'audit-1',
    organizationId: 'org-1',
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
    createdAt: '2026-09-10T00:00:00Z',
    completedAt: '2026-09-10T00:05:00Z',
    ...overrides,
  }
}

function renderPage() {
  return render(
    <MemoryRouter>
      <PageCommandCenter />
    </MemoryRouter>,
  )
}

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
})

describe('PageCommandCenter — provider status grid', () => {
  it('renders a distinct card for every provider status returned by the backend', async () => {
    mockedApi.getIntelligenceStatus.mockResolvedValue(fullStatus())
    mockedApi.listAudits.mockResolvedValue([])

    renderPage()

    await waitFor(() => expect(screen.getByTestId('intelligence-card-seo')).toBeInTheDocument())
    expect(screen.getByTestId('intelligence-card-pagespeed')).toBeInTheDocument()
    expect(screen.getByTestId('intelligence-card-search_console')).toBeInTheDocument()
    expect(screen.getByTestId('intelligence-card-ga4')).toBeInTheDocument()
    expect(screen.getByTestId('intelligence-card-meta')).toBeInTheDocument()
    expect(screen.getByTestId('intelligence-card-gbp')).toBeInTheDocument()
  })

  it('computes "providers disponibles" and "à configurer" as factual counts, never a health score', async () => {
    mockedApi.getIntelligenceStatus.mockResolvedValue(fullStatus())
    mockedApi.listAudits.mockResolvedValue([])

    renderPage()

    // fullStatus(): seo=ok, pagespeed=ok -> 2 available;
    // search_console=not_configured, ga4=not_connected, meta=not_connected
    // -> 3 to configure. GBP is also not_connected but has no real
    // configuration surface in RC-21, so it must never inflate this count
    // (Codex review) — the raw not_connected/not_configured tally is 4,
    // the correct "actionable" count is 3.
    await waitFor(() => expect(screen.getByText('Providers disponibles')).toBeInTheDocument())
    const available = screen.getByText('Providers disponibles').closest('div')
    expect(available).toHaveTextContent('2')
    const toConfigure = screen.getByText('À configurer').closest('div')
    expect(toConfigure).toHaveTextContent('3')
  })
})

describe('PageCommandCenter — findings require a real completed audit', () => {
  it('loads findings only once a real completed auditId is known', async () => {
    mockedApi.getIntelligenceStatus.mockResolvedValue([])
    mockedApi.listAudits.mockResolvedValue([completedAudit()])
    mockedApi.getIntelligenceFindings.mockResolvedValue([finding()])

    renderPage()

    await waitFor(() =>
      expect(mockedApi.getIntelligenceFindings).toHaveBeenCalledWith('audit-1'),
    )
    expect(screen.getByText('Aucun compte Instagram professionnel lié')).toBeInTheDocument()
  })

  it('shows an explicit empty state with a link to /analyse, and never calls findings, when no audit has completed', async () => {
    mockedApi.getIntelligenceStatus.mockResolvedValue([])
    mockedApi.listAudits.mockResolvedValue([completedAudit({ status: 'pending' })])

    renderPage()

    await waitFor(() => expect(screen.getByText('Aucun audit terminé')).toBeInTheDocument())
    expect(screen.getByRole('link', { name: /Aller à l'analyse/i })).toHaveAttribute('href', '/analyse')
    expect(mockedApi.getIntelligenceFindings).not.toHaveBeenCalled()
  })

  it('shows the same empty state when there is no audit at all', async () => {
    mockedApi.getIntelligenceStatus.mockResolvedValue([])
    mockedApi.listAudits.mockResolvedValue([])

    renderPage()

    await waitFor(() => expect(screen.getByText('Aucun audit terminé')).toBeInTheDocument())
    expect(mockedApi.getIntelligenceFindings).not.toHaveBeenCalled()
  })

  it('shows the same empty state when listAudits itself fails', async () => {
    mockedApi.getIntelligenceStatus.mockResolvedValue([])
    mockedApi.listAudits.mockRejectedValue(new Error('network down'))

    renderPage()

    await waitFor(() => expect(screen.getByText('Aucun audit terminé')).toBeInTheDocument())
    expect(mockedApi.getIntelligenceFindings).not.toHaveBeenCalled()
  })

  it('picks the latest COMPLETED audit even when a more recent audit exists but is not completed yet (Codex review)', async () => {
    mockedApi.getIntelligenceStatus.mockResolvedValue([])
    // listAudits() is sorted desc by createdAt, same as the real backend —
    // the most recent entry (audit-2) is still 'pending'.
    mockedApi.listAudits.mockResolvedValue([
      completedAudit({ id: 'audit-2', status: 'pending', createdAt: '2026-09-12T00:00:00Z' }),
      completedAudit({ id: 'audit-1', status: 'completed', createdAt: '2026-09-10T00:00:00Z' }),
    ])
    mockedApi.getIntelligenceFindings.mockResolvedValue([finding()])

    renderPage()

    await waitFor(() =>
      expect(mockedApi.getIntelligenceFindings).toHaveBeenCalledWith('audit-1'),
    )
    expect(mockedApi.getIntelligenceFindings).not.toHaveBeenCalledWith('audit-2')
    expect(screen.queryByText('Aucun audit terminé')).not.toBeInTheDocument()
  })

  it('never displays the existing SEO score card when there is no completed audit', async () => {
    mockedApi.getIntelligenceStatus.mockResolvedValue([])
    mockedApi.listAudits.mockResolvedValue([])

    renderPage()

    await waitFor(() => expect(screen.getByText('Aucun audit terminé')).toBeInTheDocument())
    expect(screen.queryByTestId('command-center-seo-score')).not.toBeInTheDocument()
  })

  it('displays the existing SEO score as an already-computed backend value once a completed audit is found', async () => {
    mockedApi.getIntelligenceStatus.mockResolvedValue([])
    mockedApi.listAudits.mockResolvedValue([completedAudit({ globalScore: 62 })])
    mockedApi.getIntelligenceFindings.mockResolvedValue([])

    renderPage()

    await waitFor(() => expect(screen.getByTestId('command-center-seo-score')).toBeInTheDocument())
    expect(screen.getByTestId('command-center-seo-score')).toHaveTextContent('62/100')
  })
})

describe('PageCommandCenter — resilience', () => {
  it('keeps rendering the provider status grid when the findings call fails', async () => {
    mockedApi.getIntelligenceStatus.mockResolvedValue(fullStatus())
    mockedApi.listAudits.mockResolvedValue([completedAudit()])
    mockedApi.getIntelligenceFindings.mockRejectedValue(new Error('findings down'))

    renderPage()

    await waitFor(() => expect(screen.getByTestId('intelligence-findings-error')).toBeInTheDocument())
    expect(screen.getByTestId('intelligence-card-seo')).toBeInTheDocument()
    expect(screen.getByTestId('intelligence-card-meta')).toBeInTheDocument()
  })

  it('keeps rendering findings when the provider status call fails', async () => {
    mockedApi.getIntelligenceStatus.mockRejectedValue(new Error('status down'))
    mockedApi.listAudits.mockResolvedValue([completedAudit()])
    mockedApi.getIntelligenceFindings.mockResolvedValue([finding()])

    renderPage()

    await waitFor(() => expect(screen.getByTestId('intelligence-status-error')).toBeInTheDocument())
    expect(screen.getByText('Aucun compte Instagram professionnel lié')).toBeInTheDocument()
  })
})

describe('PageCommandCenter — navigation to existing engines', () => {
  it('links to /opportunites, /execution and /ops/automations', async () => {
    mockedApi.getIntelligenceStatus.mockResolvedValue([])
    mockedApi.listAudits.mockResolvedValue([])

    renderPage()

    await waitFor(() => expect(screen.getByText('Passer à l\'action')).toBeInTheDocument())
    expect(screen.getByRole('link', { name: /Opportunités/i })).toHaveAttribute('href', '/opportunites')
    expect(screen.getByRole('link', { name: /Actions \(RC-14\)/i })).toHaveAttribute('href', '/execution')
    expect(screen.getByRole('link', { name: /Automatisations \(RC-20\)/i })).toHaveAttribute(
      'href',
      '/ops/automations',
    )
  })

  it('links each provider needing configuration to /google-data or /meta-data, and never for GBP', async () => {
    mockedApi.getIntelligenceStatus.mockResolvedValue(fullStatus())
    mockedApi.listAudits.mockResolvedValue([])

    renderPage()

    await waitFor(() => expect(screen.getByTestId('intelligence-card-meta')).toBeInTheDocument())

    const metaCard = screen.getByTestId('intelligence-card-meta')
    expect(metaCard.querySelector('a[href="/meta-data"]')).not.toBeNull()

    const searchConsoleCard = screen.getByTestId('intelligence-card-search_console')
    expect(searchConsoleCard.querySelector('a[href="/google-data"]')).not.toBeNull()

    const ga4Card = screen.getByTestId('intelligence-card-ga4')
    expect(ga4Card.querySelector('a[href="/google-data"]')).not.toBeNull()

    const gbpCard = screen.getByTestId('intelligence-card-gbp')
    expect(gbpCard.querySelector('a')).toBeNull()
  })
})
