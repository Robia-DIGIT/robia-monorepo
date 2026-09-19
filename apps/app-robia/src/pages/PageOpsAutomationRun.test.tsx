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
            attemptCount: 1,
            nextAttemptAt: null,
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
            attemptCount: 1,
            nextAttemptAt: null,
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

  it('renders the exact immutable planned steps before approval, not the empty executed-steps list', async () => {
    mockedApi.getAutomationRun.mockResolvedValue(
      baseRun({
        status: 'waiting_approval',
        requiresApproval: true,
        approvalStatus: 'pending',
        plannedSteps: [
          {
            actionType: 'robia.action_items.create_internal_task',
            input: { title: 'Vérifier le certificat SSL' },
          },
        ],
        steps: [],
      }),
    )

    renderPage()

    await waitFor(() => expect(screen.getByText('Étapes prévues')).toBeInTheDocument())
    expect(screen.getByText(/robia.action_items.create_internal_task/)).toBeInTheDocument()
    expect(screen.getByText(/Vérifier le certificat SSL/)).toBeInTheDocument()
    // The approval CTA is present alongside the visible plan — never shown
    // without it.
    expect(screen.getByRole('button', { name: /Approuver et exécuter/ })).toBeInTheDocument()
  })

  it('shows the resolved {{event.<key>}} value in plannedSteps for an event-driven run, never the raw placeholder', async () => {
    mockedApi.getAutomationRun.mockResolvedValue(
      baseRun({
        status: 'waiting_approval',
        requiresApproval: true,
        approvalStatus: 'pending',
        triggerType: 'event',
        plannedSteps: [
          {
            actionType: 'robia.opportunities.regenerate',
            // The backend resolves {{event.auditId}} at trigger time, so this
            // is always already the literal value by the time it reaches the
            // frontend — never a template string.
            input: { auditId: 'audit-123' },
          },
        ],
        steps: [],
      }),
    )

    renderPage()

    await waitFor(() => expect(screen.getByText('Étapes prévues')).toBeInTheDocument())
    expect(screen.getByText(/audit-123/)).toBeInTheDocument()
    expect(screen.queryByText(/\{\{event\./)).not.toBeInTheDocument()
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

  // ---------------------------------------------------------------------
  // Step-level retries (RC-28 — frontend visibility for backend RC-27)
  // ---------------------------------------------------------------------

  it('shows a retry-scheduled step with its badge and the next attempt time, and a run-level banner explaining the run is not stuck', async () => {
    const nextAttemptAt = '2026-09-14T12:05:00Z'
    mockedApi.getAutomationRun.mockResolvedValue(
      baseRun({
        status: 'running',
        steps: [
          {
            id: 'step-1',
            runId: 'run-1',
            sequence: 1,
            actionType: 'robia.audit.run_diagnostic',
            input: { websiteId: 'site-1' },
            status: 'retry_scheduled',
            evidence: null,
            error: 'ECONNRESET',
            attemptCount: 1,
            nextAttemptAt,
            startedAt: now,
            finishedAt: null,
            createdAt: now,
          },
        ],
      }),
    )

    renderPage()

    await waitFor(() =>
      expect(screen.getByText('Nouvelle tentative programmée')).toBeInTheDocument(),
    )
    // The step's own next-attempt note.
    expect(screen.getByText(/Nouvelle tentative prévue à/)).toBeInTheDocument()
    // The run-level banner — names the step and the upcoming attempt number
    // (attemptCount + 1), and says the run is not stuck. The action type
    // also appears in the step's own header, so there are two matches.
    expect(screen.getAllByText(/robia.audit.run_diagnostic/).length).toBe(2)
    expect(screen.getByText(/tentative 2/)).toBeInTheDocument()
    expect(screen.getByText(/aucune action n'est nécessaire/i)).toBeInTheDocument()
    // The run's own status badge stays "En cours" — a retry in progress is
    // never mistaken for a failure.
    expect(screen.getAllByText('En cours').length).toBeGreaterThanOrEqual(1)
    // The last error is shown, explicitly labelled as such (not a bare,
    // unlabelled error the way a final failure's is).
    expect(screen.getByText(/Dernière erreur : ECONNRESET/)).toBeInTheDocument()
  })

  it('never shows the retry banner when no step is waiting on a retry', async () => {
    mockedApi.getAutomationRun.mockResolvedValue(baseRun({ status: 'succeeded' }))

    renderPage()

    await waitFor(() => expect(screen.getByText('Succès')).toBeInTheDocument())
    expect(screen.queryByText(/aucune action n'est nécessaire/i)).not.toBeInTheDocument()
    expect(screen.queryByText('Nouvelle tentative programmée')).not.toBeInTheDocument()
  })

  it('shows the attempt count next to a step only once it took more than one attempt', async () => {
    mockedApi.getAutomationRun.mockResolvedValue(
      baseRun({
        status: 'succeeded',
        steps: [
          {
            id: 'step-1',
            runId: 'run-1',
            sequence: 1,
            actionType: 'robia.report.prepare_organization_summary',
            input: {},
            status: 'succeeded',
            evidence: { ok: true },
            error: null,
            attemptCount: 2,
            nextAttemptAt: null,
            startedAt: now,
            finishedAt: now,
            createdAt: now,
          },
        ],
      }),
    )

    renderPage()

    await waitFor(() => expect(screen.getByText('2 tentatives')).toBeInTheDocument())
  })

  it('never shows an attempt count for a step that succeeded on its first try', async () => {
    mockedApi.getAutomationRun.mockResolvedValue(
      baseRun({
        status: 'succeeded',
        steps: [
          {
            id: 'step-1',
            runId: 'run-1',
            sequence: 1,
            actionType: 'robia.report.prepare_organization_summary',
            input: {},
            status: 'succeeded',
            evidence: { ok: true },
            error: null,
            attemptCount: 1,
            nextAttemptAt: null,
            startedAt: now,
            finishedAt: now,
            createdAt: now,
          },
        ],
      }),
    )

    renderPage()

    await waitFor(() =>
      expect(screen.getAllByText('Succès').length).toBeGreaterThanOrEqual(2),
    )
    expect(screen.queryByText(/tentatives/)).not.toBeInTheDocument()
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
