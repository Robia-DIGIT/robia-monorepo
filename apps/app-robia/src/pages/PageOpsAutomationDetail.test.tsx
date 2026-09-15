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
})
