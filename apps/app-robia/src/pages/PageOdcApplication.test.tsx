import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import PageOdcApplication from './PageOdcApplication'
import * as api from '../lib/api'
import type { OdcApplication } from '../lib/api'

vi.mock('../lib/api', async (importOriginal) => {
  const actual = await importOriginal<typeof api>()
  return {
    ...actual,
    getOdcApplication: vi.fn(),
    decideOdcApplication: vi.fn(),
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
})
