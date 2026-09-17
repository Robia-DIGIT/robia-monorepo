import { render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import PageOdcPrograms from './PageOdcPrograms'
import * as api from '../lib/api'
import type { OdcProgram } from '../lib/api'

vi.mock('../lib/api', async (importOriginal) => {
  const actual = await importOriginal<typeof api>()
  return {
    ...actual,
    listOdcPrograms: vi.fn(),
    openOdcProgram: vi.fn(),
    closeOdcProgram: vi.fn(),
  }
})

const mockedApi = vi.mocked(api)

function makeProgram(overrides: Partial<OdcProgram> = {}): OdcProgram {
  return {
    id: 'p1',
    organizationId: 'o1',
    slug: 'osc-2026',
    name: 'OSC 2026',
    description: 'Appel ODC',
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
    ...overrides,
  }
}

beforeEach(() => {
  vi.resetAllMocks()
})

describe('PageOdcPrograms', () => {
  it('lists programs with exhaustive status labels', async () => {
    mockedApi.listOdcPrograms.mockResolvedValue([makeProgram()])
    render(
      <MemoryRouter>
        <PageOdcPrograms />
      </MemoryRouter>,
    )
    await waitFor(() => expect(screen.getByText('OSC 2026')).toBeInTheDocument())
    expect(screen.getByText('Ouvert')).toBeInTheDocument()
  })

  it('shows empty state when there are no programs', async () => {
    mockedApi.listOdcPrograms.mockResolvedValue([])
    render(
      <MemoryRouter>
        <PageOdcPrograms />
      </MemoryRouter>,
    )
    await waitFor(() => expect(screen.getByText('Aucun programme')).toBeInTheDocument())
  })
})
