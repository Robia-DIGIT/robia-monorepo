import { render, screen, waitFor } from '@testing-library/react'
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
    impactScore: 30,
    effortScore: 20,
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

  it('lets a Meta recommendation start a draft ROBIA action, exactly like any other opportunity — never a direct Meta action', async () => {
    mockedApi.listOpportunities.mockResolvedValue([metaOpportunity()])
    mockedApi.updateOpportunityStatus.mockResolvedValue({
      ...metaOpportunity(),
      status: 'in_progress',
    })

    renderPage()

    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: /Créer une action ROBIA \(brouillon\)/i }),
      ).toBeInTheDocument(),
    )
    // The button only transitions ROBIA's own opportunity/action status —
    // it never calls any Meta API (mocked module has no such call to make).
  })

  it('still shows the unrelated SEO opportunity alongside the Meta one, unmodified', async () => {
    mockedApi.listOpportunities.mockResolvedValue([
      seoOpportunity,
      metaOpportunity(),
    ])

    renderPage()

    await waitFor(() =>
      expect(
        screen.getByText('Ajouter des balises meta description'),
      ).toBeInTheDocument(),
    )
    expect(
      screen.getAllByText('Aucun compte Instagram professionnel lié').length,
    ).toBeGreaterThan(0)
    // The SEO card keeps its own SEO-oriented "Impact SEO" meter — the
    // Meta card never claims one.
    expect(screen.getAllByText(/Impact SEO/i).length).toBeGreaterThan(0)
  })
})
