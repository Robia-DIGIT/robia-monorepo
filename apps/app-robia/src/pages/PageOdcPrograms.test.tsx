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
    listAutomations: vi.fn(),
    createAutomation: vi.fn(),
    setAutomationEnabled: vi.fn(),
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
  mockedApi.listAutomations.mockResolvedValue([])
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
    expect(screen.getByTestId('odc-ops-roles')).toBeInTheDocument()
    expect(screen.getByTestId('odc-repetitive-tasks')).toBeInTheDocument()
    expect(screen.getByText('Candidature')).toBeInTheDocument()
  })

  it('reopens a closed program', async () => {
    const closed = makeProgram({
      slug: 'odc-appel-2026',
      name: 'Orange Digital Center — Appel à candidatures 2026',
      status: 'closed',
    })
    mockedApi.listOdcPrograms.mockResolvedValue([closed])
    mockedApi.openOdcProgram.mockResolvedValue({ ...closed, status: 'open' })

    render(
      <MemoryRouter>
        <PageOdcPrograms />
      </MemoryRouter>,
    )
    await waitFor(() => expect(screen.getByTestId('odc-reopen-program')).toBeInTheDocument())
    fireEvent.click(screen.getByTestId('odc-reopen-program'))
    await waitFor(() => {
      expect(mockedApi.openOdcProgram).toHaveBeenCalledWith('p1')
      expect(screen.getByText('Ouvert')).toBeInTheDocument()
    })
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

  it('installs an ODC repetitive task template', async () => {
    mockedApi.listOdcPrograms.mockResolvedValue([makeProgram()])
    mockedApi.createAutomation.mockResolvedValue({
      id: 'auto-1',
      organizationId: 'o1',
      scope: 'PROGRAM',
      name: 'ODC — résumé à la soumission',
      description: null,
      enabled: true,
      conditions: null,
      steps: [{ actionType: 'robia.odc.prepare_application_summary' }],
      requiresApproval: true,
      createdById: 'u1',
      lastRunAt: null,
      nextRunAt: null,
      metadata: null,
      createdAt: '2026-09-17T00:00:00Z',
      updatedAt: '2026-09-17T00:00:00Z',
      trigger: {
        id: 't1',
        automationId: 'auto-1',
        type: 'event',
        cronExpression: null,
        timezone: null,
        eventType: 'odc.application.submitted',
        config: null,
        createdAt: '2026-09-17T00:00:00Z',
        updatedAt: '2026-09-17T00:00:00Z',
      },
    })

    render(
      <MemoryRouter>
        <PageOdcPrograms />
      </MemoryRouter>,
    )
    await waitFor(() =>
      expect(screen.getByTestId('odc-install-task-odc-summary-on-submit')).toBeInTheDocument(),
    )
    fireEvent.click(screen.getByTestId('odc-install-task-odc-summary-on-submit'))
    await waitFor(() => {
      expect(mockedApi.createAutomation).toHaveBeenCalledWith(
        expect.objectContaining({
          scope: 'PROGRAM',
          requiresApproval: true,
        }),
      )
    })
  })

  it('shows formation empty state on vue=formation', async () => {
    mockedApi.listOdcPrograms.mockResolvedValue([makeProgram()])
    render(
      <MemoryRouter initialEntries={['/odc/programmes?vue=formation']}>
        <PageOdcPrograms />
      </MemoryRouter>,
    )
    await waitFor(() => expect(screen.getByText('Aucune cohorte')).toBeInTheDocument())
    expect(screen.getByTestId('odc-create-default-program-empty')).toBeInTheDocument()
    expect(screen.getByText('Tâches répétitives formation')).toBeInTheDocument()
  })
})
