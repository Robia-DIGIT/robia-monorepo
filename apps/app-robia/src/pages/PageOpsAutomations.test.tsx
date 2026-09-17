import { render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import PageOpsAutomations from './PageOpsAutomations'
import * as api from '../lib/api'
import type { Automation } from '../lib/api'

vi.mock('../lib/api', async (importOriginal) => {
  const actual = await importOriginal<typeof api>()
  return {
    ...actual,
    listAutomations: vi.fn(),
    setAutomationEnabled: vi.fn(),
    triggerAutomation: vi.fn(),
  }
})

const mockedApi = vi.mocked(api)

const now = '2026-09-14T12:00:00Z'

function makeAutomation(overrides: Partial<Automation> = {}): Automation {
  return {
    id: 'auto-1',
    organizationId: 'org-1',
    scope: 'ORGANIZATION',
    name: "Régénérer les opportunités après un audit terminé",
    description: 'Description de test',
    enabled: true,
    conditions: null,
    steps: [{ actionType: 'robia.opportunities.regenerate' }],
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
      type: 'event',
      cronExpression: null,
      timezone: null,
      eventType: 'audit.completed',
      config: null,
      createdAt: now,
      updatedAt: now,
    },
    ...overrides,
  }
}

function renderPage() {
  return render(
    <MemoryRouter>
      <PageOpsAutomations />
    </MemoryRouter>,
  )
}

beforeEach(() => {
  vi.resetAllMocks()
})

describe('PageOpsAutomations', () => {
  it('lists automations with their enabled/mode/trigger badges', async () => {
    mockedApi.listAutomations.mockResolvedValue([makeAutomation()])

    renderPage()

    await waitFor(() =>
      expect(
        screen.getByText("Régénérer les opportunités après un audit terminé"),
      ).toBeInTheDocument(),
    )
    expect(screen.getByText('Activée')).toBeInTheDocument()
    expect(screen.getByText('Sans validation')).toBeInTheDocument()
    expect(screen.getByText(/audit.completed/)).toBeInTheDocument()
  })

  it('shows "Validation requise" for an automation that requires approval', async () => {
    mockedApi.listAutomations.mockResolvedValue([
      makeAutomation({ requiresApproval: true, enabled: false }),
    ])

    renderPage()

    await waitFor(() => expect(screen.getByText('Désactivée')).toBeInTheDocument())
    expect(screen.getByText('Validation requise')).toBeInTheDocument()
  })

  it('shows an empty state when there are no automations', async () => {
    mockedApi.listAutomations.mockResolvedValue([])

    renderPage()

    await waitFor(() => expect(screen.getByText('Aucune automatisation')).toBeInTheDocument())
  })

  it('toggles enabled state via setAutomationEnabled', async () => {
    mockedApi.listAutomations.mockResolvedValue([makeAutomation({ enabled: true })])
    mockedApi.setAutomationEnabled.mockResolvedValue(makeAutomation({ enabled: false }))

    renderPage()

    const button = await screen.findByRole('button', { name: 'Désactiver' })
    button.click()

    await waitFor(() =>
      expect(mockedApi.setAutomationEnabled).toHaveBeenCalledWith('auto-1', false),
    )
  })

  it('shows the human-readable frequency, timezone, and next run for a scheduled automation', async () => {
    mockedApi.listAutomations.mockResolvedValue([
      makeAutomation({
        trigger: {
          id: 'trig-1',
          automationId: 'auto-1',
          type: 'scheduled',
          cronExpression: '30 9 * * *',
          timezone: 'Europe/Paris',
          eventType: null,
          config: null,
          createdAt: now,
          updatedAt: now,
        },
        nextRunAt: '2026-09-21T06:00:00.000Z',
      }),
    ])

    renderPage()

    await waitFor(() => expect(screen.getByText(/Tous les jours à 09:30/)).toBeInTheDocument())
    expect(screen.getByText('Fuseau : Europe/Paris')).toBeInTheDocument()
    expect(screen.getByText(/Prochaine exécution : 21\/09\/2026 08:00 \(Europe\/Paris\)/)).toBeInTheDocument()
  })

  it('shows "Non planifiée" when a scheduled automation has no nextRunAt', async () => {
    mockedApi.listAutomations.mockResolvedValue([
      makeAutomation({
        trigger: {
          id: 'trig-1',
          automationId: 'auto-1',
          type: 'scheduled',
          cronExpression: '30 9 * * *',
          timezone: 'UTC',
          eventType: null,
          config: null,
          createdAt: now,
          updatedAt: now,
        },
        nextRunAt: null,
      }),
    ])

    renderPage()

    await waitFor(() => expect(screen.getByText(/Prochaine exécution : Non planifiée/)).toBeInTheDocument())
  })
})
