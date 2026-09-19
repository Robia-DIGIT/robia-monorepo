import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

import PageOpsNotificationDetail from './PageOpsNotificationDetail'
import * as api from '../lib/api'
import type { NotificationDelivery } from '../lib/api'

vi.mock('../lib/api', async (importOriginal) => {
  const actual = await importOriginal<typeof api>()
  return {
    ...actual,
    getNotificationDelivery: vi.fn(),
    retryNotificationDelivery: vi.fn(),
  }
})

const mockedApi = vi.mocked(api)

function delivery(overrides: Partial<NotificationDelivery> = {}): NotificationDelivery {
  return {
    id: 'delivery-1',
    channel: 'email',
    templateKey: 'automation_failed',
    status: 'dead_letter',
    attemptCount: 3,
    nextAttemptAt: '2026-09-17T06:00:00Z',
    recipientMasked: 'r***@example.com',
    providerMessageId: null,
    lastError: 'Connexion temporairement indisponible.',
    sentAt: null,
    createdAt: '2026-09-17T06:00:00Z',
    updatedAt: '2026-09-17T06:02:00Z',
    ...overrides,
  }
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/ops/notifications/delivery-1']}>
      <Routes>
        <Route path="/ops/notifications/:id" element={<PageOpsNotificationDetail />} />
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => vi.resetAllMocks())

describe('PageOpsNotificationDetail', () => {
  it('requeues an eligible dead-letter delivery and shows the resulting state', async () => {
    mockedApi.getNotificationDelivery.mockResolvedValue(delivery())
    mockedApi.retryNotificationDelivery.mockResolvedValue(delivery({ status: 'pending' }))
    renderPage()

    fireEvent.click(await screen.findByRole('button', { name: 'Relancer l’envoi' }))

    await waitFor(() => expect(mockedApi.retryNotificationDelivery).toHaveBeenCalledWith('delivery-1'))
    expect(await screen.findByText('La notification a été replacée dans la file d’envoi.')).toBeInTheDocument()
    expect(screen.getByText('En attente')).toBeInTheDocument()
  })

  it('blocks the retry UI when the five-attempt lifetime budget is exhausted', async () => {
    mockedApi.getNotificationDelivery.mockResolvedValue(delivery({ attemptCount: 5 }))
    renderPage()

    await screen.findByText('Échec définitif')
    expect(screen.queryByRole('button', { name: 'Relancer l’envoi' })).not.toBeInTheDocument()
    expect(screen.getByText(/plafond de cinq tentatives est atteint/)).toBeInTheDocument()
  })

  it('surfaces a backend retry conflict without pretending the retry succeeded', async () => {
    mockedApi.getNotificationDelivery.mockResolvedValue(delivery())
    mockedApi.retryNotificationDelivery.mockRejectedValue(new Error('Notification attempt limit reached.'))
    renderPage()

    fireEvent.click(await screen.findByRole('button', { name: 'Relancer l’envoi' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Notification attempt limit reached.')
    expect(screen.queryByText('La notification a été replacée dans la file d’envoi.')).not.toBeInTheDocument()
  })
})
