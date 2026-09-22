import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import PageExecution from './PageExecution'
import * as api from '../lib/api'
import { useWebsiteContext } from '../components/WebsiteContext'
import type { ActionItem, Opportunity } from '../lib/api'

vi.mock('../lib/api', async (importOriginal) => {
  const actual = await importOriginal<typeof api>()
  return {
    ...actual,
    getCurrentOrganization: vi.fn(),
    getLatestAudit: vi.fn(),
    listOpportunities: vi.fn(),
    listActions: vi.fn(),
    listValidations: vi.fn(),
    listDocuments: vi.fn(),
    updateActionStatus: vi.fn(),
  }
})
vi.mock('../components/WebsiteContext')

const mockedApi = vi.mocked(api)
const mockedUseWebsiteContext = vi.mocked(useWebsiteContext)

const website = { id: 'w1', url: 'https://example.com', name: 'Example' }

function opportunity(overrides: Partial<Opportunity> = {}): Opportunity {
  return {
    id: 'opp-h1',
    organizationId: 'org-1',
    auditId: 'audit-1',
    title: 'Ajouter les titres H1 manquants',
    description: 'Plusieurs pages sans H1.',
    category: 'technical',
    impactScore: 70,
    effortScore: 20,
    confidenceScore: 0.99,
    sourceData: {
      version: 2,
      summary: '3 pages sur 10 sans titre H1',
      ruleCode: 'on_page.h1_missing',
      severity: 'high',
      priorityScore: 80,
      affectedUrls: ['https://example.com/a', 'https://example.com/b', 'https://example.com/c'],
      evidence: [],
      recommendedSteps: [],
    },
    status: 'open',
    createdAt: '2026-09-14T00:00:00Z',
    ...overrides,
  }
}

function action(overrides: Partial<ActionItem>): ActionItem {
  return {
    id: 'action-1',
    opportunityId: 'opp-h1',
    title: 'Ajouter un H1 sur la page A',
    status: 'todo',
    priority: 'high',
    dueDate: null,
    ...overrides,
  }
}

function renderPage() {
  return render(
    <MemoryRouter>
      <PageExecution />
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
  mockedApi.listValidations.mockResolvedValue([])
  mockedApi.listDocuments.mockResolvedValue([])
})

describe('PageExecution — actions grouped by recommendation, not one flat list', () => {
  it('groups every action generated from the same opportunity under one collapsed entry, showing its title once', async () => {
    mockedApi.listOpportunities.mockResolvedValue([opportunity()])
    mockedApi.listActions.mockResolvedValue([
      action({ id: 'action-1', title: 'Ajouter un H1 sur la page A' }),
      action({ id: 'action-2', title: 'Ajouter un H1 sur la page B' }),
    ])

    renderPage()

    await waitFor(() =>
      expect(screen.getByRole('heading', { name: 'Ajouter les titres H1 manquants' })).toBeInTheDocument(),
    )
    // Collapsed by default: the group title (the opportunity's, not each
    // action's own title) appears once as a heading — it separately also
    // appears as a <option> in the document-workflow picker below, which is
    // expected and not what this assertion is about. The individual action
    // titles are not yet rendered as their own card (only the group heading).
    expect(screen.getAllByRole('heading', { name: 'Ajouter les titres H1 manquants' })).toHaveLength(1)
    expect(screen.queryByRole('heading', { level: 3, name: 'Ajouter un H1 sur la page A' })).not.toBeInTheDocument()
    // The summary paragraph's text is split across several JSX-interpolated
    // text nodes, so match on its normalized textContent rather than an
    // exact string.
    expect(
      screen.getByText(
        (_, element) =>
          element?.tagName.toLowerCase() === 'p' &&
          element.textContent?.replace(/\s+/g, ' ').trim() === '2 actions · 3 page(s) concernée(s) · 0/2 terminées',
      ),
    ).toBeInTheDocument()
  })

  it('reveals the individual action cards after clicking "Détails"', async () => {
    mockedApi.listOpportunities.mockResolvedValue([opportunity()])
    mockedApi.listActions.mockResolvedValue([
      action({ id: 'action-1', title: 'Ajouter un H1 sur la page A' }),
      action({ id: 'action-2', title: 'Ajouter un H1 sur la page B' }),
    ])

    renderPage()

    const toggle = await screen.findByRole('button', { name: /Ajouter les titres H1 manquants/i })
    fireEvent.click(toggle)

    // action-1 is also the "next action" surfaced in the banner above (its own
    // <h2>), so once the group is expanded its title legitimately appears
    // twice — disambiguate by asking for the action card's own <h3>.
    await waitFor(() =>
      expect(screen.getByRole('heading', { level: 3, name: 'Ajouter un H1 sur la page A' })).toBeInTheDocument(),
    )
    expect(screen.getByText('Ajouter un H1 sur la page B')).toBeInTheDocument()
  })

  it('renders one group per opportunity when actions come from different recommendations', async () => {
    mockedApi.listOpportunities.mockResolvedValue([
      opportunity({ id: 'opp-h1', title: 'Ajouter les titres H1 manquants' }),
      opportunity({
        id: 'opp-meta',
        title: 'Ajouter les meta descriptions manquantes',
        sourceData: {
          version: 2,
          summary: '5 pages sans meta description',
          ruleCode: 'on_page.meta_description_missing',
          severity: 'medium',
          priorityScore: 60,
          affectedUrls: ['https://example.com/x'],
          evidence: [],
          recommendedSteps: [],
        },
      }),
    ])
    mockedApi.listActions.mockResolvedValue([
      action({ id: 'action-1', opportunityId: 'opp-h1', title: 'Ajouter un H1 sur la page A' }),
      action({ id: 'action-2', opportunityId: 'opp-meta', title: 'Rédiger une meta description' }),
    ])

    renderPage()

    await waitFor(() =>
      expect(screen.getByRole('heading', { name: 'Ajouter les titres H1 manquants' })).toBeInTheDocument(),
    )
    expect(screen.getByRole('heading', { name: 'Ajouter les meta descriptions manquantes' })).toBeInTheDocument()
  })

  it('auto-expands a group that already has an in-progress action', async () => {
    mockedApi.listOpportunities.mockResolvedValue([opportunity()])
    mockedApi.listActions.mockResolvedValue([action({ id: 'action-1', status: 'in_progress' })])

    renderPage()

    // This action is both the sole item of its (auto-expanded) group and the
    // "next action" banner's subject, so its title legitimately appears
    // twice — assert on the action card's own <h3> specifically.
    await waitFor(() =>
      expect(screen.getByRole('heading', { level: 3, name: 'Ajouter un H1 sur la page A' })).toBeInTheDocument(),
    )
  })
})
