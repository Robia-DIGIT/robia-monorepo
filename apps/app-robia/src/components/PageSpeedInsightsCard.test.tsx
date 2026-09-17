import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { PageSpeedInsightsCard } from './PageSpeedInsightsCard'
import type { PageSpeedInsightsResult } from '../lib/api'

function psi(overrides: Partial<PageSpeedInsightsResult>): PageSpeedInsightsResult {
  return {
    status: 'ok',
    strategy: 'mobile',
    performanceScore: 87,
    metrics: { lcpMs: 1800, cls: 0.05, tbtMs: 90, fcpMs: 900 },
    fetchedAt: '2026-09-11T08:00:00+00:00',
    analyzedUrl: 'https://example.com',
    finalUrl: 'https://example.com/',
    source: 'google_pagespeed_insights',
    unavailableReason: null,
    ...overrides,
  }
}

describe('PageSpeedInsightsCard', () => {
  it('renders a full measurement with score and Core Web Vitals', () => {
    render(<PageSpeedInsightsCard psi={psi({})} />)

    expect(screen.getByText('PageSpeed mobile')).toBeInTheDocument()
    expect(screen.getByText('87')).toBeInTheDocument()
    expect(screen.getByText('1.8s')).toBeInTheDocument()
    expect(screen.getByText('0.05')).toBeInTheDocument()
    expect(screen.getByText(/pas un Core Web Vital/)).toBeInTheDocument()
    expect(screen.getByText('Source : google_pagespeed_insights')).toBeInTheDocument()
  })

  it('renders partial metrics without inventing values Google omitted', () => {
    render(
      <PageSpeedInsightsCard
        psi={psi({
          performanceScore: 60,
          metrics: { lcpMs: null, cls: 0.2, tbtMs: null, fcpMs: null },
        })}
      />,
    )

    expect(screen.getByText('60')).toBeInTheDocument()
    expect(screen.getByText('0.20')).toBeInTheDocument()
    // LCP is missing from the PSI response: shown as absent, not as 0 or "0.0s".
    expect(screen.getAllByText('Non fourni par Google')).toHaveLength(1)
    expect(screen.queryByText(/TBT/)).not.toBeInTheDocument()
  })

  it('renders the unavailable status with a friendly reason, never a zero score', () => {
    render(
      <PageSpeedInsightsCard
        psi={psi({
          status: 'unavailable',
          performanceScore: null,
          metrics: { lcpMs: null, cls: null, tbtMs: null, fcpMs: null },
          unavailableReason: 'rate_limited',
        })}
      />,
    )

    expect(screen.getByTestId('pagespeed-card-unavailable')).toBeInTheDocument()
    expect(screen.getByText(/Mesure indisponible/)).toBeInTheDocument()
    expect(screen.getByText(/quota Google temporairement atteint/)).toBeInTheDocument()
    expect(screen.queryByText('0')).not.toBeInTheDocument()
    expect(screen.queryByText('87')).not.toBeInTheDocument()
  })

  it('renders "not measured" when psi is null, never a zero score', () => {
    render(<PageSpeedInsightsCard psi={null} />)

    expect(screen.getByTestId('pagespeed-card-not-measured')).toBeInTheDocument()
    expect(screen.getByText('Non mesuré pour cette analyse.')).toBeInTheDocument()
    expect(screen.queryByText('0')).not.toBeInTheDocument()
  })

  it('never renders a reference to a direct Google request or an API key', () => {
    const { container } = render(<PageSpeedInsightsCard psi={psi({})} />)

    expect(container.innerHTML).not.toMatch(/googleapis\.com/)
    expect(container.innerHTML).not.toMatch(/key=/i)
    expect(container.querySelectorAll('[src*="googleapis"], [href*="googleapis"]')).toHaveLength(0)
  })
})
