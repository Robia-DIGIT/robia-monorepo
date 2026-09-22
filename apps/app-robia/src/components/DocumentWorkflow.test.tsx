import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach } from 'vitest'

import DocumentWorkflow from './DocumentWorkflow'
import * as api from '../lib/api'
import { ApiError, type DocumentItem, type Opportunity } from '../lib/api'

vi.mock('../lib/api', async (importOriginal) => {
  const actual = await importOriginal<typeof api>()
  return {
    ...actual,
    generateDocument: vi.fn(),
    listDocuments: vi.fn(),
    updateDocument: vi.fn(),
    getDocument: vi.fn(),
    createValidation: vi.fn(),
  }
})

const mockedApi = vi.mocked(api)

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

function documentItem(overrides: Partial<DocumentItem> = {}): DocumentItem {
  return {
    id: 'doc-1',
    opportunityId: 'opp-1',
    type: 'local_page',
    title: 'Brouillon historique',
    content: 'Contenu existant.',
    status: 'draft',
    revision: 1,
    ...overrides,
  }
}

beforeEach(() => {
  vi.resetAllMocks()
  mockedApi.listDocuments.mockResolvedValue([documentItem()])
})

function renderWorkflow(opportunities: Opportunity[] = [opportunity()]) {
  return render(<DocumentWorkflow opportunities={opportunities} onValidationCreated={vi.fn()} />)
}

describe('DocumentWorkflow — migrated to revision-based saves', () => {
  it('sends expectedRevision on every save from the legacy screen', async () => {
    mockedApi.updateDocument.mockResolvedValue(documentItem({ revision: 2, content: 'Modifie.' }))

    renderWorkflow()
    const editor = await screen.findByDisplayValue('Contenu existant.')
    fireEvent.change(editor, { target: { value: 'Modifie.' } })
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }))

    await waitFor(() => expect(mockedApi.updateDocument).toHaveBeenCalledWith('doc-1', {
      content: 'Modifie.',
      expectedRevision: 1,
    }))
  })

  it('reflects the new revision returned by a successful save', async () => {
    mockedApi.updateDocument.mockResolvedValue(documentItem({ revision: 2, content: 'Modifie.' }))

    renderWorkflow()
    const editor = await screen.findByDisplayValue('Contenu existant.')
    fireEvent.change(editor, { target: { value: 'Modifie.' } })
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }))

    await waitFor(() => expect(screen.getByText(/Révision 2/)).toBeInTheDocument())
  })

  it('never validates the document on a 409 conflict', async () => {
    mockedApi.updateDocument.mockRejectedValue(new ApiError('Conflit.', 409))
    mockedApi.getDocument.mockResolvedValue(documentItem({ revision: 5, content: 'Version serveur.' }))

    renderWorkflow()
    const editor = await screen.findByDisplayValue('Contenu existant.')
    fireEvent.change(editor, { target: { value: 'Modifie en conflit.' } })
    fireEvent.click(screen.getByRole('button', { name: 'Approuver' }))

    await waitFor(() => expect(screen.getByText(/n'a pas été enregistrée/)).toBeInTheDocument())
    expect(mockedApi.createValidation).not.toHaveBeenCalled()
  })

  it('preserves the local text for copy when a conflict occurs', async () => {
    mockedApi.updateDocument.mockRejectedValue(new ApiError('Conflit.', 409))
    mockedApi.getDocument.mockResolvedValue(documentItem({ revision: 5, content: 'Version serveur.' }))

    renderWorkflow()
    const editor = await screen.findByDisplayValue('Contenu existant.')
    fireEvent.change(editor, { target: { value: 'Mon texte local perdu sinon.' } })
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }))

    await waitFor(() => expect(screen.getAllByDisplayValue('Mon texte local perdu sinon.').length).toBeGreaterThan(0))
  })

  it('reloading after a conflict fetches the real server version', async () => {
    mockedApi.updateDocument.mockRejectedValue(new ApiError('Conflit.', 409))
    mockedApi.getDocument.mockResolvedValue(documentItem({ revision: 5, content: 'Version serveur.' }))

    renderWorkflow()
    const editor = await screen.findByDisplayValue('Contenu existant.')
    fireEvent.change(editor, { target: { value: 'Modifie en conflit.' } })
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }))
    await screen.findByRole('button', { name: 'Recharger la dernière version' })

    fireEvent.click(screen.getByRole('button', { name: 'Recharger la dernière version' }))

    await waitFor(() => expect(screen.getByDisplayValue('Version serveur.')).toBeInTheDocument())
    expect(screen.getByText(/Révision 5/)).toBeInTheDocument()
  })
})
