import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import PageOpsAutomationForm from './PageOpsAutomationForm'
import * as api from '../lib/api'
import type { Automation } from '../lib/api'
import { detectBrowserTimeZone } from '../lib/cron-schedule'

vi.mock('../lib/api', async (importOriginal) => {
  const actual = await importOriginal<typeof api>()
  return {
    ...actual,
    getAutomation: vi.fn(),
    createAutomation: vi.fn(),
    updateAutomation: vi.fn(),
  }
})

const mockedApi = vi.mocked(api)
const now = '2026-09-14T12:00:00Z'

function renderCreate() {
  return render(
    <MemoryRouter initialEntries={['/ops/automations/new']}>
      <Routes>
        <Route path="/ops/automations/new" element={<PageOpsAutomationForm />} />
      </Routes>
    </MemoryRouter>,
  )
}

function renderEdit(automation: Automation) {
  mockedApi.getAutomation.mockResolvedValue(automation)
  return render(
    <MemoryRouter initialEntries={['/ops/automations/auto-1/edit']}>
      <Routes>
        <Route path="/ops/automations/:id/edit" element={<PageOpsAutomationForm />} />
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  vi.resetAllMocks()
})

describe('PageOpsAutomationForm — create', () => {
  it('offers the RC26 email notification action', () => {
    renderCreate()
    expect(
      screen.getByRole('option', { name: 'Préparer un email à partir d’un modèle ROBIA' }),
    ).toBeInTheDocument()
  })

  it('requires a name before submitting', async () => {
    renderCreate()
    const submit = await screen.findByRole('button', { name: "Créer l'automatisation" })
    fireEvent.click(submit)

    await waitFor(() => expect(screen.getByText('Le nom est obligatoire.')).toBeInTheDocument())
    expect(mockedApi.createAutomation).not.toHaveBeenCalled()
  })

  it('requires an event type for an event trigger', async () => {
    renderCreate()
    fireEvent.change(await screen.findByPlaceholderText(/Ex. Régénérer/), { target: { value: 'Test' } })
    fireEvent.change(screen.getByDisplayValue('Manuel'), { target: { value: 'event' } })
    fireEvent.click(screen.getByRole('button', { name: "Créer l'automatisation" }))

    await waitFor(() =>
      expect(
        screen.getByText("Un type d'événement est requis pour un déclenchement événementiel."),
      ).toBeInTheDocument(),
    )
    expect(mockedApi.createAutomation).not.toHaveBeenCalled()
  })

  it('submits a valid manual automation with a default step', async () => {
    mockedApi.createAutomation.mockResolvedValue({ id: 'new-auto' } as Automation)
    renderCreate()

    fireEvent.change(await screen.findByPlaceholderText(/Ex. Régénérer/), {
      target: { value: 'Ma nouvelle automation' },
    })
    fireEvent.click(screen.getByRole('button', { name: "Créer l'automatisation" }))

    await waitFor(() => expect(mockedApi.createAutomation).toHaveBeenCalled())
    const payload = mockedApi.createAutomation.mock.calls[0][0]
    expect(payload.name).toBe('Ma nouvelle automation')
    expect(payload.trigger).toEqual({ type: 'manual', cronExpression: undefined, eventType: undefined })
    expect(payload.steps).toHaveLength(1)
    expect(payload.requiresApproval).toBe(true)
    expect(payload.enabled).toBe(false)
  })

  it('rejects invalid JSON in a step input', async () => {
    renderCreate()
    fireEvent.change(await screen.findByPlaceholderText(/Ex. Régénérer/), { target: { value: 'Test' } })
    fireEvent.change(screen.getByPlaceholderText(/Entrée JSON/), {
      target: { value: '{ not valid json' },
    })
    fireEvent.click(screen.getByRole('button', { name: "Créer l'automatisation" }))

    await waitFor(() =>
      expect(screen.getByText(/est invalide/)).toBeInTheDocument(),
    )
    expect(mockedApi.createAutomation).not.toHaveBeenCalled()
  })

  it('builds a structured condition from the simple condition form', async () => {
    mockedApi.createAutomation.mockResolvedValue({ id: 'new-auto' } as Automation)
    renderCreate()

    fireEvent.change(await screen.findByPlaceholderText(/Ex. Régénérer/), { target: { value: 'Avec condition' } })
    fireEvent.click(screen.getByLabelText('Ajouter une condition'))
    fireEvent.change(screen.getByDisplayValue('Âge du dernier audit (jours)'), {
      target: { value: 'opportunity.count' },
    })
    fireEvent.change(screen.getByDisplayValue('> supérieur à'), { target: { value: 'gt' } })
    fireEvent.change(screen.getByPlaceholderText('Valeur'), { target: { value: '3' } })
    fireEvent.click(screen.getByRole('button', { name: "Créer l'automatisation" }))

    await waitFor(() => expect(mockedApi.createAutomation).toHaveBeenCalled())
    const payload = mockedApi.createAutomation.mock.calls[0][0]
    expect(payload.conditions).toEqual({ field: 'opportunity.count', operator: 'gt', value: 3 })
  })
})

