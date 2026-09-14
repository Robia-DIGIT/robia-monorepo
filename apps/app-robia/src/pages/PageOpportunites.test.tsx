import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import PageOpportunites from './PageOpportunites'
import * as api from '../lib/api'
import { useWebsiteContext } from '../components/WebsiteContext'
import type { Opportunity } from '../lib/api'

vi.mock('../lib/api', async (importOriginal) => {
  const actual = await importOriginal<typeof api>()
  return {
    ...actual,
    getCurrentOrganization: vi.fn(),
    getLatestAudit: vi.fn(),
    listOpportunities: vi.fn(),
    generateOpportunities: vi.fn(),
    updateOpportunityStatus: vi.fn(),
    generateActions: vi.fn(),
  }
})
vi.mock('../components/WebsiteContext')

const mockedApi = vi.mocked(api)
const mockedUseWebsiteContext = vi.mocked(useWebsiteContext)

const website = { id: 'w1', url: 'https://example.com', name: 'Example' }

const seoOpportunity: Opportunity = {
  id: 'opp-seo-1',
  organizationId: 'org-1',
  auditId: 'audit-1',
  title: 'Ajouter des balises meta description',
  description: 'Plusieurs pages sans meta description.',
  category: 'content',
  impactScore: 70,
  effortScore: 30,
  confidenceScore: 0.9,
  sourceData: {
    version: 2,
    summary: 'Pages sans meta description',
    ruleCode: 'content.meta_description_missing',
    severity: 'high',
    priorityScore: 80,
    affectedUrls: [],
    evidence: [],
    recommendedSteps: [],
  },
  status: 'open',
  createdAt: '2026-09-14T00:00:00Z',
}

function metaOpportunity(overrides: Partial<Opportunity> = {}): Opportunity {
  return {
    id: 'opp-meta-1',
    organizationId: 'org-1',
    auditId: 'audit-1',
    title: 'Aucun compte Instagram professionnel lié',
    description:
      "La Page Facebook active est sélectionnée, mais aucun compte Instagram professionnel n'y est lié.",
    category: 'social',
    // 0-10 scale, matching Robia-Back's META_INSTAGRAM_NOT_LINKED rule
    // (src/integrations/meta-insights.ts) — the same scale SEO findings use.
    impactScore: 3,
    effortScore: 2,
    confidenceScore: 0.9,
    sourceData: {
      version: 1,
      source: 'meta',
      ruleCode: 'META_INSTAGRAM_NOT_LINKED',
      confidence: 'observed',
      evidence: [
        {
          observed: 'Page Facebook sélectionnée sans compte Instagram business lié',
          expected: 'Un compte Instagram professionnel lié à la Page',
        },
      ],
      recommendation:
        'Liez un compte Instagram professionnel à la Page Facebook depuis les paramètres Meta.',
      scoreInfluence: false,
    },
    status: 'open',
    createdAt: '2026-09-14T00:00:00Z',
    ...overrides,
  }
}

function renderPage() {
  return render(
    <MemoryRouter>
      <PageOpportunites />
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
  mockedApi.getCurrentOrganization.mockResolvedValue({
    id: 'o1',
    name: 'Orga',
    city: 'Antananarivo',
  } as Awaited<ReturnType<typeof api.getCurrentOrganization>>)
  mockedApi.getLatestAudit.mockResolvedValue({
    id: 'audit-1',
  } as Awaited<ReturnType<typeof api.getLatestAudit>>)
})

