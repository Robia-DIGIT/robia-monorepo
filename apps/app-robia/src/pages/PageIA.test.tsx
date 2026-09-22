import { act } from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { MemoryRouter, RouterProvider, createMemoryRouter } from 'react-router-dom'

import PageIA from './PageIA'
import * as api from '../lib/api'
import { ApiError, type DocumentItem, type Opportunity, type ActionItem, type GoogleBusinessProfileLocation } from '../lib/api'
import { useWebsiteContext } from '../components/WebsiteContext'

vi.mock('../lib/api', async (importOriginal) => {
  const actual = await importOriginal<typeof api>()
  return {
    ...actual,
    getOpportunity: vi.fn(),
    listActions: vi.fn(),
    listGoogleBusinessProfileLocations: vi.fn(),
    generateStudioDocument: vi.fn(),
    listDocumentsByWebsite: vi.fn(),
    updateDocument: vi.fn(),
    getDocument: vi.fn(),
  }
})
vi.mock('../components/WebsiteContext')

const mockedApi = vi.mocked(api)
const mockedUseWebsiteContext = vi.mocked(useWebsiteContext)

const website = { id: 'w1', url: 'https://example.com', name: 'Example' }

function opportunity(overrides: Partial<Opportunity> = {}): Opportunity {
  return {
    id: 'opp-1',
    organizationId: 'org-1',
    auditId: 'audit-1',
    title: 'Ajouter un H1',
    description: 'Desc',
    category: 'technical',
    impactScore: 50,
    effortScore: 10,
    confidenceScore: 0.9,
    sourceData: '',
    status: 'open',
    createdAt: '2026-09-01T00:00:00Z',
    ...overrides,
  }
}

function actionItem(overrides: Partial<ActionItem> = {}): ActionItem {
  return {
    id: 'action-1',
    opportunityId: 'opp-1',
    title: 'Publier la fiche',
    status: 'todo',
    priority: 'high',
    dueDate: null,
    ...overrides,
  }
}

function businessLocation(overrides: Partial<GoogleBusinessProfileLocation> = {}): GoogleBusinessProfileLocation {
  return {
    id: 'loc-1',
    googleAccountName: 'accounts/1',
    accountDisplayName: 'Mon compte',
    googleLocationName: 'locations/1',
    languageCode: 'fr',
    title: 'Boutique Analakely',
    storeCode: null,
    address: null,
    primaryPhone: null,
    additionalPhones: [],
    websiteUri: null,
    primaryCategory: null,
    additionalCategories: [],
    description: null,
    regularHours: null,
    specialHours: null,
    moreHours: null,
    serviceArea: null,
    labels: [],
    latitude: null,
    longitude: null,
    openStatus: null,
    metadata: null,
    lastSyncedAt: '2026-09-01T00:00:00Z',
    robiaLocationId: null,
    robiaLocation: null,
    ...overrides,
  } as GoogleBusinessProfileLocation
}

function documentItem(overrides: Partial<DocumentItem> = {}): DocumentItem {
  return {
    id: 'doc-1',
    type: 'gbp_post',
    title: 'Brouillon généré',
    content: "Contenu genere.\n\nDeuxieme paragraphe.",
    status: 'draft',
    revision: 1,
    websiteId: 'w1',
    createdAt: '2026-09-22T00:00:00Z',
    updatedAt: '2026-09-22T00:00:00Z',
    ...overrides,
  }
}

function renderPage(initialEntries: string[] = ['/ia']) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <PageIA />
    </MemoryRouter>,
  )
}

// A free generation (no Opportunity in context) requires a real objective —
// most tests below aren't testing that rule itself, so they opt in to a
// valid one up front to reach the behavior they actually exercise.
async function fillFreeObjective(value = 'Un objectif suffisamment long') {
  fireEvent.change(await screen.findByLabelText('Objectif'), { target: { value } })
}

// MemoryRouter only reads `initialEntries` on its first mount — a later
// `rerender` with a different value never actually navigates it (a known
// react-router gotcha), so it cannot be used to test an in-place query-param
// transition on an already-mounted PageIA. createMemoryRouter + navigate()
// performs a real, in-place navigation instead.
function renderPageWithRouter(initialPath: string) {
  const router = createMemoryRouter([{ path: '*', element: <PageIA /> }], { initialEntries: [initialPath] })
  const utils = render(<RouterProvider router={router} />)
  return { ...utils, navigate: (path: string) => act(() => { router.navigate(path) }) }
}

const websiteB = { id: 'w2', url: 'https://other.example.com', name: 'Other' }

// StudioWorkspace is keyed by activeWebsiteId in PageIA, so switching sites
// unmounts the entire site-A workspace (including its ContentComposer) and
// mounts a fresh one for B — this simulates that switch mid-test.
function switchToWebsiteB(rerender: ReturnType<typeof renderPage>['rerender'], route = '/ia') {
  mockedUseWebsiteContext.mockReturnValue({
    websites: [website, websiteB],
    activeWebsiteId: 'w2',
    activeWebsite: websiteB,
    loadingWebsites: false,
    setActiveWebsiteId: vi.fn(),
    refreshWebsites: vi.fn().mockResolvedValue(undefined),
  } as ReturnType<typeof useWebsiteContext>)
  rerender(<MemoryRouter initialEntries={[route]}><PageIA /></MemoryRouter>)
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
  mockedApi.listActions.mockResolvedValue([])
  mockedApi.listGoogleBusinessProfileLocations.mockResolvedValue([])
  mockedApi.listDocumentsByWebsite.mockResolvedValue([])
})

