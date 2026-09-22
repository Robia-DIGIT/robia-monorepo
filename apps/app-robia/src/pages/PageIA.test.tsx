import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'

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
    saveDocumentRevision: vi.fn(),
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
    fireEvent.click(await screen.findByRole('button', { name: /Générer le brouillon/i }))
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
    fireEvent.click(await screen.findByRole('button', { name: /Générer le brouillon/i }))

    await waitFor(() => expect(screen.getByText('Le moteur de génération est indisponible.')).toBeInTheDocument())
  })

  it('never fires a second generation on a double-click', async () => {
    let resolveGeneration: (value: DocumentItem) => void = () => {}
    mockedApi.generateStudioDocument.mockReturnValue(
      new Promise((resolve) => { resolveGeneration = resolve }),
    )

    renderPage()
    const button = await screen.findByRole('button', { name: /Générer le brouillon/i })
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
    mockedApi.saveDocumentRevision.mockResolvedValue(documentItem({ revision: 2, content: 'Contenu modifie.' }))

    renderPage()
    fireEvent.click(await screen.findByRole('button', { name: /Générer le brouillon/i }))
    const editor = await screen.findByDisplayValue(/Contenu genere/)
    fireEvent.change(editor, { target: { value: 'Contenu modifie.' } })
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }))

    await waitFor(() => expect(mockedApi.saveDocumentRevision).toHaveBeenCalledWith('doc-1', {
      content: 'Contenu modifie.',
      expectedRevision: 1,
    }))
    expect(await screen.findByText(/Révision 2/)).toBeInTheDocument()
  })

  it('on a 409 conflict, never overwrites and offers to reload the latest version', async () => {
    mockedApi.generateStudioDocument.mockResolvedValue(documentItem({ revision: 1 }))
    mockedApi.saveDocumentRevision.mockRejectedValue(new ApiError('Conflit de version.', 409))
    mockedApi.getDocument.mockResolvedValue(documentItem({ revision: 3, content: 'Version serveur plus recente.' }))

    renderPage()
    fireEvent.click(await screen.findByRole('button', { name: /Générer le brouillon/i }))
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
    fireEvent.click(screen.getByRole('button', { name: /Générer le brouillon/i }))

    await waitFor(() => expect(screen.getByText('Validation humaine')).toBeInTheDocument())
  })

  it('shows no ActionApprovalWorkflow and no fake second approval when no Action is associated', async () => {
    mockedApi.generateStudioDocument.mockResolvedValue(documentItem())

    renderPage()
    fireEvent.click(await screen.findByRole('button', { name: /Générer le brouillon/i }))

    await waitFor(() => expect(screen.getByText(/n'est pas encore relié à une Action/)).toBeInTheDocument())
    expect(screen.queryByText('Validation humaine')).not.toBeInTheDocument()
  })

  it('renders an indicative Google preview, clearly labelled as such', async () => {
    mockedApi.generateStudioDocument.mockResolvedValue(documentItem({ type: 'gbp_post' }))

    renderPage()
    fireEvent.click(await screen.findByRole('button', { name: /Générer le brouillon/i }))

    await waitFor(() => expect(screen.getAllByText('Aperçu indicatif').length).toBeGreaterThan(0))
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
    fireEvent.click(await screen.findByRole('button', { name: /Générer le brouillon/i }))

    await waitFor(() => expect(screen.getAllByText(/Bonjour/).length).toBeGreaterThan(0))
    expect(document.querySelector('script')).toBeNull()
    expect((window as unknown as { __xss?: boolean }).__xss).toBeUndefined()
  })

  it('exposes mobile Brief/Contenu/Aperçu tabs and switches between them', async () => {
    mockedApi.generateStudioDocument.mockResolvedValue(documentItem())

    renderPage()
    fireEvent.click(await screen.findByRole('button', { name: /Générer le brouillon/i }))
    await waitFor(() => expect(screen.getAllByText('Brouillon généré').length).toBeGreaterThan(0))

    const previewTab = screen.getByRole('button', { name: 'Aperçu' })
    fireEvent.click(previewTab)
    expect(previewTab.className).toContain('bg-navy')
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
})
