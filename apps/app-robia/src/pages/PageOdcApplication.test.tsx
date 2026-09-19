import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import PageOdcApplication from './PageOdcApplication'
import * as api from '../lib/api'
import type { OdcApplication, OdcDocumentType } from '../lib/api'

vi.mock('../lib/api', async (importOriginal) => {
  const actual = await importOriginal<typeof api>()
  return {
    ...actual,
    getOdcApplication: vi.fn(),
    decideOdcApplication: vi.fn(),
    uploadOdcDocument: vi.fn(),
    downloadOdcDocumentFile: vi.fn(),
    downloadBlob: vi.fn(),
  }
})

const mockedApi = vi.mocked(api)

function app(overrides: Partial<OdcApplication> = {}): OdcApplication {
  return {
    id: 'a1',
    organizationId: 'o1',
    programId: 'p1',
    applicantId: 'c1',
    status: 'in_review',
    answers: { motivation: 'Je veux grandir' },
    proposedTotal: 12,
    finalTotal: null,
    summaryDraft: 'Résumé déterministe',
    missing: null,
    submittedAt: '2026-09-17T00:00:00Z',
    decidedAt: null,
    decidedById: null,
    decisionReason: null,
    createdAt: '2026-09-17T00:00:00Z',
    updatedAt: '2026-09-17T00:00:00Z',
    applicant: {
      id: 'c1',
      organizationId: 'o1',
      displayName: 'Karim',
      email: null,
      phone: null,
      userId: null,
      createdAt: '2026-09-17T00:00:00Z',
    },
    program: {
      id: 'p1',
      organizationId: 'o1',
      slug: 'osc',
      name: 'OSC',
      description: null,
      status: 'open',
      opensAt: null,
      closesAt: null,
      requireDualReview: false,
      decisionThreshold: null,
      createdById: 'u1',
      createdAt: '2026-09-17T00:00:00Z',
      updatedAt: '2026-09-17T00:00:00Z',
      fields: [
        {
          id: 'f1',
          key: 'motivation',
          label: 'Motivation',
          required: true,
          fieldType: 'longtext',
          options: null,
          sortOrder: 0,
        },
      ],
      criteria: [],
      docTypes: [],
    },
    events: [],
    documents: [],
    scoreLines: [],
    ...overrides,
  }
}