describe('PageOpsAutomationForm — scheduling builder (create)', () => {
  function switchToScheduled() {
    fireEvent.change(screen.getByDisplayValue('Manuel'), { target: { value: 'scheduled' } })
  }

  it('defaults the timezone field to the browser timezone', async () => {
    renderCreate()
    fireEvent.change(await screen.findByPlaceholderText(/Ex. Régénérer/), { target: { value: 'Test' } })
    switchToScheduled()

    expect((screen.getByLabelText('Fuseau horaire') as HTMLSelectElement).value).toBe(
      detectBrowserTimeZone(),
    )
  })

  it('generates a daily cron expression: minute hour * * *', async () => {
    mockedApi.createAutomation.mockResolvedValue({ id: 'new-auto' } as Automation)
    renderCreate()
    fireEvent.change(await screen.findByPlaceholderText(/Ex. Régénérer/), { target: { value: 'Test' } })
    switchToScheduled()
    fireEvent.change(screen.getByLabelText('Heure'), { target: { value: '09:30' } })
    fireEvent.click(screen.getByRole('button', { name: "Créer l'automatisation" }))

    await waitFor(() => expect(mockedApi.createAutomation).toHaveBeenCalled())
    const payload = mockedApi.createAutomation.mock.calls[0][0]
    expect(payload.trigger.cronExpression).toBe('30 9 * * *')
    expect(payload.trigger.timezone).toBe(detectBrowserTimeZone())
  })

  it('generates a weekly cron expression: minute hour * * weekday', async () => {
    mockedApi.createAutomation.mockResolvedValue({ id: 'new-auto' } as Automation)
    renderCreate()
    fireEvent.change(await screen.findByPlaceholderText(/Ex. Régénérer/), { target: { value: 'Test' } })
    switchToScheduled()
    fireEvent.change(screen.getByLabelText('Fréquence'), { target: { value: 'weekly' } })
    fireEvent.change(screen.getByLabelText('Heure'), { target: { value: '06:00' } })
    fireEvent.change(screen.getByLabelText('Jour de la semaine'), { target: { value: '3' } })
    fireEvent.click(screen.getByRole('button', { name: "Créer l'automatisation" }))

    await waitFor(() => expect(mockedApi.createAutomation).toHaveBeenCalled())
    const payload = mockedApi.createAutomation.mock.calls[0][0]
    expect(payload.trigger.cronExpression).toBe('0 6 * * 3')
  })

  it('generates a monthly cron expression: minute hour dayOfMonth * *', async () => {
    mockedApi.createAutomation.mockResolvedValue({ id: 'new-auto' } as Automation)
    renderCreate()
    fireEvent.change(await screen.findByPlaceholderText(/Ex. Régénérer/), { target: { value: 'Test' } })
    switchToScheduled()
    fireEvent.change(screen.getByLabelText('Fréquence'), { target: { value: 'monthly' } })
    fireEvent.change(screen.getByLabelText('Heure'), { target: { value: '18:15' } })
    fireEvent.change(screen.getByLabelText('Jour du mois'), { target: { value: '28' } })
    fireEvent.click(screen.getByRole('button', { name: "Créer l'automatisation" }))

    await waitFor(() => expect(mockedApi.createAutomation).toHaveBeenCalled())
    const payload = mockedApi.createAutomation.mock.calls[0][0]
    expect(payload.trigger.cronExpression).toBe('15 18 28 * *')
  })

  it('allows changing the timezone away from the browser default', async () => {
    mockedApi.createAutomation.mockResolvedValue({ id: 'new-auto' } as Automation)
    renderCreate()
    fireEvent.change(await screen.findByPlaceholderText(/Ex. Régénérer/), { target: { value: 'Test' } })
    switchToScheduled()
    fireEvent.change(screen.getByLabelText('Fuseau horaire'), { target: { value: 'Europe/Paris' } })
    fireEvent.click(screen.getByRole('button', { name: "Créer l'automatisation" }))

    await waitFor(() => expect(mockedApi.createAutomation).toHaveBeenCalled())
    const payload = mockedApi.createAutomation.mock.calls[0][0]
    expect(payload.trigger.timezone).toBe('Europe/Paris')
  })

  it('rejects an advanced cron expression that is not exactly 5 fields', async () => {
    renderCreate()
    fireEvent.change(await screen.findByPlaceholderText(/Ex. Régénérer/), { target: { value: 'Test' } })
    switchToScheduled()
    fireEvent.change(screen.getByLabelText('Fréquence'), { target: { value: 'advanced' } })
    fireEvent.change(screen.getByLabelText('Expression cron (5 champs)'), {
      target: { value: '0 0 9 * * 1' },
    })
    fireEvent.click(screen.getByRole('button', { name: "Créer l'automatisation" }))

    await waitFor(() => expect(screen.getByText(/exactement 5 champs/)).toBeInTheDocument())
    expect(mockedApi.createAutomation).not.toHaveBeenCalled()
  })

  it('rejects an empty advanced cron expression', async () => {
    renderCreate()
    fireEvent.change(await screen.findByPlaceholderText(/Ex. Régénérer/), { target: { value: 'Test' } })
    switchToScheduled()
    fireEvent.change(screen.getByLabelText('Fréquence'), { target: { value: 'advanced' } })
    fireEvent.click(screen.getByRole('button', { name: "Créer l'automatisation" }))

    await waitFor(() =>
      expect(
        screen.getByText('Une expression cron est requise pour un déclenchement planifié.'),
      ).toBeInTheDocument(),
    )
    expect(mockedApi.createAutomation).not.toHaveBeenCalled()
  })

  it('shows the backend error message when submission fails', async () => {
    mockedApi.createAutomation.mockRejectedValue(new Error('Le nom est déjà utilisé.'))
    renderCreate()
    fireEvent.change(await screen.findByPlaceholderText(/Ex. Régénérer/), { target: { value: 'Test' } })
    fireEvent.click(screen.getByRole('button', { name: "Créer l'automatisation" }))

    await waitFor(() => expect(screen.getByText('Le nom est déjà utilisé.')).toBeInTheDocument())
  })

  it('never enables the automation automatically when a schedule is configured', async () => {
    mockedApi.createAutomation.mockResolvedValue({ id: 'new-auto' } as Automation)
    renderCreate()
    fireEvent.change(await screen.findByPlaceholderText(/Ex. Régénérer/), { target: { value: 'Test' } })
    switchToScheduled()
    fireEvent.click(screen.getByRole('button', { name: "Créer l'automatisation" }))

    await waitFor(() => expect(mockedApi.createAutomation).toHaveBeenCalled())
    const payload = mockedApi.createAutomation.mock.calls[0][0]
    expect(payload.enabled).toBe(false)
  })
})

