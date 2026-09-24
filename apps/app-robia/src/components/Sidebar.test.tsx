import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

import Sidebar from './Sidebar'
import type { Organization, UserSummary } from '../lib/api'

const organization: Organization = {
  id: 'org-1',
  name: 'ROBIA Demo',
  sector: null,
  city: 'Antananarivo',
  country: 'Madagascar',
  ownerId: 'user-1',
  createdAt: '2026-09-24T00:00:00Z',
}

const currentUser: UserSummary = { id: 'user-1', email: 'demo@robia.app', name: 'Démo ROBIA' }

function renderSidebar(overrides: Partial<React.ComponentProps<typeof Sidebar>> = {}) {
  const props: React.ComponentProps<typeof Sidebar> = {
    activePath: '/execution',
    collapsed: false,
    onToggleCollapsed: vi.fn(),
    onNavigate: vi.fn(),
    isOpen: true,
    organization,
    currentUser,
    onLogout: vi.fn(),
    connectionStatus: 'connected',
    orgInitial: 'R',
    userInitial: 'D',
    ...overrides,
  }
  return {
    ...render(
      <MemoryRouter initialEntries={[props.activePath]}>
        <Sidebar {...props} />
      </MemoryRouter>,
    ),
    props,
  }
}

describe('Sidebar', () => {
  it('renders every primary nav section with its real label', () => {
    renderSidebar()
    expect(screen.getByRole('link', { name: 'Command Center' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Actions' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Copilot' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Candidatures ODC' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Automatisations' })).toBeInTheDocument()
  })

  it('marks the item matching activePath as the current page', () => {
    renderSidebar({ activePath: '/execution' })
    expect(screen.getByRole('link', { name: 'Actions' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: 'Command Center' })).not.toHaveAttribute('aria-current')
  })

  it('calls onToggleCollapsed when the rail toggle is clicked', () => {
    const onToggleCollapsed = vi.fn()
    renderSidebar({ onToggleCollapsed })
    fireEvent.click(screen.getByRole('button', { name: 'Réduire le menu' }))
    expect(onToggleCollapsed).toHaveBeenCalledTimes(1)
  })

  it('hides text labels but keeps accessible names when collapsed', () => {
    renderSidebar({ collapsed: true })
    expect(screen.queryByText('Command Center')).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Command Center' })).toBeInTheDocument()
  })

  it('renders the not-yet-available rows as disabled, non-interactive buttons', () => {
    renderSidebar()
    const settings = screen.getByRole('button', { name: 'Paramètres' })
    expect(settings).toBeDisabled()
    const help = screen.getByRole('button', { name: 'Aide & Support' })
    expect(help).toBeDisabled()
  })

  it('shows the real organization location as the connection line, not a hardcoded string', () => {
    renderSidebar()
    expect(screen.getByText('Antananarivo, Madagascar')).toBeInTheDocument()
  })

  it('falls back to a generic label when no organization/user is loaded yet', () => {
    renderSidebar({ organization: null, currentUser: null, connectionStatus: 'loading' })
    expect(screen.getByText('Organisation active')).toBeInTheDocument()
    expect(screen.getByText('Connexion en cours…')).toBeInTheDocument()
    expect(screen.getByText('Compte connecté')).toBeInTheDocument()
  })
})
