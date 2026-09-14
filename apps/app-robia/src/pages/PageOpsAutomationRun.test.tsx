import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import PageOpsAutomationRun from './PageOpsAutomationRun'
import * as api from '../lib/api'
import type { AutomationRun } from '../lib/api'

vi.mock('../lib/api', async (importOriginal) => {
  const actual = await importOriginal<typeof api>()
  return {
    ...actual,
    getAutomationRun: vi.fn(),
    approveAutomationRun: vi.fn(),
    rejectAutomationRun: vi.fn(),
  }
})

const mockedApi = vi.mocked(api)
const now = '2026-09-14T12:00:00Z'

function baseRun(overrides: Partial<AutomationRun> = {}): AutomationRun {
  return {
    id: 'run-1',
    organizationId: 'org-1',
    automationId: 'auto-1',
    status: 'succeeded',
    triggerType: 'manual',
    sourceEventId: null,
    dedupKey: 'manual:x',
    triggeredById: 'user-1',
    requiresApproval: false,
    approvalStatus: null,
    approvedById: null,
    approvalReason: null,
    approvedAt: null,
    startedAt: now,
    finishedAt: now,
    errorMessage: null,
    context: null,
    createdAt: now,
    steps: [],
    ...overrides,
  }
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/ops/automations/runs/run-1']}>
      <Routes>
        <Route path="/ops/automations/runs/:runId" element={<PageOpsAutomationRun />} />
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  vi.resetAllMocks()
})

describe('PageOpsAutomationRun', () => {
  it('shows the step timeline with evidence for a succeeded run', async () => {
    mockedApi.getAutomationRun.mockResolvedValue(
      baseRun({
        steps: [
          {
            id: 'step-1',
            runId: 'run-1',
            sequence: 1,
            actionType: 'robia.opportunities.regenerate',
            input: { auditId: 'audit-1' },
            status: 'succeeded',
            evidence: { opportunityCount: 2 },
            error: null,
            startedAt: now,
            finishedAt: now,
            createdAt: now,
          },
        ],
      }),
    )

    renderPage()

    await waitFor(() =>
      expect(screen.getByText(/robia.opportunities.regenerate/)).toBeInTheDocument(),
    )
    expect(screen.getAllByText('Succès').length).toBeGreaterThanOrEqual(2)
    expect(screen.getByText(/opportunityCount/)).toBeInTheDocument()
  })

  it('shows the failed step error message', async () => {
    mockedApi.getAutomationRun.mockResolvedValue(
      baseRun({
        status: 'failed',
        errorMessage: 'Something failed',
        steps: [
          {
            id: 'step-1',
            runId: 'run-1',
            sequence: 1,
            actionType: 'robia.action_items.create_internal_task',
            input: null,
            status: 'failed',
            evidence: null,
            error: 'Something failed',
            startedAt: now,
            finishedAt: now,
            createdAt: now,
          },
        ],
      }),
    )

    renderPage()

    await waitFor(() => expect(screen.getAllByText('Échec').length).toBeGreaterThanOrEqual(2))
    expect(screen.getByText('Something failed')).toBeInTheDocument()
  })

  it('shows approve/reject actions for a run waiting for approval, and never before', async () => {
    mockedApi.getAutomationRun.mockResolvedValue(
      baseRun({ status: 'waiting_approval', requiresApproval: true, approvalStatus: 'pending' }),
    )

    renderPage()

    await waitFor(() =>
      expect(screen.getByRole('heading', { name: 'Validation requise' })).toBeInTheDocument(),
    )
    expect(screen.getByRole('button', { name: /Approuver et exécuter/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Rejeter/ })).toBeInTheDocument()
  })

  it('never shows approve/reject actions for an already-succeeded run', async () => {
    mockedApi.getAutomationRun.mockResolvedValue(baseRun({ status: 'succeeded' }))

    renderPage()

    await waitFor(() => expect(screen.getByText('Succès')).toBeInTheDocument())
    expect(screen.queryByRole('button', { name: /Approuver/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Rejeter/ })).not.toBeInTheDocument()
  })

  it('calls approveAutomationRun when clicking approve', async () => {
    mockedApi.getAutomationRun.mockResolvedValue(
      baseRun({ status: 'waiting_approval', requiresApproval: true, approvalStatus: 'pending' }),
    )
    mockedApi.approveAutomationRun.mockResolvedValue(baseRun({ status: 'succeeded' }))

    renderPage()

    const approveButton = await screen.findByRole('button', { name: /Approuver et exécuter/ })
    fireEvent.click(approveButton)

    await waitFor(() =>
      expect(mockedApi.approveAutomationRun).toHaveBeenCalledWith('run-1', undefined),
    )
  })

  it('calls rejectAutomationRun when clicking reject, and never calls approve', async () => {
    mockedApi.getAutomationRun.mockResolvedValue(
      baseRun({ status: 'waiting_approval', requiresApproval: true, approvalStatus: 'pending' }),
    )
    mockedApi.rejectAutomationRun.mockResolvedValue(baseRun({ status: 'cancelled' }))

    renderPage()

    const rejectButton = await screen.findByRole('button', { name: /Rejeter/ })
    fireEvent.click(rejectButton)

    await waitFor(() =>
      expect(mockedApi.rejectAutomationRun).toHaveBeenCalledWith('run-1', undefined),
    )
    expect(mockedApi.approveAutomationRun).not.toHaveBeenCalled()
  })

  it('shows a cancelled banner and no steps for a rejected run', async () => {
    mockedApi.getAutomationRun.mockResolvedValue(
      baseRun({ status: 'cancelled', approvalReason: 'Pas maintenant', steps: [] }),
    )

    renderPage()

    await waitFor(() => expect(screen.getByText(/Pas maintenant/)).toBeInTheDocument())
    expect(screen.getByText('Aucune étape exécutée pour ce run.')).toBeInTheDocument()
  })
})