describe('PageOpsAutomationForm — edit', () => {
  const existing: Automation = {
    id: 'auto-1',
    organizationId: 'org-1',
    scope: 'ORGANIZATION',
    name: 'Automation existante',
    description: 'Une description',
    enabled: true,
    conditions: { field: 'audit.status', operator: 'eq', value: 'completed' },
    steps: [{ actionType: 'robia.report.prepare_organization_summary' }],
    requiresApproval: false,
    createdById: 'user-1',
    lastRunAt: null,
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
  }

  it('preloads the existing automation into the form', async () => {
    renderEdit(existing)

    await waitFor(() => expect(screen.getByDisplayValue('Automation existante')).toBeInTheDocument())
    expect(screen.getByDisplayValue('audit.completed')).toBeInTheDocument()
    expect(
      screen.queryByText(/Cette automatisation a une condition composée/),
    ).not.toBeInTheDocument()
  })

  it('submits changes via updateAutomation, not createAutomation', async () => {
    mockedApi.updateAutomation.mockResolvedValue(existing)
    renderEdit(existing)

    await waitFor(() => expect(screen.getByDisplayValue('Automation existante')).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }))

    await waitFor(() => expect(mockedApi.updateAutomation).toHaveBeenCalledWith('auto-1', expect.anything()))
    expect(mockedApi.createAutomation).not.toHaveBeenCalled()
  })
})

