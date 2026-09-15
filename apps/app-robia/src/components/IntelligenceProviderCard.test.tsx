import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { IntelligenceProviderCard } from './IntelligenceProviderCard'
import type { IntelligenceProvider, IntelligenceProviderStatus, IntelligenceSignal } from '../lib/api'

function signal(overrides: Partial<IntelligenceSignal> = {}): IntelligenceSignal {
  return {
    provider: 'seo',
    status: 'ok',
    organizationId: 'org-1',
    observedAt: '2026-09-10T00:00:00.000Z',
    readOnly: true,
    scoreInfluence: true,
    data: { version: 'v2', globalScore: 75, categories: {} },
    unavailableReason: null,
    ...overrides,
  }
}

function renderCard(value: IntelligenceSignal) {
  return render(
    <MemoryRouter>
      <IntelligenceProviderCard signal={value} />
    </MemoryRouter>,
  )
}

describe('IntelligenceProviderCard', () => {
  it.each<[IntelligenceProviderStatus, string]>([
    ['ok', 'Disponible'],
    ['partial', 'Partiel'],
    ['not_connected', 'Non connecté'],
    ['not_configured', 'Configuration requise'],
    ['unavailable', 'Temporairement indisponible'],
  ])('renders the %s status distinctly as "%s"', (status, label) => {
    renderCard(signal({ status, data: status === 'ok' || status === 'partial' ? { x: 1 } : null }))
    expect(screen.getByText(label)).toBeInTheDocument()
  })

  it('never renders a fabricated "0" for a provider with null data — shows the reason instead', () => {
    renderCard(
      signal({
        provider: 'pagespeed',
        status: 'unavailable',
        data: null,
        unavailableReason: 'no_pagespeed_data',
      }),
    )
    // No numeric metric of any kind is rendered for an unavailable signal —
    // only the status badge and the reason text.
    expect(screen.queryByText(/^0$/)).not.toBeInTheDocument()
    expect(screen.getByTestId('intelligence-reason-pagespeed')).toHaveTextContent(
      /aucune donnée PageSpeed disponible/i,
    )
  })

  it('shows "Hors score SEO" when scoreInfluence is false', () => {
    renderCard(signal({ provider: 'meta', status: 'not_connected', scoreInfluence: false, data: null }))
    expect(screen.getByText('Hors score SEO')).toBeInTheDocument()
  })

  it('shows "Contribue au score SEO" only when scoreInfluence is true (SEO itself)', () => {
    renderCard(signal({ provider: 'seo', status: 'ok', scoreInfluence: true }))
    expect(screen.getByText('Contribue au score SEO')).toBeInTheDocument()
    expect(screen.queryByText('Hors score SEO')).not.toBeInTheDocument()
  })

  it('renders Meta not_connected without any fabricated metric, and offers a Configurer link to /meta-data', () => {
    renderCard(
      signal({
        provider: 'meta',
        status: 'not_connected',
        scoreInfluence: false,
        data: null,
        unavailableReason: 'not_connected',
      }),
    )
    expect(screen.getByText('Non connecté')).toBeInTheDocument()
    expect(screen.queryByText(/^0$/)).not.toBeInTheDocument()
    const configureLink = screen.getByRole('link', { name: 'Configurer' })
    expect(configureLink).toHaveAttribute('href', '/meta-data')
  })

  it('offers a Configurer link to /google-data for search_console and ga4', () => {
    const { unmount } = renderCard(
      signal({ provider: 'search_console', status: 'not_configured', scoreInfluence: false, data: null }),
    )
    expect(screen.getByRole('link', { name: 'Configurer' })).toHaveAttribute('href', '/google-data')
    unmount()

    renderCard(signal({ provider: 'ga4', status: 'not_connected', scoreInfluence: false, data: null }))
    expect(screen.getByRole('link', { name: 'Configurer' })).toHaveAttribute('href', '/google-data')
  })

  it('renders GBP as a placeholder with no fake network CTA, whatever its status', () => {
    renderCard(
      signal({
        provider: 'gbp',
        status: 'not_connected',
        scoreInfluence: false,
        readOnly: true,
        data: null,
        unavailableReason: 'not_connected',
      }),
    )
    expect(screen.getByText('Non connecté')).toBeInTheDocument()
    expect(screen.getByTestId('intelligence-reason-gbp')).toHaveTextContent(
      'Intégration à activer ultérieurement.',
    )
    expect(screen.queryByRole('link', { name: 'Configurer' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /connecter/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /connecter/i })).not.toBeInTheDocument()
  })

  it('never offers a Configurer CTA for SEO or PageSpeed (no connection to configure)', () => {
    const providers: IntelligenceProvider[] = ['seo', 'pagespeed']
    providers.forEach((provider) => {
      const { unmount } = renderCard(
        signal({ provider, status: 'unavailable', data: null, unavailableReason: 'no_audit' }),
      )
      expect(screen.queryByRole('link', { name: 'Configurer' })).not.toBeInTheDocument()
      unmount()
    })
  })
})
