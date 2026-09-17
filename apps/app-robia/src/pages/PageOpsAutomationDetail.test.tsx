import { render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import PageOpsAutomationDetail from './PageOpsAutomationDetail'
import * as api from '../lib/api'
import type { Automation, AutomationRun } from '../lib/api'

vi.mock('../lib/api', async (importOriginal) => {
  const actual = await importOriginal<typeof api>()
  return {
    ...actual,
    getAutomation: vi.fn(),
    listAutomationRuns: vi.fn(),
    setAutomationEnabled: vi.fn(),
    triggerAutomation: vi.fn(),
  }
})

const mockedApi = vi.mocked(api)
const now = '2026-09-14T12:00:00Z'

const automation: Automation = {
  id: 'auto-1',
  organizationId: 'org-1',
  scope: 'ORGANIZATION',
  name: 'Préparer un rapport',
  description: null,
  enabled: true,
  conditions: null,
  steps: [{ actionType: 'robia.report.prepare_organization_summary' }],
  requiresApproval: false,
  createdById: 'user-1',
  lastRunAt: now,
  nextRunAt: null,
  metadata: null,
  createdAt: now,
  updatedAt: now,
  trigger: {
    id: 'trig-1',
    automationId: 'auto-1',
    type: 'manual',
    cronExpression: null,
    timezone: null,
    eventType: null,
    config: null,
    createdAt: now,
    updatedAt: now,
  },
}

const run: AutomationRun = {
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
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/ops/automations/auto-1']}>
      <Routes>
        <Route path="/ops/automations/:id" element={<PageOpsAutomationDetail />} />
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  vi.resetAllMocks()
})

describe('PageOpsAutomationDetail', () => {
  it('shows the automation config and its run history', async () => {
    mockedApi.getAutomation.mockResolvedValue(automation)
    mockedApi.listAutomationRuns.mockResolvedValue([run])

    renderPage()

    await waitFor(() => expect(screen.getByText('Préparer un rapport')).toBeInTheDocument())
    expect(screen.getByText('Manuel')).toBeInTheDocument()
    expect(screen.getByText('Succès')).toBeInTheDocument()
    expect(mockedApi.getAutomation).toHaveBeenCalledWith('auto-1')
    expect(mockedApi.listAutomationRuns).toHaveBeenCalledWith('auto-1')
  })

  it('shows an empty state when there is no run yet', async () => {
    mockedApi.getAutomation.mockResolvedValue(automation)
    mockedApi.listAutomationRuns.mockResolvedValue([])

    renderPage()

    await waitFor(() => expect(screen.getByText('Aucune exécution')).toBeInTheDocument())
  })

  it('never shows scheduling details for a non-scheduled automation', async () => {
    mockedApi.getAutomation.mockResolvedValue(automation)
    mockedApi.listAutomationRuns.mockResolvedValue([])

    renderPage()

    await waitFor(() => expect(screen.getByText('Préparer un rapport')).toBeInTheDocument())
    expect(screen.queryByText('Fréquence')).not.toBeInTheDocument()
    expect(screen.queryByText('Prochaine exécution')).not.toBeInTheDocument()
  })
})

describe('PageOpsAutomationDetail — scheduled automation', () => {
  const scheduled: Automation = {
    ...automation,
    id: 'auto-2',
    name: 'Automation planifiée',
    trigger: {
      id: 'trig-2',
      automationId: 'auto-2',
      type: 'scheduled',
      cronExpression: '0 8 15 * *',
      timezone: 'Indian/Antananarivo',
      eventType: null,
      config: null,
      createdAt: now,
      updatedAt: now,
    },
    nextRunAt: '2026-09-21T06:00:00.000Z',
  }

  function renderScheduledPage() {
    return render(
      <MemoryRouter initialEntries={['/ops/automations/auto-2']}>
        <Routes>
          <Route path="/ops/automations/:id" element={<PageOpsAutomationDetail />} />
        </Routes>
      </MemoryRouter>,
    )
  }

  it('shows the frequency, timezone, next run, and scheduler resolution note', async () => {
    mockedApi.getAutomation.mockResolvedValue(scheduled)
    mockedApi.listAutomationRuns.mockResolvedValue([])

    renderScheduledPage()

    await waitFor(() => expect(screen.getByText('Automation planifiée')).toBeInTheDocument())
    expect(screen.getByText('Le 15 de chaque mois à 08:00')).toBeInTheDocument()
    expect(screen.getByText('Indian/Antananarivo')).toBeInTheDocument()
    expect(screen.getByText(/21\/09\/2026 09:00 \(Indian\/Antananarivo\)/)).toBeInTheDocument()
    expect(screen.getByText(/une fois par minute/)).toBeInTheDocument()
  })

  it('shows "Non planifiée" when nextRunAt is null', async () => {
    mockedApi.getAutomation.mockResolvedValue({ ...scheduled, nextRunAt: null })
    mockedApi.listAutomationRuns.mockResolvedValue([])

    renderScheduledPage()

    await waitFor(() => expect(screen.getByText('Automation planifiée')).toBeInTheDocument())
    expect(screen.getByText('Non planifiée')).toBeInTheDocument()
  })
})
