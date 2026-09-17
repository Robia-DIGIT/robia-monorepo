import { render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import PageOdcProgramKanban from './PageOdcProgramKanban'
import * as api from '../lib/api'
import type { OdcApplication, OdcProgram } from '../lib/api'

vi.mock('../lib/api', async (importOriginal) => {
  const actual = await importOriginal<typeof api>()
  return {
    ...actual,
    getOdcProgram: vi.fn(),
    listOdcApplications: vi.fn(),
    listOdcOutreach: vi.fn(),
    queueOdcOutreach: vi.fn(),
    sendOdcOutreach: vi.fn(),
    skipOdcOutreach: vi.fn(),
  }
})

const mockedApi = vi.mocked(api)

const program: OdcProgram = {
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
  fields: [],
  criteria: [],
  docTypes: [],
}

function app(overrides: Partial<OdcApplication> = {}): OdcApplication {
  return {
    id: 'a1',
    organizationId: 'o1',
    programId: 'p1',
    applicantId: 'c1',
    status: 'in_review',
    answers: {},
    proposedTotal: null,
    finalTotal: null,
    summaryDraft: null,
    missing: null,
    submittedAt: null,
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
    ...overrides,
  }
}

beforeEach(() => {
  vi.resetAllMocks()
})

describe('PageOdcProgramKanban', () => {
  it('renders every status column and never shows a 0 score for an unfrozen total', async () => {
    mockedApi.getOdcProgram.mockResolvedValue(program)
    mockedApi.listOdcApplications.mockResolvedValue([app()])
    mockedApi.listOdcOutreach.mockResolvedValue([])
    render(
      <MemoryRouter initialEntries={['/odc/programmes/p1']}>
        <Routes>
          <Route path="/odc/programmes/:id" element={<PageOdcProgramKanban />} />
        </Routes>
      </MemoryRouter>,
    )
    await waitFor(() => expect(screen.getByText('Karim')).toBeInTheDocument())
    expect(screen.getByTestId('odc-column-draft')).toBeInTheDocument()
    expect(screen.getByTestId('odc-column-withdrawn')).toBeInTheDocument()
    expect(screen.getByText(/Score : Non figé/)).toBeInTheDocument()
    expect(screen.queryByText(/Score : 0/)).not.toBeInTheDocument()
    expect(screen.getByTestId('odc-cv-ranking')).toBeInTheDocument()
  })
})