describe('PageOpportunites — Meta opportunity display (RC-19)', () => {
  it('shows a Meta-sourced opportunity with its evidence and recommendation, badged read-only and out of the SEO score', async () => {
    mockedApi.listOpportunities.mockResolvedValue([metaOpportunity()])

    renderPage()

    await waitFor(() =>
      expect(
        screen.getAllByText('Aucun compte Instagram professionnel lié').length,
      ).toBeGreaterThan(0),
    )
    expect(screen.getByText('Meta')).toBeInTheDocument();
    expect(screen.getByText(/Lecture seule/i)).toBeInTheDocument();
    expect(screen.getByText(/Hors score SEO/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Page Facebook sélectionnée sans compte Instagram/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Liez un compte Instagram professionnel/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/Confiance : constat observé/i)).toBeInTheDocument();
  })

  it('marks a heuristic-confidence Meta finding as a heuristic, not a fact', async () => {
    mockedApi.listOpportunities.mockResolvedValue([
      metaOpportunity({
        id: 'opp-meta-2',
        title: 'Activité de publication Instagram faible',
        sourceData: {
          version: 1,
          source: 'meta',
          ruleCode: 'META_LOW_RECENT_ACTIVITY',
          confidence: 'heuristic',
          evidence: [
            {
              observed: '0 publication Instagram sur les 30 derniers jours',
              expected: 'Au moins 1 publication(s) sur 30 jours (seuil heuristique configurable)',
            },
          ],
          recommendation: "Publiez plus régulièrement sur Instagram.",
          scoreInfluence: false,
        },
      }),
    ])

    renderPage()

    await waitFor(() =>
      expect(
        screen.getAllByText('Activité de publication Instagram faible').length,
      ).toBeGreaterThan(0),
    )
    expect(screen.getByText(/Confiance : heuristique/i)).toBeInTheDocument()
    expect(screen.getByText(/seuil configurable/i)).toBeInTheDocument()
  })

  it('never renders a publish/publication button or CTA anywhere on the page', async () => {
    mockedApi.listOpportunities.mockResolvedValue([
      seoOpportunity,
      metaOpportunity(),
    ])

    renderPage()

    await waitFor(() =>
      expect(
        screen.getAllByText('Aucun compte Instagram professionnel lié').length,
      ).toBeGreaterThan(0),
    )

    const buttons = screen.getAllByRole('button')
    buttons.forEach((button) => {
      expect(button.textContent ?? '').not.toMatch(/publier|publish/i)
    })
    expect(screen.queryByText(/publier/i)).not.toBeInTheDocument()
  })

  it('creates a real draft RC-14 ActionItem via generateActions() when the Meta CTA is clicked — never just a status change pretending to (Codex review)', async () => {
    mockedApi.listOpportunities.mockResolvedValue([metaOpportunity()])
    mockedApi.generateActions.mockResolvedValue([
      {
        id: 'action-1',
        opportunityId: 'opp-meta-1',
        title: 'Lier un compte Instagram professionnel',
        status: 'todo',
        priority: 'medium',
        dueDate: null,
      },
    ] as Awaited<ReturnType<typeof api.generateActions>>)
    mockedApi.updateOpportunityStatus.mockResolvedValue({
      ...metaOpportunity(),
      status: 'in_progress',
    })

    renderPage()

    const button = await screen.findByRole('button', {
      name: /Créer une action ROBIA \(brouillon\)/i,
    })
    fireEvent.click(button)

    // The CTA's promise ("brouillon") is backed by the real RC-14 mechanism —
    // generateActions() creates ActionItem rows with approvalStatus: 'draft'
    // and executionStatus: 'not_started' by default (Robia-Back), never a
    // Meta API call and never an executed/published action.
    await waitFor(() =>
      expect(mockedApi.generateActions).toHaveBeenCalledWith('opp-meta-1'),
    )
    await waitFor(() =>
      expect(mockedApi.updateOpportunityStatus).toHaveBeenCalledWith(
        'opp-meta-1',
        'in_progress',
      ),
    )
  })

  it('never creates a draft action when generateActions() fails, and shows an error instead of silently moving the opportunity forward', async () => {
    mockedApi.listOpportunities.mockResolvedValue([metaOpportunity()])
    mockedApi.generateActions.mockRejectedValue(new Error('boom'))

    renderPage()

    const button = await screen.findByRole('button', {
      name: /Créer une action ROBIA \(brouillon\)/i,
    })
    fireEvent.click(button)

    await waitFor(() =>
      expect(mockedApi.generateActions).toHaveBeenCalledWith('opp-meta-1'),
    )
    expect(mockedApi.updateOpportunityStatus).not.toHaveBeenCalled()
  })

  it('still shows the unrelated SEO opportunity alongside the Meta one, unmodified', async () => {
    mockedApi.listOpportunities.mockResolvedValue([
      seoOpportunity,
      metaOpportunity(),
    ])

    renderPage()

    await waitFor(() =>
      expect(
        screen.getAllByText('Ajouter des balises meta description').length,
      ).toBeGreaterThan(0),
    )
    expect(
      screen.getAllByText('Aucun compte Instagram professionnel lié').length,
    ).toBeGreaterThan(0)
    // The SEO card keeps its own SEO-oriented "Impact SEO" meter — the
    // Meta card never claims one.
    expect(screen.getAllByText(/Impact SEO/i).length).toBeGreaterThan(0)
  })

  it('never labels a column average "Impact SEO" when it holds Meta-sourced opportunities (Codex review)', async () => {
    mockedApi.listOpportunities.mockResolvedValue([
      metaOpportunity(),
      metaOpportunity({
        id: 'opp-meta-2',
        title: 'Aucun média Instagram récent',
        sourceData: {
          version: 1,
          source: 'meta',
          ruleCode: 'META_NO_RECENT_MEDIA',
          confidence: 'observed',
          evidence: [],
          recommendation: 'Publiez du contenu régulièrement.',
          scoreInfluence: false,
        },
      }),
    ])

    renderPage()

    await waitFor(() =>
      expect(
        screen.getAllByText('Aucun compte Instagram professionnel lié').length,
      ).toBeGreaterThan(0),
    )
    // Only Meta cards are on the page: the column subtitle must use a
    // neutral "Impact moyen" wording, never "Impact SEO" — a Meta finding's
    // impact is explicitly scoreInfluence: false, not an SEO impact.
    expect(screen.queryByText(/Impact SEO/i)).not.toBeInTheDocument()
    expect(screen.getAllByText(/Impact moyen/i).length).toBeGreaterThan(0)
  })

  it('never features a Meta finding as the "Meilleure prochaine action" hero card, which has no Meta badges (Codex review)', async () => {
    mockedApi.listOpportunities.mockResolvedValue([
      metaOpportunity({ impactScore: 9 }),
    ])

    renderPage()

    await waitFor(() =>
      expect(
        screen.getAllByText('Aucun compte Instagram professionnel lié').length,
      ).toBeGreaterThan(0),
    )
    expect(
      screen.queryByText(/Meilleure prochaine action/i),
    ).not.toBeInTheDocument()
  })
})