beforeEach(() => {
  vi.resetAllMocks()
})

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/odc/candidatures/a1']}>
      <Routes>
        <Route path="/odc/candidatures/:id" element={<PageOdcApplication />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('PageOdcApplication', () => {
  it('shows the human-decision banner and does not invent a frozen 0 score', async () => {
    mockedApi.getOdcApplication.mockResolvedValue(app())
    renderPage()
    await waitFor(() => expect(screen.getByText('Karim')).toBeInTheDocument())
    expect(screen.getByTestId('odc-human-decision-banner')).toBeInTheDocument()
    expect(screen.getByText(/Figé : Non figé/)).toBeInTheDocument()
    expect(screen.getByText('Je veux grandir')).toBeInTheDocument()
  })

  it('requires a reason before confirm in the decide modal', async () => {
    mockedApi.getOdcApplication.mockResolvedValue(app())
    renderPage()
    await waitFor(() => expect(screen.getByText('Accepter')).toBeInTheDocument())
    fireEvent.click(screen.getByText('Accepter'))
    expect(screen.getByTestId('odc-decide-modal')).toBeInTheDocument()
    expect(screen.getByText('Confirmer')).toBeDisabled()
    expect(mockedApi.decideOdcApplication).not.toHaveBeenCalled()
  })

  it('hides decide actions on a terminal application', async () => {
    mockedApi.getOdcApplication.mockResolvedValue(app({ status: 'accepted' }))
    renderPage()
    await waitFor(() => expect(screen.getByText('Acceptée')).toBeInTheDocument())
    expect(screen.queryByText('Accepter')).not.toBeInTheDocument()
  })

  // ---------------------------------------------------------------------
  // RC-33b — real upload / download
  // ---------------------------------------------------------------------

  const cvDocType: OdcDocumentType = {
    id: 'dt-cv',
    key: 'cv',
    label: 'CV',
    required: true,
    mimeAllow: ['application/pdf'],
  }

  function appWithCvDocType(overrides: Partial<OdcApplication> = {}) {
    const base = app(overrides)
    return {
      ...base,
      program: base.program ? { ...base.program, docTypes: [cvDocType] } : base.program,
    }
  }

  function pdfFile(name = 'cv.pdf') {
    return new File(['%PDF-1.4'], name, { type: 'application/pdf' })
  }

  it('shows an upload input and a disabled Envoyer button until a file is chosen', async () => {
    mockedApi.getOdcApplication.mockResolvedValue(appWithCvDocType())
    renderPage()
    await waitFor(() => expect(screen.getByTestId('odc-upload-input-cv')).toBeInTheDocument())
    expect(screen.getByText('Envoyer')).toBeDisabled()

    fireEvent.change(screen.getByTestId('odc-upload-input-cv'), {
      target: { files: [pdfFile()] },
    })
    expect(screen.getByText('Envoyer')).not.toBeDisabled()
  })

  it('uploads the chosen file for the right document type and refreshes the application', async () => {
    mockedApi.getOdcApplication.mockResolvedValue(appWithCvDocType())
    const updated = appWithCvDocType({
      documents: [
        {
          id: 'doc-1',
          organizationId: 'o1',
          applicationId: 'a1',
          documentTypeId: 'dt-cv',
          originalName: 'cv.pdf',
          mimeType: 'application/pdf',
          sizeBytes: 10,
          storageKey: 'o1/a1/doc-1/uuid.pdf',
          status: 'received',
          createdAt: '2026-09-17T00:00:00Z',
        },
      ],
    })
    mockedApi.uploadOdcDocument.mockResolvedValue(updated)
    renderPage()

    await waitFor(() => expect(screen.getByTestId('odc-upload-input-cv')).toBeInTheDocument())
    fireEvent.change(screen.getByTestId('odc-upload-input-cv'), {
      target: { files: [pdfFile()] },
    })
    fireEvent.click(screen.getByText('Envoyer'))

    await waitFor(() =>
      expect(mockedApi.uploadOdcDocument).toHaveBeenCalledWith(
        'a1',
        'dt-cv',
        expect.any(File),
      ),
    )
    await waitFor(() => expect(screen.getByText('Reçue')).toBeInTheDocument())
  })

  it('shows the backend error message when an upload is rejected (MIME/size/status)', async () => {
    mockedApi.getOdcApplication.mockResolvedValue(appWithCvDocType())
    mockedApi.uploadOdcDocument.mockRejectedValue(
      new Error('MIME type "application/zip" is not allowed for document type "cv".'),
    )
    renderPage()

    await waitFor(() => expect(screen.getByTestId('odc-upload-input-cv')).toBeInTheDocument())
    fireEvent.change(screen.getByTestId('odc-upload-input-cv'), {
      target: { files: [pdfFile()] },
    })
    fireEvent.click(screen.getByText('Envoyer'))

    await waitFor(() =>
      expect(
        screen.getByText('MIME type "application/zip" is not allowed for document type "cv".'),
      ).toBeInTheDocument(),
    )
  })

  it('does not show a Télécharger button while the document is only pending_upload', async () => {
    mockedApi.getOdcApplication.mockResolvedValue(
      appWithCvDocType({
        documents: [
          {
            id: 'doc-1',
            organizationId: 'o1',
            applicationId: 'a1',
            documentTypeId: 'dt-cv',
            originalName: 'cv.pdf',
            mimeType: 'application/pdf',
            sizeBytes: 10,
            storageKey: null,
            status: 'pending_upload',
            createdAt: '2026-09-17T00:00:00Z',
          },
        ],
      }),
    )
    renderPage()
    await waitFor(() => expect(screen.getByText('En attente')).toBeInTheDocument())
    expect(screen.queryByText('Télécharger')).not.toBeInTheDocument()
  })

  it('downloads a received document as a blob named after its originalName', async () => {
    const receivedDoc = {
      id: 'doc-1',
      organizationId: 'o1',
      applicationId: 'a1',
      documentTypeId: 'dt-cv',
      originalName: 'cv-final.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 10,
      storageKey: 'o1/a1/doc-1/uuid.pdf',
      status: 'received' as const,
      createdAt: '2026-09-17T00:00:00Z',
    }
    mockedApi.getOdcApplication.mockResolvedValue(
      appWithCvDocType({ documents: [receivedDoc] }),
    )
    const blob = new Blob(['%PDF-1.4'])
    mockedApi.downloadOdcDocumentFile.mockResolvedValue(blob)
    renderPage()

    await waitFor(() => expect(screen.getByText('Télécharger')).toBeInTheDocument())
    fireEvent.click(screen.getByText('Télécharger'))

    await waitFor(() => expect(mockedApi.downloadOdcDocumentFile).toHaveBeenCalledWith('doc-1'))
    await waitFor(() => expect(mockedApi.downloadBlob).toHaveBeenCalledWith(blob, 'cv-final.pdf'))
  })

  it('shows an honest empty state (never a crash) when the file is 404 — e.g. the RC-32 demo seed', async () => {
    const receivedDoc = {
      id: 'doc-1',
      organizationId: 'o1',
      applicationId: 'a1',
      documentTypeId: 'dt-cv',
      originalName: 'cv-demo.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 10,
      storageKey: 'demo/seed/odc/cv-demo.pdf',
      status: 'received' as const,
      createdAt: '2026-09-17T00:00:00Z',
    }
    mockedApi.getOdcApplication.mockResolvedValue(
      appWithCvDocType({ documents: [receivedDoc] }),
    )
    mockedApi.downloadOdcDocumentFile.mockResolvedValue(null)
    renderPage()

    await waitFor(() => expect(screen.getByText('Télécharger')).toBeInTheDocument())
    fireEvent.click(screen.getByText('Télécharger'))

    await waitFor(() =>
      expect(
        screen.getByText(/Fichier non disponible — probablement une candidature de démonstration/),
      ).toBeInTheDocument(),
    )
    expect(mockedApi.downloadBlob).not.toHaveBeenCalled()
  })

  it('never renders a document storageKey anywhere on the page', async () => {
    const receivedDoc = {
      id: 'doc-1',
      organizationId: 'o1',
      applicationId: 'a1',
      documentTypeId: 'dt-cv',
      originalName: 'cv.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 10,
      storageKey: 'super-secret-storage-key-marker',
      status: 'received' as const,
      createdAt: '2026-09-17T00:00:00Z',
    }
    mockedApi.getOdcApplication.mockResolvedValue(
      appWithCvDocType({ documents: [receivedDoc] }),
    )
    renderPage()
    await waitFor(() => expect(screen.getByText('Télécharger')).toBeInTheDocument())
    expect(screen.queryByText(/super-secret-storage-key-marker/)).not.toBeInTheDocument()
  })
})
