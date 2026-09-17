import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import PageOdcPrograms from './PageOdcPrograms'
import * as api from '../lib/api'
import type { OdcProgram } from '../lib/api'
import { ODC_DEFAULT_PROGRAM_SLUG } from '../lib/odc-default-program'

vi.mock('../lib/api', async (importOriginal) => {
  const actual = await importOriginal<typeof api>()
  return {
    ...actual,
    listOdcPrograms: vi.fn(),
    openOdcProgram: vi.fn(),
    closeOdcProgram: vi.fn(),
    createOdcProgram: vi.fn(),
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
    expect(screen.getByTestId('odc-create-default-program')).toBeInTheDocument()
  })

  it('shows empty state when there are no programs', async () => {
    mockedApi.listOdcPrograms.mockResolvedValue([])
    render(
      <MemoryRouter>
        <PageOdcPrograms />
      </MemoryRouter>,
    )
    await waitFor(() => expect(screen.getByText('Aucun programme')).toBeInTheDocument())
    expect(screen.getByTestId('odc-create-default-program-empty')).toBeInTheDocument()
  })

  it('creates and opens the default ODC program', async () => {
    const draft = makeProgram({
      id: 'p-new',
      slug: ODC_DEFAULT_PROGRAM_SLUG,
      name: 'Orange Digital Center — Appel à candidatures 2026',
      status: 'draft',
    })
    const opened = { ...draft, status: 'open' as const }
    mockedApi.listOdcPrograms.mockResolvedValue([])
    mockedApi.createOdcProgram.mockResolvedValue(draft)
    mockedApi.openOdcProgram.mockResolvedValue(opened)

    render(
      <MemoryRouter>
        <PageOdcPrograms />
      </MemoryRouter>,
    )
    await waitFor(() =>
      expect(screen.getByTestId('odc-create-default-program-empty')).toBeInTheDocument(),
    )
    fireEvent.click(screen.getByTestId('odc-create-default-program-empty'))

    await waitFor(() => {
      expect(mockedApi.createOdcProgram).toHaveBeenCalledTimes(1)
      expect(mockedApi.openOdcProgram).toHaveBeenCalledWith('p-new')
      expect(
        screen.getByText('Orange Digital Center — Appel à candidatures 2026'),
      ).toBeInTheDocument()
      expect(screen.getByText('Ouvert')).toBeInTheDocument()
    })
  })
})
