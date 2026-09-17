import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import PageOpsAutomationForm from './PageOpsAutomationForm'
import * as api from '../lib/api'
import type { Automation } from '../lib/api'

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

  it('requires a cron expression for a scheduled trigger', async () => {
    renderCreate()
    fireEvent.change(await screen.findByPlaceholderText(/Ex. Régénérer/), { target: { value: 'Test' } })
    fireEvent.change(screen.getByDisplayValue('Manuel'), { target: { value: 'scheduled' } })
    fireEvent.click(screen.getByRole('button', { name: "Créer l'automatisation" }))

    await waitFor(() =>
      expect(
        screen.getByText('Une expression cron est requise pour un déclenchement planifié.'),
      ).toBeInTheDocument(),
    )
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