describe('PageIA — Content Studio (RC39)', () => {
  it('generates a document freely with only websiteId and a brief (no opportunity)', async () => {
    mockedApi.generateStudioDocument.mockResolvedValue(documentItem())

    renderPage()

    fireEvent.change(screen.getByLabelText('Objectif'), { target: { value: 'Annoncer une promo' } })
    fireEvent.click(await screen.findByRole('button', { name: /Générer le brouillon/i }))

    await waitFor(() => expect(mockedApi.generateStudioDocument).toHaveBeenCalledTimes(1))
    const payload = mockedApi.generateStudioDocument.mock.calls[0][0]
    expect(payload.websiteId).toBe('w1')
    expect(payload.opportunityId).toBeUndefined()
    expect(payload.actionItemId).toBeUndefined()
    expect(payload.brief.objective).toBe('Annoncer une promo')
    expect(payload.brief.locale).toBe('fr-MG')
  })

  it('generates a document from an opportunityId resolved from the query params', async () => {
    mockedApi.getOpportunity.mockResolvedValue(opportunity())
    mockedApi.generateStudioDocument.mockResolvedValue(documentItem({ opportunityId: 'opp-1' }))

    renderPage(['/ia?opportunityId=opp-1'])

    await waitFor(() => expect(screen.getByText('Ajouter un H1')).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: /Générer le brouillon/i }))

    await waitFor(() => expect(mockedApi.generateStudioDocument).toHaveBeenCalledTimes(1))
    expect(mockedApi.generateStudioDocument.mock.calls[0][0].opportunityId).toBe('opp-1')
  })

  it('prefills type/opportunity/action/establishment context from query params', async () => {
    mockedApi.getOpportunity.mockResolvedValue(opportunity())
    mockedApi.listActions.mockResolvedValue([actionItem()])
    mockedApi.listGoogleBusinessProfileLocations.mockResolvedValue([businessLocation()])

    renderPage(['/ia?opportunityId=opp-1&actionItemId=action-1&businessLocationId=loc-1&type=local_page'])

    await waitFor(() => expect(screen.getByText('Ajouter un H1')).toBeInTheDocument())
    expect(screen.getByText('Publier la fiche')).toBeInTheDocument()
    expect(screen.getByText('Boutique Analakely')).toBeInTheDocument()
    expect(screen.queryByText(/Contexte partiel/)).not.toBeInTheDocument()
  })

  it('shows a partial-context notice when a query param cannot be resolved, without fabricating context', async () => {
    mockedApi.getOpportunity.mockRejectedValue(new ApiError('Ressource introuvable (404).', 404))

    renderPage(['/ia?opportunityId=missing'])

    await waitFor(() => expect(screen.getByText(/Contexte partiel/)).toBeInTheDocument())
    expect(screen.getByText(/opportunité indiquée n'a pas pu être retrouvée/)).toBeInTheDocument()
  })

  it('ignores a generation response that resolves after the active website changed', async () => {
    let resolveGeneration: (value: DocumentItem) => void = () => {}
    mockedApi.generateStudioDocument.mockReturnValue(
      new Promise((resolve) => { resolveGeneration = resolve }),
    )

    const { rerender } = renderPage()
    await fillFreeObjective()
    fireEvent.click(screen.getByRole('button', { name: /Générer le brouillon/i }))
    await waitFor(() => expect(mockedApi.generateStudioDocument).toHaveBeenCalledTimes(1))

    // Site switches away while the generation call is still in flight.
    mockedUseWebsiteContext.mockReturnValue({
      websites: [website, { id: 'w2', url: 'https://other.example.com', name: 'Other' }],
      activeWebsiteId: 'w2',
      activeWebsite: { id: 'w2', url: 'https://other.example.com', name: 'Other' },
      loadingWebsites: false,
      setActiveWebsiteId: vi.fn(),
      refreshWebsites: vi.fn().mockResolvedValue(undefined),
    } as ReturnType<typeof useWebsiteContext>)
    rerender(<MemoryRouter initialEntries={['/ia']}><PageIA /></MemoryRouter>)

    resolveGeneration(documentItem())
    await Promise.resolve()

    // The stale draft must never appear — the generation targeted w1, not the now-active w2.
    expect(screen.queryByText('Brouillon généré')).not.toBeInTheDocument()
  })

  it('shows a real error from the AI engine and lets the user see what failed', async () => {
    mockedApi.generateStudioDocument.mockRejectedValue(new Error('Le moteur de génération est indisponible.'))

    renderPage()
    await fillFreeObjective()
    fireEvent.click(screen.getByRole('button', { name: /Générer le brouillon/i }))

    await waitFor(() => expect(screen.getByText('Le moteur de génération est indisponible.')).toBeInTheDocument())
  })

  it('never fires a second generation on a double-click', async () => {
    let resolveGeneration: (value: DocumentItem) => void = () => {}
    mockedApi.generateStudioDocument.mockReturnValue(
      new Promise((resolve) => { resolveGeneration = resolve }),
    )

    renderPage()
    await fillFreeObjective()
    const button = screen.getByRole('button', { name: /Générer le brouillon/i })
    fireEvent.click(button)
    fireEvent.click(button)
    fireEvent.click(button)

    expect(mockedApi.generateStudioDocument).toHaveBeenCalledTimes(1)
    resolveGeneration(documentItem())
  })

  it('loads the library scoped to website_id, not one call per opportunity', async () => {
    mockedApi.listDocumentsByWebsite.mockResolvedValue([documentItem()])

    renderPage()

    await waitFor(() => expect(mockedApi.listDocumentsByWebsite).toHaveBeenCalledWith('w1'))
    expect(mockedApi.listDocumentsByWebsite).toHaveBeenCalledTimes(1)
    expect(await screen.findByText('Brouillon généré')).toBeInTheDocument()
  })

  it('saves an edit with expectedRevision and reflects the incremented revision', async () => {
    mockedApi.generateStudioDocument.mockResolvedValue(documentItem({ revision: 1 }))
    mockedApi.updateDocument.mockResolvedValue(documentItem({ revision: 2, content: 'Contenu modifie.' }))

    renderPage()
    await fillFreeObjective()
    fireEvent.click(screen.getByRole('button', { name: /Générer le brouillon/i }))
    const editor = await screen.findByDisplayValue(/Contenu genere/)
    fireEvent.change(editor, { target: { value: 'Contenu modifie.' } })
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }))

    await waitFor(() => expect(mockedApi.updateDocument).toHaveBeenCalledWith('doc-1', {
      content: 'Contenu modifie.',
      expectedRevision: 1,
    }))
    expect(await screen.findByText(/Révision 2/)).toBeInTheDocument()
  })

  it('on a 409 conflict, never overwrites and offers to reload the latest version', async () => {
    mockedApi.generateStudioDocument.mockResolvedValue(documentItem({ revision: 1 }))
    mockedApi.updateDocument.mockRejectedValue(new ApiError('Conflit de version.', 409))
    mockedApi.getDocument.mockResolvedValue(documentItem({ revision: 3, content: 'Version serveur plus recente.' }))

    renderPage()
    await fillFreeObjective()
    fireEvent.click(screen.getByRole('button', { name: /Générer le brouillon/i }))
    const editor = await screen.findByDisplayValue(/Contenu genere/)
    fireEvent.change(editor, { target: { value: 'Mon texte local non enregistre.' } })
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }))

    await waitFor(() => expect(screen.getByText(/n'a pas été enregistrée/)).toBeInTheDocument())
    // Local text preserved verbatim for the user to copy AND still shown in
    // the live editor (never silently discarded or overwritten) — both
    // textareas legitimately carry the same unsaved text at this point.
    expect(screen.getAllByDisplayValue('Mon texte local non enregistre.')).toHaveLength(2)

    fireEvent.click(screen.getByRole('button', { name: 'Recharger la dernière version' }))
    await waitFor(() => expect(screen.getByDisplayValue('Version serveur plus recente.')).toBeInTheDocument())
  })

  it('links a generated document to the associated Action via ActionApprovalWorkflow', async () => {
    mockedApi.listActions.mockResolvedValue([actionItem()])
    mockedApi.generateStudioDocument.mockResolvedValue(documentItem({ actionItemId: 'action-1' }))

    renderPage(['/ia?actionItemId=action-1'])
    await waitFor(() => expect(screen.getByText('Publier la fiche')).toBeInTheDocument())
    await fillFreeObjective()
    fireEvent.click(screen.getByRole('button', { name: /Générer le brouillon/i }))

    await waitFor(() => expect(screen.getByText('Validation humaine')).toBeInTheDocument())
  })

  it('shows no ActionApprovalWorkflow and no fake second approval when no Action is associated', async () => {
    mockedApi.generateStudioDocument.mockResolvedValue(documentItem())

    renderPage()
    await fillFreeObjective()
    fireEvent.click(screen.getByRole('button', { name: /Générer le brouillon/i }))

    await waitFor(() => expect(screen.getByText(/n'est pas encore relié à une Action/)).toBeInTheDocument())
    expect(screen.queryByText('Validation humaine')).not.toBeInTheDocument()
  })

  it('renders an indicative Google preview, clearly labelled as such', async () => {
    mockedApi.generateStudioDocument.mockResolvedValue(documentItem({ type: 'gbp_post' }))

    renderPage()
    await fillFreeObjective()
    fireEvent.click(screen.getByRole('button', { name: /Générer le brouillon/i }))

    await waitFor(() => expect(screen.getAllByText(/Contenu genere/).length).toBeGreaterThan(0))
    expect(screen.getAllByText('Aperçu indicatif').length).toBeGreaterThan(0)
    expect(screen.getByText(/ne reproduit pas l'interface Google/)).toBeInTheDocument()
  })

  it('never enables Google publication and never claims OAuth means authorization to publish', async () => {
    renderPage()
    const publishButton = await screen.findByRole('button', { name: /Publication Google disponible dans la prochaine étape/i })
    expect(publishButton).toBeDisabled()
    expect(screen.getByText(/ne vaut pas autorisation de publier/)).toBeInTheDocument()
  })

  it('never renders generated content as executable HTML', async () => {
    mockedApi.generateStudioDocument.mockResolvedValue(
      documentItem({ content: '<img src=x onerror="window.__xss=true">Bonjour<script>window.__xss2=true</script>' }),
    )

    renderPage()
    await fillFreeObjective()
    fireEvent.click(screen.getByRole('button', { name: /Générer le brouillon/i }))

    await waitFor(() => expect(screen.getAllByText(/Bonjour/).length).toBeGreaterThan(0))
    expect(document.querySelector('script')).toBeNull()
    expect((window as unknown as { __xss?: boolean }).__xss).toBeUndefined()
  })

  it('exposes mobile Brief/Contenu/Aperçu tabs and switches between them', async () => {
    mockedApi.generateStudioDocument.mockResolvedValue(documentItem())

    renderPage()
    await fillFreeObjective()
    fireEvent.click(screen.getByRole('button', { name: /Générer le brouillon/i }))
    await waitFor(() => expect(screen.getAllByText('Brouillon généré').length).toBeGreaterThan(0))

    const previewTab = screen.getByRole('button', { name: 'Aperçu' })
    fireEvent.click(previewTab)
    expect(previewTab.className).toContain('bg-navy')
  })

  it('never keeps a generated document visible after switching to a different site', async () => {
    mockedApi.generateStudioDocument.mockResolvedValue(documentItem({ title: 'Doc du site A' }))

    const { rerender } = renderPage()
    await fillFreeObjective()
    fireEvent.click(screen.getByRole('button', { name: /Générer le brouillon/i }))
    await waitFor(() => expect(screen.getAllByText('Doc du site A').length).toBeGreaterThan(0))

    const websiteB = { id: 'w2', url: 'https://other.example.com', name: 'Other' }
    mockedUseWebsiteContext.mockReturnValue({
      websites: [website, websiteB],
      activeWebsiteId: 'w2',
      activeWebsite: websiteB,
      loadingWebsites: false,
      setActiveWebsiteId: vi.fn(),
      refreshWebsites: vi.fn().mockResolvedValue(undefined),
    } as ReturnType<typeof useWebsiteContext>)
    rerender(<MemoryRouter initialEntries={['/ia']}><PageIA /></MemoryRouter>)

    expect(screen.queryByText('Doc du site A')).not.toBeInTheDocument()
    // The composer itself must be a fresh, empty instance for site B, not
    // the site-A instance with its document/content/brief still attached.
    expect(screen.queryByDisplayValue(/Un objectif suffisamment long/)).not.toBeInTheDocument()
  })

  it('clears a library selection made on one site when switching to another', async () => {
    const docA = documentItem({ id: 'doc-a', title: 'Document de A' })
    mockedApi.listDocumentsByWebsite.mockResolvedValue([docA])

    const { rerender } = renderPage()
    fireEvent.click(await screen.findByText('Document de A'))
    await waitFor(() => expect(screen.getByText('Vous modifiez :')).toBeInTheDocument())

    const websiteB = { id: 'w2', url: 'https://other.example.com', name: 'Other' }
    mockedUseWebsiteContext.mockReturnValue({
      websites: [website, websiteB],
      activeWebsiteId: 'w2',
      activeWebsite: websiteB,
      loadingWebsites: false,
      setActiveWebsiteId: vi.fn(),
      refreshWebsites: vi.fn().mockResolvedValue(undefined),
    } as ReturnType<typeof useWebsiteContext>)
    mockedApi.listDocumentsByWebsite.mockResolvedValue([])
    rerender(<MemoryRouter initialEntries={['/ia']}><PageIA /></MemoryRouter>)

    expect(screen.queryByText('Vous modifiez :')).not.toBeInTheDocument()
  })

  it('ignores a save response that resolves after the active website changed', async () => {
    mockedApi.generateStudioDocument.mockResolvedValue(documentItem({ revision: 1 }))
    let resolveSave: (value: DocumentItem) => void = () => {}
    mockedApi.updateDocument.mockReturnValue(new Promise((resolve) => { resolveSave = resolve }))

    const { rerender } = renderPage()
    await fillFreeObjective()
    fireEvent.click(screen.getByRole('button', { name: /Générer le brouillon/i }))
    const editor = await screen.findByDisplayValue(/Contenu genere/)
    fireEvent.change(editor, { target: { value: 'Modifie avant changement de site.' } })
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }))
    await waitFor(() => expect(mockedApi.updateDocument).toHaveBeenCalledTimes(1))

    const websiteB = { id: 'w2', url: 'https://other.example.com', name: 'Other' }
    mockedUseWebsiteContext.mockReturnValue({
      websites: [website, websiteB],
      activeWebsiteId: 'w2',
      activeWebsite: websiteB,
      loadingWebsites: false,
      setActiveWebsiteId: vi.fn(),
      refreshWebsites: vi.fn().mockResolvedValue(undefined),
    } as ReturnType<typeof useWebsiteContext>)
    rerender(<MemoryRouter initialEntries={['/ia']}><PageIA /></MemoryRouter>)

    resolveSave(documentItem({ revision: 2, content: 'Modifie avant changement de site.' }))
    await Promise.resolve()

    expect(screen.queryByDisplayValue('Modifie avant changement de site.')).not.toBeInTheDocument()
  })

  it('never shows the previous site\'s Opportunity/Action/establishment context while the new site is still loading', async () => {
    mockedApi.getOpportunity.mockResolvedValue(opportunity())
    mockedApi.listActions.mockResolvedValue([actionItem()])
    mockedApi.listGoogleBusinessProfileLocations.mockResolvedValue([businessLocation()])

    const { rerender } = renderPage(['/ia?opportunityId=opp-1&actionItemId=action-1&businessLocationId=loc-1'])
    await waitFor(() => expect(screen.getByText('Ajouter un H1')).toBeInTheDocument())
    expect(screen.getByText('Publier la fiche')).toBeInTheDocument()
    expect(screen.getByText('Boutique Analakely')).toBeInTheDocument()

    // Site B's own lookups never resolve within this test — only whether
    // site A's context disappears immediately matters here.
    mockedApi.getOpportunity.mockReturnValue(new Promise(() => {}))
    mockedApi.listActions.mockReturnValue(new Promise(() => {}))
    mockedApi.listGoogleBusinessProfileLocations.mockReturnValue(new Promise(() => {}))

    const websiteB = { id: 'w2', url: 'https://other.example.com', name: 'Other' }
    mockedUseWebsiteContext.mockReturnValue({
      websites: [website, websiteB],
      activeWebsiteId: 'w2',
      activeWebsite: websiteB,
      loadingWebsites: false,
      setActiveWebsiteId: vi.fn(),
      refreshWebsites: vi.fn().mockResolvedValue(undefined),
    } as ReturnType<typeof useWebsiteContext>)
    rerender(<MemoryRouter initialEntries={['/ia?opportunityId=opp-1&actionItemId=action-1&businessLocationId=loc-1']}><PageIA /></MemoryRouter>)

    expect(screen.queryByText('Ajouter un H1')).not.toBeInTheDocument()
    expect(screen.queryByText('Publier la fiche')).not.toBeInTheDocument()
    expect(screen.queryByText('Boutique Analakely')).not.toBeInTheDocument()
  })

  it('exposes accessible form labels and a labelled remove-fact action', async () => {
    renderPage()
    expect(await screen.findByLabelText('Objectif')).toBeInTheDocument()
    expect(screen.getByLabelText('Audience')).toBeInTheDocument()
    expect(screen.getByLabelText('Ton')).toBeInTheDocument()
    expect(screen.getByLabelText('Langue')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Ajouter un fait/i }))
    expect(screen.getAllByRole('button', { name: 'Retirer ce fait' }).length).toBeGreaterThan(0)
  })

  it('caps facts at 12 and disables adding more', async () => {
    renderPage()
    const addButton = await screen.findByRole('button', { name: /Ajouter un fait/i })
    for (let i = 0; i < 12; i++) fireEvent.click(addButton)
    expect(addButton).toBeDisabled()
  })

  describe('brief validation and payload shape', () => {
    it('makes a free generation impossible with no objective at all', async () => {
      renderPage()
      const button = await screen.findByRole('button', { name: /Générer le brouillon/i })
      expect(button).toBeDisabled()
      fireEvent.click(button)
      expect(mockedApi.generateStudioDocument).not.toHaveBeenCalled()
    })

    it('makes a free generation impossible with a 1-2 character objective', async () => {
      renderPage()
      await fillFreeObjective('Ok')
      const button = screen.getByRole('button', { name: /Générer le brouillon/i })
      expect(button).toBeDisabled()
      expect(screen.getByText(/Encore un peu court/)).toBeInTheDocument()
      fireEvent.click(button)
      expect(mockedApi.generateStudioDocument).not.toHaveBeenCalled()
    })

    it('allows a free generation once the objective reaches 3 characters', async () => {
      mockedApi.generateStudioDocument.mockResolvedValue(documentItem())
      renderPage()
      await fillFreeObjective('Ouv')
      const button = screen.getByRole('button', { name: /Générer le brouillon/i })
      expect(button).not.toBeDisabled()
      fireEvent.click(button)
      await waitFor(() => expect(mockedApi.generateStudioDocument).toHaveBeenCalledTimes(1))
      expect(mockedApi.generateStudioDocument.mock.calls[0][0].brief.objective).toBe('Ouv')
    })

    it('omits an empty objective from the payload when generating from an Opportunity, rather than sending an empty string', async () => {
      mockedApi.getOpportunity.mockResolvedValue(opportunity())
      mockedApi.generateStudioDocument.mockResolvedValue(documentItem({ opportunityId: 'opp-1' }))

      renderPage(['/ia?opportunityId=opp-1'])
      await waitFor(() => expect(screen.getByText('Ajouter un H1')).toBeInTheDocument())
      // No objective typed — an Opportunity is present, so the button must
      // already be enabled (no free-creation requirement applies).
      const button = screen.getByRole('button', { name: /Générer le brouillon/i })
      expect(button).not.toBeDisabled()
      fireEvent.click(button)

      await waitFor(() => expect(mockedApi.generateStudioDocument).toHaveBeenCalledTimes(1))
      const brief = mockedApi.generateStudioDocument.mock.calls[0][0].brief
      expect(brief).not.toHaveProperty('objective')
      expect(brief.locale).toBe('fr-MG')
    })

    it('still transmits audience/tone/facts when the user actually filled them in', async () => {
      mockedApi.getOpportunity.mockResolvedValue(opportunity())
      mockedApi.generateStudioDocument.mockResolvedValue(documentItem({ opportunityId: 'opp-1' }))

      renderPage(['/ia?opportunityId=opp-1'])
      await waitFor(() => expect(screen.getByText('Ajouter un H1')).toBeInTheDocument())
      fireEvent.change(screen.getByLabelText('Audience'), { target: { value: 'Clients locaux' } })
      fireEvent.change(screen.getByLabelText('Ton'), { target: { value: 'Chaleureux' } })
      fireEvent.change(screen.getByPlaceholderText('Ex. Ouvert 7j/7 de 8h à 20h'), { target: { value: 'Ouvert le dimanche' } })
      fireEvent.click(screen.getByRole('button', { name: /Générer le brouillon/i }))

      await waitFor(() => expect(mockedApi.generateStudioDocument).toHaveBeenCalledTimes(1))
      const brief = mockedApi.generateStudioDocument.mock.calls[0][0].brief
      expect(brief.audience).toBe('Clients locaux')
      expect(brief.tone).toBe('Chaleureux')
      expect(brief.facts).toEqual(['Ouvert le dimanche'])
      expect(brief).not.toHaveProperty('objective')
    })
  })

  describe('opportunity/website mismatch reported by the backend', () => {
    it('drops the opportunity context and shows an honest message when the backend rejects a site mismatch', async () => {
      mockedApi.getOpportunity.mockResolvedValue(opportunity())
      mockedApi.generateStudioDocument.mockRejectedValue(
        new ApiError("L'opportunité n'appartient pas au site demandé.", 400),
      )

      renderPage(['/ia?opportunityId=opp-1'])
      await waitFor(() => expect(screen.getByText('Ajouter un H1')).toBeInTheDocument())
      fireEvent.click(screen.getByRole('button', { name: /Générer le brouillon/i }))

      // Both the page-level notice and the composer's own error mention the
      // dropped context — legitimately shown together.
      await waitFor(() => expect(screen.getAllByText(/contexte retiré/).length).toBeGreaterThan(0))
      // The stale Opportunity context the server just rejected must not
      // linger in ContentSources once it's been dropped.
      expect(screen.queryByText('Ajouter un H1')).not.toBeInTheDocument()
    })
  })

  describe('"Nouveau contenu"', () => {
    it('lets the user leave a selected library document for a blank composer without deleting it', async () => {
      const docA = documentItem({ id: 'doc-a', title: 'Ancien document' })
      mockedApi.listDocumentsByWebsite.mockResolvedValue([docA])

      renderPage()
      fireEvent.click(await screen.findByText('Ancien document'))
      await waitFor(() => expect(screen.getByText('Vous modifiez :')).toBeInTheDocument())

      fireEvent.click(screen.getByRole('button', { name: 'Nouveau contenu' }))

      expect(screen.queryByText('Vous modifiez :')).not.toBeInTheDocument()
      // Deselecting is purely client-side — the document must still be
      // listed in the library, never removed or mutated.
      expect(screen.getByText('Ancien document')).toBeInTheDocument()
    })
  })

  describe('a dead ContentComposer instance never acts after it is gone', () => {
    it('never shows a "contexte retiré" notice or drops site B\'s opportunity when site A\'s generation rejects for a mismatch after the switch', async () => {
      let rejectGenerationA: (error: unknown) => void = () => {}
      mockedApi.generateStudioDocument.mockReturnValue(new Promise((_, reject) => { rejectGenerationA = reject }))
      mockedApi.getOpportunity.mockResolvedValue(opportunity({ id: 'opp-b', title: 'Opportunité du site B' }))

      const { navigate } = renderPageWithRouter('/ia')
      await fillFreeObjective()
      fireEvent.click(screen.getByRole('button', { name: /Générer le brouillon/i }))
      await waitFor(() => expect(mockedApi.generateStudioDocument).toHaveBeenCalledTimes(1))

      mockedUseWebsiteContext.mockReturnValue({
        websites: [website, websiteB],
        activeWebsiteId: 'w2',
        activeWebsite: websiteB,
        loadingWebsites: false,
        setActiveWebsiteId: vi.fn(),
        refreshWebsites: vi.fn().mockResolvedValue(undefined),
      } as ReturnType<typeof useWebsiteContext>)
      navigate('/ia?opportunityId=opp-b')
      await waitFor(() => expect(screen.getByText('Opportunité du site B')).toBeInTheDocument())

      rejectGenerationA(new ApiError("L'opportunité n'appartient pas au site demandé.", 400))
      await Promise.resolve()
      await Promise.resolve()

      // Site A's dead instance must never call site B's onInvalidOpportunityContext.
      expect(screen.getByText('Opportunité du site B')).toBeInTheDocument()
      expect(screen.queryByText(/contexte retiré/)).not.toBeInTheDocument()
    })

    it('never calls onDocumentPersisted for a site-A generation that resolves successfully after the switch to B', async () => {
      let resolveGenerationA: (value: DocumentItem) => void = () => {}
      mockedApi.generateStudioDocument.mockReturnValue(new Promise((resolve) => { resolveGenerationA = resolve }))
      mockedApi.listDocumentsByWebsite.mockResolvedValue([])

      const { rerender } = renderPage()
      await fillFreeObjective()
      fireEvent.click(screen.getByRole('button', { name: /Générer le brouillon/i }))
      await waitFor(() => expect(mockedApi.generateStudioDocument).toHaveBeenCalledTimes(1))

      switchToWebsiteB(rerender)
      await waitFor(() => expect(mockedApi.listDocumentsByWebsite).toHaveBeenCalledWith('w2'))
      const callsAfterSwitch = mockedApi.listDocumentsByWebsite.mock.calls.length

      resolveGenerationA(documentItem({ title: 'Doc perime du site A' }))
      await Promise.resolve()
      await Promise.resolve()

      // onDocumentPersisted bumps the library's refresh token, which would
      // trigger another listDocumentsByWebsite call — none must happen here.
      expect(mockedApi.listDocumentsByWebsite.mock.calls.length).toBe(callsAfterSwitch)
      expect(screen.queryByText('Doc perime du site A')).not.toBeInTheDocument()
    })

    it('never calls onDocumentPersisted for a site-A save that resolves successfully after the switch to B', async () => {
      mockedApi.generateStudioDocument.mockResolvedValue(documentItem({ revision: 1 }))
      let resolveSaveA: (value: DocumentItem) => void = () => {}
      mockedApi.updateDocument.mockReturnValue(new Promise((resolve) => { resolveSaveA = resolve }))
      mockedApi.listDocumentsByWebsite.mockResolvedValue([])

      const { rerender } = renderPage()
      await fillFreeObjective()
      fireEvent.click(screen.getByRole('button', { name: /Générer le brouillon/i }))
      const editor = await screen.findByDisplayValue(/Contenu genere/)
      fireEvent.change(editor, { target: { value: 'Modifie avant passage a B.' } })
      fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }))
      await waitFor(() => expect(mockedApi.updateDocument).toHaveBeenCalledTimes(1))

      switchToWebsiteB(rerender)
      await waitFor(() => expect(mockedApi.listDocumentsByWebsite).toHaveBeenCalledWith('w2'))
      const callsAfterSwitch = mockedApi.listDocumentsByWebsite.mock.calls.length

      resolveSaveA(documentItem({ revision: 2, content: 'Modifie avant passage a B.' }))
      await Promise.resolve()
      await Promise.resolve()

      expect(mockedApi.listDocumentsByWebsite.mock.calls.length).toBe(callsAfterSwitch)
    })

    it('never shows a conflict banner on site B from site A\'s conflict whose getDocument reload resolves after the switch', async () => {
      mockedApi.generateStudioDocument.mockResolvedValue(documentItem({ revision: 1 }))
      mockedApi.updateDocument.mockRejectedValue(new ApiError('Conflit.', 409))
      let resolveGetDocumentA: (value: DocumentItem) => void = () => {}
      mockedApi.getDocument.mockReturnValue(new Promise((resolve) => { resolveGetDocumentA = resolve }))

      const { rerender } = renderPage()
      await fillFreeObjective()
      fireEvent.click(screen.getByRole('button', { name: /Générer le brouillon/i }))
      const editor = await screen.findByDisplayValue(/Contenu genere/)
      fireEvent.change(editor, { target: { value: 'Modifie en conflit avant B.' } })
      fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }))
      // Wait until the 409 catch branch has reached its own getDocument() call.
      await waitFor(() => expect(mockedApi.getDocument).toHaveBeenCalledTimes(1))

      switchToWebsiteB(rerender)

      resolveGetDocumentA(documentItem({ revision: 9, content: 'Version serveur A tardive.' }))
      await Promise.resolve()
      await Promise.resolve()

      expect(screen.queryByText(/n'a pas été enregistrée/)).not.toBeInTheDocument()
      expect(screen.queryByText('Version serveur A tardive.')).not.toBeInTheDocument()
    })

    it('never calls onDocumentPersisted from a stale generation once the composer instance is replaced by a library selection, on the same site', async () => {
      // Unlike the site-switch tests above, StudioWorkspace itself stays
      // mounted here — only ContentComposer remounts (its own key). This is
      // the one scenario where ContentComposer's own mountedRef guard is the
      // sole thing preventing a stale callback, not an outer unmount.
      const docOther = documentItem({ id: 'doc-other', title: 'Autre document' })
      mockedApi.listDocumentsByWebsite.mockResolvedValue([docOther])
      let resolveGeneration: (value: DocumentItem) => void = () => {}
      mockedApi.generateStudioDocument.mockReturnValue(new Promise((resolve) => { resolveGeneration = resolve }))

      renderPage()
      await fillFreeObjective()
      fireEvent.click(screen.getByRole('button', { name: /Générer le brouillon/i }))
      await waitFor(() => expect(mockedApi.generateStudioDocument).toHaveBeenCalledTimes(1))
      const callsBeforeSelection = mockedApi.listDocumentsByWebsite.mock.calls.length

      fireEvent.click(screen.getByText('Autre document'))
      await waitFor(() => expect(screen.getByText('Vous modifiez :')).toBeInTheDocument())

      resolveGeneration(documentItem({ title: 'Doc perime' }))
      await Promise.resolve()
      await Promise.resolve()

      expect(screen.queryByText('Doc perime')).not.toBeInTheDocument()
      expect(mockedApi.listDocumentsByWebsite.mock.calls.length).toBe(callsBeforeSelection)
    })
  })

  describe('PageIA context resolution is invalidated the moment the site or query params change', () => {
    it('never lets a late-resolving site-A context reappear once site B is active, and shows only B\'s context once B resolves', async () => {
      let resolveOpportunityA: (value: Opportunity) => void = () => {}
      mockedApi.getOpportunity.mockImplementation((id: string) => {
        if (id === 'opp-a') return new Promise((resolve) => { resolveOpportunityA = resolve })
        return Promise.resolve(opportunity({ id: 'opp-b', title: 'Opportunité du site B' }))
      })

      const { navigate } = renderPageWithRouter('/ia?opportunityId=opp-a')
      await waitFor(() => expect(mockedApi.getOpportunity).toHaveBeenCalledWith('opp-a'))

      mockedUseWebsiteContext.mockReturnValue({
        websites: [website, websiteB],
        activeWebsiteId: 'w2',
        activeWebsite: websiteB,
        loadingWebsites: false,
        setActiveWebsiteId: vi.fn(),
        refreshWebsites: vi.fn().mockResolvedValue(undefined),
      } as ReturnType<typeof useWebsiteContext>)
      navigate('/ia?opportunityId=opp-b')
      await waitFor(() => expect(screen.getByText('Opportunité du site B')).toBeInTheDocument())

      // Site A's request resolves only now — well after B is active.
      resolveOpportunityA(opportunity({ id: 'opp-a', title: 'Opportunité du site A' }))
      await Promise.resolve()
      await Promise.resolve()

      expect(screen.queryByText('Opportunité du site A')).not.toBeInTheDocument()
      expect(screen.getByText('Opportunité du site B')).toBeInTheDocument()
    })

    it('never lets a late, out-of-order response for old query params reappear after new query params resolve, on the same site', async () => {
      let resolveOpportunityOld: (value: Opportunity) => void = () => {}
      mockedApi.getOpportunity.mockImplementation((id: string) => {
        if (id === 'opp-old') return new Promise((resolve) => { resolveOpportunityOld = resolve })
        return Promise.resolve(opportunity({ id: 'opp-new', title: 'Opportunité récente' }))
      })

      const { navigate } = renderPageWithRouter('/ia?opportunityId=opp-old')
      await waitFor(() => expect(mockedApi.getOpportunity).toHaveBeenCalledWith('opp-old'))

      // Same site — only the query param changes.
      navigate('/ia?opportunityId=opp-new')
      await waitFor(() => expect(screen.getByText('Opportunité récente')).toBeInTheDocument())

      // The stale request for the old param resolves out of order, after the new one already landed.
      resolveOpportunityOld(opportunity({ id: 'opp-old', title: 'Opportunité perimee' }))
      await Promise.resolve()
      await Promise.resolve()

      expect(screen.queryByText('Opportunité perimee')).not.toBeInTheDocument()
      expect(screen.getByText('Opportunité récente')).toBeInTheDocument()
    })
  })

  describe('the workspace remounts on the full context, not just the site', () => {
    it("clears the previous opportunity's document, content and brief when navigating from opportunity A to opportunity B on the same site", async () => {
      mockedApi.getOpportunity.mockImplementation((id: string) =>
        Promise.resolve(opportunity({ id, title: id === 'opp-a' ? 'Opportunité A' : 'Opportunité B' })),
      )
      mockedApi.generateStudioDocument.mockResolvedValue(documentItem({ content: 'Contenu pour A' }))

      const { navigate } = renderPageWithRouter('/ia?opportunityId=opp-a')
      await waitFor(() => expect(screen.getByText('Opportunité A')).toBeInTheDocument())

      fireEvent.click(screen.getByRole('button', { name: /Générer le brouillon/i }))
      await screen.findByDisplayValue('Contenu pour A')
      fireEvent.change(screen.getByLabelText('Audience'), { target: { value: 'Audience A' } })

      navigate('/ia?opportunityId=opp-b')
      await waitFor(() => expect(screen.getByText('Opportunité B')).toBeInTheDocument())

      // A's generated document/content and brief are gone — this is a fresh
      // ContentComposer instance for B, not the same one carrying A's state.
      expect(screen.queryByText('Contenu pour A')).not.toBeInTheDocument()
      expect(screen.getByText('Générez un brouillon pour commencer à éditer.')).toBeInTheDocument()
      expect((screen.getByLabelText('Audience') as HTMLInputElement).value).toBe('')
    })

    it("prevents a document generated for opportunity A from being saved once the display has moved to opportunity B", async () => {
      mockedApi.getOpportunity.mockImplementation((id: string) =>
        Promise.resolve(opportunity({ id, title: id === 'opp-a' ? 'Opportunité A' : 'Opportunité B' })),
      )
      mockedApi.generateStudioDocument.mockResolvedValue(documentItem({ content: 'Contenu pour A' }))

      const { navigate } = renderPageWithRouter('/ia?opportunityId=opp-a')
      await waitFor(() => expect(screen.getByText('Opportunité A')).toBeInTheDocument())

      fireEvent.click(screen.getByRole('button', { name: /Générer le brouillon/i }))
      const editor = await screen.findByDisplayValue('Contenu pour A')
      fireEvent.change(editor, { target: { value: 'Contenu modifie sous A' } })

      navigate('/ia?opportunityId=opp-b')
      await waitFor(() => expect(screen.getByText('Opportunité B')).toBeInTheDocument())

      // A's edited document is gone entirely — there is no Save button left
      // that could persist it under B's display.
      expect(screen.queryByDisplayValue('Contenu modifie sous A')).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Enregistrer' })).not.toBeInTheDocument()
      expect(mockedApi.updateDocument).not.toHaveBeenCalled()
    })

    it("clears the previous action's approval workflow when navigating from action A to action B on the same site", async () => {
      mockedApi.listActions.mockResolvedValue([
        actionItem({ id: 'action-a', title: 'Action A' }),
        actionItem({ id: 'action-b', title: 'Action B' }),
      ])
      mockedApi.generateStudioDocument.mockResolvedValue(documentItem({ actionItemId: 'action-a' }))

      const { navigate } = renderPageWithRouter('/ia?actionItemId=action-a')
      await waitFor(() => expect(screen.getByText('Action A')).toBeInTheDocument())

      await fillFreeObjective()
      fireEvent.click(screen.getByRole('button', { name: /Générer le brouillon/i }))
      await waitFor(() => expect(screen.getByText('Validation humaine')).toBeInTheDocument())

      navigate('/ia?actionItemId=action-b')
      await waitFor(() => expect(screen.getByText('Action B')).toBeInTheDocument())
      expect(screen.queryByText('Validation humaine')).not.toBeInTheDocument()
    })

    it("clears the previous establishment's GBP context when navigating from establishment A to establishment B on the same site", async () => {
      mockedApi.listGoogleBusinessProfileLocations.mockResolvedValue([
        businessLocation({ id: 'loc-a', title: 'Etablissement A' }),
        businessLocation({ id: 'loc-b', title: 'Etablissement B' }),
      ])

      const { navigate } = renderPageWithRouter('/ia?businessLocationId=loc-a')
      await waitFor(() => expect(screen.getByText('Etablissement A')).toBeInTheDocument())

      navigate('/ia?businessLocationId=loc-b')
      await waitFor(() => expect(screen.getByText('Etablissement B')).toBeInTheDocument())
      expect(screen.queryByText('Etablissement A')).not.toBeInTheDocument()
    })

    it('ignores a late-resolving opportunity-A context once opportunity B is already active on the same site', async () => {
      let resolveOpportunityA: (value: Opportunity) => void = () => {}
      mockedApi.getOpportunity.mockImplementation((id: string) => {
        if (id === 'opp-a') return new Promise((resolve) => { resolveOpportunityA = resolve })
        return Promise.resolve(opportunity({ id: 'opp-b', title: 'Opportunité B' }))
      })

      const { navigate } = renderPageWithRouter('/ia?opportunityId=opp-a')
      await waitFor(() => expect(mockedApi.getOpportunity).toHaveBeenCalledWith('opp-a'))

      navigate('/ia?opportunityId=opp-b')
      await waitFor(() => expect(screen.getByText('Opportunité B')).toBeInTheDocument())

      resolveOpportunityA(opportunity({ id: 'opp-a', title: 'Opportunité A perimee' }))
      await Promise.resolve()
      await Promise.resolve()

      expect(screen.queryByText('Opportunité A perimee')).not.toBeInTheDocument()
      expect(screen.getByText('Opportunité B')).toBeInTheDocument()
    })
  })

  describe('generation and save use independent sequences', () => {
    it('disables "Enregistrer" while a generation is in flight, and "Générer le brouillon" while a save is in flight', async () => {
      const docA = documentItem({ id: 'doc-a', title: 'Document existant', content: 'Contenu initial', opportunityId: 'opp-1' })
      mockedApi.listDocumentsByWebsite.mockResolvedValue([docA])
      mockedApi.generateStudioDocument.mockReturnValue(new Promise(() => {}))

      renderPage()
      fireEvent.click(await screen.findByText('Document existant'))
      const editor = await screen.findByDisplayValue('Contenu initial')
      fireEvent.change(editor, { target: { value: 'Contenu modifie' } })

      const generateButton = screen.getByRole('button', { name: /Générer le brouillon/i })
      const saveButton = screen.getByRole('button', { name: 'Enregistrer' })
      expect(generateButton).not.toBeDisabled()
      expect(saveButton).not.toBeDisabled()

      fireEvent.click(generateButton)
      expect(saveButton).toBeDisabled()
    })

    it('disables "Générer le brouillon" while a save is in flight', async () => {
      const docA = documentItem({ id: 'doc-a', title: 'Document existant', content: 'Contenu initial', opportunityId: 'opp-1' })
      mockedApi.listDocumentsByWebsite.mockResolvedValue([docA])
      mockedApi.updateDocument.mockReturnValue(new Promise(() => {}))

      renderPage()
      fireEvent.click(await screen.findByText('Document existant'))
      const editor = await screen.findByDisplayValue('Contenu initial')
      fireEvent.change(editor, { target: { value: 'Contenu modifie' } })

      const generateButton = screen.getByRole('button', { name: /Générer le brouillon/i })
      const saveButton = screen.getByRole('button', { name: 'Enregistrer' })
      expect(generateButton).not.toBeDisabled()

      fireEvent.click(saveButton)
      expect(generateButton).toBeDisabled()
    })

    it('never leaves generating or saving stuck when a generation and a save race concurrently (generation clicked first)', async () => {
      const docA = documentItem({ id: 'doc-a', title: 'Document existant', content: 'Contenu initial', opportunityId: 'opp-1' })
      mockedApi.listDocumentsByWebsite.mockResolvedValue([docA])
      let resolveGeneration: (value: DocumentItem) => void = () => {}
      let resolveSave: (value: DocumentItem) => void = () => {}
      mockedApi.generateStudioDocument.mockReturnValue(new Promise((resolve) => { resolveGeneration = resolve }))
      mockedApi.updateDocument.mockReturnValue(new Promise((resolve) => { resolveSave = resolve }))

      renderPage()
      fireEvent.click(await screen.findByText('Document existant'))
      const editor = await screen.findByDisplayValue('Contenu initial')
      fireEvent.change(editor, { target: { value: 'Contenu modifie' } })

      const generateButton = screen.getByRole('button', { name: /Générer le brouillon/i })
      const saveButton = screen.getByRole('button', { name: 'Enregistrer' })

      // Simulate the real race the UI's mutual disable is meant to prevent:
      // both clicks land before React commits either's `disabled` state —
      // proving the independent generationSeq/saveSeq refs (not the
      // disabled attribute alone) are what keeps this safe.
      act(() => {
        fireEvent.click(generateButton)
        fireEvent.click(saveButton)
      })

      expect(mockedApi.generateStudioDocument).toHaveBeenCalledTimes(1)
      expect(mockedApi.updateDocument).toHaveBeenCalledTimes(1)

      resolveGeneration(documentItem({ id: 'doc-a', content: 'Contenu regenere' }))
      await waitFor(() => expect(generateButton.querySelector('.animate-spin-slow')).toBeNull())

      resolveSave(documentItem({ id: 'doc-a', content: 'Contenu sauvegarde', revision: 2 }))
      await waitFor(() => expect(saveButton.querySelector('.animate-spin-slow')).toBeNull())

      // Generate's own disable was only ever the cross-guard (saving) — once
      // saving is done too, it is fully clear, never stuck.
      expect(generateButton).not.toBeDisabled()
    })

    it('never leaves generating or saving stuck when a generation and a save race concurrently (save clicked first)', async () => {
      const docA = documentItem({ id: 'doc-a', title: 'Document existant', content: 'Contenu initial', opportunityId: 'opp-1' })
      mockedApi.listDocumentsByWebsite.mockResolvedValue([docA])
      let resolveGeneration: (value: DocumentItem) => void = () => {}
      let resolveSave: (value: DocumentItem) => void = () => {}
      mockedApi.generateStudioDocument.mockReturnValue(new Promise((resolve) => { resolveGeneration = resolve }))
      mockedApi.updateDocument.mockReturnValue(new Promise((resolve) => { resolveSave = resolve }))

      renderPage()
      fireEvent.click(await screen.findByText('Document existant'))
      const editor = await screen.findByDisplayValue('Contenu initial')
      fireEvent.change(editor, { target: { value: 'Contenu modifie' } })

      const generateButton = screen.getByRole('button', { name: /Générer le brouillon/i })
      const saveButton = screen.getByRole('button', { name: 'Enregistrer' })

      act(() => {
        fireEvent.click(saveButton)
        fireEvent.click(generateButton)
      })

      expect(mockedApi.updateDocument).toHaveBeenCalledTimes(1)
      expect(mockedApi.generateStudioDocument).toHaveBeenCalledTimes(1)

      resolveSave(documentItem({ id: 'doc-a', content: 'Contenu sauvegarde', revision: 2 }))
      await waitFor(() => expect(saveButton.querySelector('.animate-spin-slow')).toBeNull())

      resolveGeneration(documentItem({ id: 'doc-a', content: 'Contenu regenere' }))
      await waitFor(() => expect(generateButton.querySelector('.animate-spin-slow')).toBeNull())

      // Save's own disable was only ever the cross-guard (generating) — once
      // generating is done too, its loading indicator is gone, never stuck.
      expect(saveButton.querySelector('.animate-spin-slow')).toBeNull()
    })

    it("a new generation invalidates only the previous generation, never an independent save", async () => {
      const docA = documentItem({ id: 'doc-a', title: 'Document existant', content: 'Contenu initial', opportunityId: 'opp-1' })
      mockedApi.listDocumentsByWebsite.mockResolvedValue([docA])
      let resolveGen1: (value: DocumentItem) => void = () => {}
      let resolveGen2: (value: DocumentItem) => void = () => {}
      mockedApi.generateStudioDocument
        .mockReturnValueOnce(new Promise((resolve) => { resolveGen1 = resolve }))
        .mockReturnValueOnce(new Promise((resolve) => { resolveGen2 = resolve }))

      renderPage()
      fireEvent.click(await screen.findByText('Document existant'))
      await screen.findByDisplayValue('Contenu initial')

      const generateButton = screen.getByRole('button', { name: /Générer le brouillon/i })

      // Two overlapping clicks bypassing the `generating` guard's stale
      // closure — the ref-based generationSeq, not the React state check, is
      // what must keep this safe.
      act(() => {
        fireEvent.click(generateButton)
        fireEvent.click(generateButton)
      })

      expect(mockedApi.generateStudioDocument).toHaveBeenCalledTimes(2)

      // Resolve the newer request first, then the stale one out of order.
      resolveGen2(documentItem({ id: 'doc-a', content: 'Contenu genere 2' }))
      await screen.findByDisplayValue('Contenu genere 2')

      resolveGen1(documentItem({ id: 'doc-a', content: 'Contenu genere 1 perime' }))
      await Promise.resolve()
      await Promise.resolve()

      expect(screen.queryByDisplayValue('Contenu genere 1 perime')).not.toBeInTheDocument()
      expect(screen.getByDisplayValue('Contenu genere 2')).toBeInTheDocument()
      expect(generateButton.querySelector('.animate-spin-slow')).toBeNull()

      // An unrelated save started afterward is unaffected by the generation
      // race — its own saveSeq was never touched by generationSeq.
      const editor = screen.getByDisplayValue('Contenu genere 2')
      fireEvent.change(editor, { target: { value: 'Contenu modifie apres la course' } })
      mockedApi.updateDocument.mockResolvedValue(documentItem({ id: 'doc-a', content: 'Contenu modifie apres la course', revision: 2 }))
      fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }))
      await waitFor(() => expect(mockedApi.updateDocument).toHaveBeenCalledTimes(1))
    })

    it("a new save invalidates only the previous save, never an independent generation", async () => {
      const docA = documentItem({ id: 'doc-a', title: 'Document existant', content: 'Contenu initial', opportunityId: 'opp-1' })
      mockedApi.listDocumentsByWebsite.mockResolvedValue([docA])
      let resolveSave1: (value: DocumentItem) => void = () => {}
      let resolveSave2: (value: DocumentItem) => void = () => {}
      mockedApi.updateDocument
        .mockReturnValueOnce(new Promise((resolve) => { resolveSave1 = resolve }))
        .mockReturnValueOnce(new Promise((resolve) => { resolveSave2 = resolve }))

      renderPage()
      fireEvent.click(await screen.findByText('Document existant'))
      const editor = await screen.findByDisplayValue('Contenu initial')
      fireEvent.change(editor, { target: { value: 'Contenu modifie' } })

      const saveButton = screen.getByRole('button', { name: 'Enregistrer' })

      act(() => {
        fireEvent.click(saveButton)
        fireEvent.click(saveButton)
      })

      expect(mockedApi.updateDocument).toHaveBeenCalledTimes(2)

      resolveSave2(documentItem({ id: 'doc-a', content: 'Contenu sauvegarde 2', revision: 3 }))
      await screen.findByDisplayValue('Contenu sauvegarde 2')

      resolveSave1(documentItem({ id: 'doc-a', content: 'Contenu sauvegarde 1 perime', revision: 2 }))
      await Promise.resolve()
      await Promise.resolve()

      expect(screen.queryByDisplayValue('Contenu sauvegarde 1 perime')).not.toBeInTheDocument()
      expect(screen.getByDisplayValue('Contenu sauvegarde 2')).toBeInTheDocument()
      expect(saveButton.querySelector('.animate-spin-slow')).toBeNull()

      // An unrelated generation afterward is unaffected by the save race —
      // its own generationSeq was never touched by saveSeq.
      mockedApi.generateStudioDocument.mockResolvedValue(documentItem({ id: 'doc-a', content: 'Contenu genere apres la course' }))
      fireEvent.click(screen.getByRole('button', { name: /Générer le brouillon/i }))
      await waitFor(() => expect(mockedApi.generateStudioDocument).toHaveBeenCalledTimes(1))
    })

    it('unmounting still blocks a late generation and a late save from acting on a dead instance, with the separated sequences', async () => {
      const docA = documentItem({ id: 'doc-a', title: 'Document existant', content: 'Contenu initial', opportunityId: 'opp-a' })
      mockedApi.listDocumentsByWebsite.mockResolvedValue([docA])
      mockedApi.getOpportunity.mockImplementation((id: string) =>
        Promise.resolve(opportunity({ id, title: id === 'opp-a' ? 'Opportunité A' : 'Opportunité B' })),
      )
      let resolveGeneration: (value: DocumentItem) => void = () => {}
      let resolveSave: (value: DocumentItem) => void = () => {}
      mockedApi.generateStudioDocument.mockReturnValue(new Promise((resolve) => { resolveGeneration = resolve }))
      mockedApi.updateDocument.mockReturnValue(new Promise((resolve) => { resolveSave = resolve }))

      const { navigate } = renderPageWithRouter('/ia?opportunityId=opp-a')
      await waitFor(() => expect(screen.getByText('Opportunité A')).toBeInTheDocument())
      fireEvent.click(await screen.findByText('Document existant'))
      const editor = await screen.findByDisplayValue('Contenu initial')
      fireEvent.change(editor, { target: { value: 'Contenu modifie' } })

      const generateButton = screen.getByRole('button', { name: /Générer le brouillon/i })
      const saveButton = screen.getByRole('button', { name: 'Enregistrer' })
      act(() => {
        fireEvent.click(generateButton)
        fireEvent.click(saveButton)
      })
      expect(mockedApi.generateStudioDocument).toHaveBeenCalledTimes(1)
      expect(mockedApi.updateDocument).toHaveBeenCalledTimes(1)

      navigate('/ia?opportunityId=opp-b')
      await waitFor(() => expect(screen.getByText('Opportunité B')).toBeInTheDocument())
      await waitFor(() => expect(mockedApi.listDocumentsByWebsite).toHaveBeenCalled())
      const callsAfterUnmount = mockedApi.listDocumentsByWebsite.mock.calls.length

      // Both stale promises resolve only now — well after the instance that
      // started them is gone.
      resolveGeneration(documentItem({ id: 'doc-a', content: 'Genere tardivement' }))
      resolveSave(documentItem({ id: 'doc-a', content: 'Sauvegarde tardivement' }))
      await Promise.resolve()
      await Promise.resolve()
      await Promise.resolve()

      // Neither late resolution touched anything: no extra library refresh
      // (onDocumentPersisted never fired), and none of A's content leaked
      // into B's fresh, document-less composer.
      expect(mockedApi.listDocumentsByWebsite.mock.calls.length).toBe(callsAfterUnmount)
      expect(screen.queryByDisplayValue('Genere tardivement')).not.toBeInTheDocument()
      expect(screen.queryByDisplayValue('Sauvegarde tardivement')).not.toBeInTheDocument()
      expect(screen.getByText('Générez un brouillon pour commencer à éditer.')).toBeInTheDocument()
    })
  })
})
