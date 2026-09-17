import { render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'

import PageOpsNotifications from './PageOpsNotifications'
import * as api from '../lib/api'
import type { NotificationDelivery } from '../lib/api'

vi.mock('../lib/api', async (importOriginal) => {
  const actual = await importOriginal<typeof api>()
  return { ...actual, listNotificationDeliveries: vi.fn() }
})

const mockedApi = vi.mocked(api)

function delivery(overrides: Partial<NotificationDelivery> = {}): NotificationDelivery {
  return {
    id: 'delivery-1',
    channel: 'email',
    templateKey: 'weekly_opportunities_summary',
    status: 'sent',
    attemptCount: 1,
    nextAttemptAt: '2026-09-17T06:00:00Z',
    recipientMasked: 'r***@example.com',
    providerMessageId: 'smtp-1',
    lastError: null,
    sentAt: '2026-09-17T06:01:00Z',
    createdAt: '2026-09-17T06:00:00Z',
    updatedAt: '2026-09-17T06:01:00Z',
    ...overrides,
  }
}

beforeEach(() => vi.resetAllMocks())

describe('PageOpsNotifications', () => {
  it('shows the exact delivery state, masked recipient and attempt count', async () => {
    mockedApi.listNotificationDeliveries.mockResolvedValue([delivery()])

    render(<MemoryRouter><PageOpsNotifications /></MemoryRouter>)

    await waitFor(() => expect(screen.getByText('Résumé hebdomadaire des opportunités')).toBeInTheDocument())
    expect(screen.getByText('Accepté par le serveur email')).toBeInTheDocument()
    expect(screen.getByText(/r\*\*\*@example.com/)).toBeInTheDocument()
    expect(screen.getByText('1/5 tentative(s)')).toBeInTheDocument()
  })

  it('shows a useful empty state', async () => {
    mockedApi.listNotificationDeliveries.mockResolvedValue([])
    render(<MemoryRouter><PageOpsNotifications /></MemoryRouter>)
    await waitFor(() => expect(screen.getByText('Aucune notification')).toBeInTheDocument())
  })
})