describe('PageOpsAutomationForm — scheduling builder (edit)', () => {
  function scheduledAutomation(overrides: {
    cronExpression: string
    timezone: string | null
  }): Automation {
    return {
      id: 'auto-2',
      organizationId: 'org-1',
      scope: 'ORGANIZATION',
      name: 'Automation planifiée',
      description: null,
      enabled: true,
      conditions: null,
      steps: [{ actionType: 'robia.report.prepare_organization_summary' }],
      requiresApproval: false,
      createdById: 'user-1',
      lastRunAt: null,
      nextRunAt: '2026-09-21T06:00:00.000Z',
      metadata: null,
      createdAt: now,
      updatedAt: now,
      trigger: {
        id: 'trig-2',
        automationId: 'auto-2',
        type: 'scheduled',
        cronExpression: overrides.cronExpression,
        timezone: overrides.timezone,
        eventType: null,
        config: null,
        createdAt: now,
        updatedAt: now,
      },
    }
  }

  it('recognizes an existing weekly preset cron and shows the matching fields', async () => {
    const automation = scheduledAutomation({ cronExpression: '30 9 * * 3', timezone: 'Europe/Paris' })
    renderEdit(automation)

    await waitFor(() => expect(screen.getByDisplayValue('Automation planifiée')).toBeInTheDocument())
    expect((screen.getByLabelText('Fréquence') as HTMLSelectElement).value).toBe('weekly')
    expect((screen.getByLabelText('Heure') as HTMLInputElement).value).toBe('09:30')
    expect((screen.getByLabelText('Jour de la semaine') as HTMLSelectElement).value).toBe('3')
    expect((screen.getByLabelText('Fuseau horaire') as HTMLSelectElement).value).toBe('Europe/Paris')
  })

  it('recognizes an existing monthly preset cron and shows the matching fields', async () => {
    const automation = scheduledAutomation({ cronExpression: '0 8 15 * *', timezone: 'UTC' })
    renderEdit(automation)

    await waitFor(() => expect(screen.getByDisplayValue('Automation planifiée')).toBeInTheDocument())
    expect((screen.getByLabelText('Fréquence') as HTMLSelectElement).value).toBe('monthly')
    expect((screen.getByLabelText('Jour du mois') as HTMLInputElement).value).toBe('15')
  })

  it('falls back to the advanced editor, verbatim, for an unrecognized cron expression', async () => {
    const automation = scheduledAutomation({ cronExpression: '*/15 9 * * *', timezone: 'UTC' })
    renderEdit(automation)

    await waitFor(() => expect(screen.getByDisplayValue('Automation planifiée')).toBeInTheDocument())
    expect((screen.getByLabelText('Fréquence') as HTMLSelectElement).value).toBe('advanced')
    expect((screen.getByLabelText('Expression cron (5 champs)') as HTMLInputElement).value).toBe(
      '*/15 9 * * *',
    )
  })

  it('never silently rewrites an unrecognized cron expression when submitting unchanged', async () => {
    const automation = scheduledAutomation({ cronExpression: '*/15 9 * * *', timezone: 'UTC' })
    mockedApi.updateAutomation.mockResolvedValue(automation)
    renderEdit(automation)

    await waitFor(() => expect(screen.getByDisplayValue('Automation planifiée')).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }))

    await waitFor(() => expect(mockedApi.updateAutomation).toHaveBeenCalled())
    const payload = mockedApi.updateAutomation.mock.calls[0][1]
    expect(payload.trigger?.cronExpression).toBe('*/15 9 * * *')
  })

  it('preserves the existing cron and timezone when submitting a recognized preset unchanged', async () => {
    const automation = scheduledAutomation({ cronExpression: '30 9 * * 3', timezone: 'Indian/Antananarivo' })
    mockedApi.updateAutomation.mockResolvedValue(automation)
    renderEdit(automation)

    await waitFor(() => expect(screen.getByDisplayValue('Automation planifiée')).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }))

    await waitFor(() => expect(mockedApi.updateAutomation).toHaveBeenCalled())
    const payload = mockedApi.updateAutomation.mock.calls[0][1]
    expect(payload.trigger?.cronExpression).toBe('30 9 * * 3')
    expect(payload.trigger?.timezone).toBe('Indian/Antananarivo')
  })
})
