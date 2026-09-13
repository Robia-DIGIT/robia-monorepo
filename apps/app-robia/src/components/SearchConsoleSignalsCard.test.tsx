import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { SearchConsoleSignalsCard } from './SearchConsoleSignalsCard'
import type { AuditSearchConsoleSignals } from '../lib/api'

function signals(overrides?: Partial<AuditSearchConsoleSignals>): AuditSearchConsoleSignals {
  return {
    status: 'ok',
    source: 'search_console',
    siteUrl: 'sc-domain:robiacopilot.site',
    period: { startDate: '2026-08-15', endDate: '2026-09-11' },
    summary: { clicks: 120, impressions: 4300, ctr: 0.0279, position: 12.4 },
    lastSyncedAt: '2026-09-11T08:00:00Z',
    unavailableReason: null,
    ...overrides,
  }
}

describe('SearchConsoleSignalsCard', () => {
  it('renders "not measured" when signals is null, never a zero value', () => {
    render(<SearchConsoleSignalsCard signals={null} />)

    expect(screen.getByTestId('search-console-card-not-measured')).toBeInTheDocument()
    expect(screen.getByText('Non mesuré pour cette analyse.')).toBeInTheDocument()
  })

  it('renders clicks, impressions, CTR and average position when ok', () => {
    render(<SearchConsoleSignalsCard signals={signals()} />)

    expect(screen.getByTestId('search-console-card-ok')).toBeInTheDocument()
    expect(screen.getByText('120')).toBeInTheDocument()
    expect(screen.getByText('4300')).toBeInTheDocument()
    expect(screen.getByText('2.8%')).toBeInTheDocument()
    expect(screen.getByText('12.4')).toBeInTheDocument()
  })

  it('renders a friendly reason when not connected, never a raw error', () => {
    render(
      <SearchConsoleSignalsCard
        signals={signals({
          status: 'unavailable',
          summary: null,
          siteUrl: null,
          period: null,
          unavailableReason: 'not_connected',
        })}
      />,
    )

    expect(screen.getByTestId('search-console-card-unavailable')).toBeInTheDocument()
    expect(screen.getByText(/Search Console non connecté/)).toBeInTheDocument()
  })

  it('renders a friendly reason for a stale sync', () => {
    render(
      <SearchConsoleSignalsCard
        signals={signals({
          status: 'unavailable',
          summary: null,
          period: null,
          unavailableReason: 'not_synced_recently',
        })}
      />,
    )

    expect(screen.getByText(/pas de synchronisation récente/)).toBeInTheDocument()
  })

  it('shows a transient-failure message for temporarily_unavailable, never the reconnect instruction', () => {
    render(
      <SearchConsoleSignalsCard
        signals={signals({
          status: 'unavailable',
          summary: null,
          siteUrl: null,
          period: null,
          unavailableReason: 'temporarily_unavailable',
        })}
      />,
    )

    expect(
      screen.getByText('Search Console est temporairement indisponible. Réessayez plus tard.'),
    ).toBeInTheDocument()
    expect(screen.queryByText(/Connectez ou synchronisez/)).not.toBeInTheDocument()
  })

  it('keeps the reconnect/sync instruction for the connection-related reasons', () => {
    render(
      <SearchConsoleSignalsCard
        signals={signals({
          status: 'unavailable',
          summary: null,
          siteUrl: null,
          period: null,
          unavailableReason: 'no_property_selected',
        })}
      />,
    )

    expect(screen.getByText(/Connectez ou synchronisez Search Console/)).toBeInTheDocument()
  })
})
