import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import BusinessProfilePage from './BusinessProfilePage'
import * as api from '../lib/api'
import { saveBusinessLocations } from '../lib/business-profile'

vi.mock('../lib/api', async (importOriginal) => {
  const actual = await importOriginal<typeof api>()
  return {
    ...actual,
    getCurrentOrganization: vi.fn(),
    listBusinessLocations: vi.fn(),
    createBusinessLocation: vi.fn(),
    deleteBusinessLocation: vi.fn(),
    getGoogleBusinessProfileStatus: vi.fn(),
    getGoogleBusinessProfileAuthorizationUrl: vi.fn(),
    listGoogleBusinessProfileLocations: vi.fn(),
    syncGoogleBusinessProfileLocations: vi.fn(),
    linkGoogleBusinessProfileLocation: vi.fn(),
    unlinkGoogleBusinessProfileLocation: vi.fn(),
    disconnectGoogleBusinessProfile: vi.fn(),
  }
})

const mockedApi = vi.mocked(api)
const organization = { id: 'org-1', name: 'ROBIA', sector: null, city: null, country: 'Madagascar', ownerId: 'user-1', createdAt: '2026-09-21T00:00:00Z' }
const robiaLocation: api.BusinessLocation = { id: 'loc-1', organizationId: 'org-1', name: 'ROBIA Analakely', address: '12 Avenue', city: 'Antananarivo', country: 'Madagascar', phone: '+261340000000', isPrimary: true, status: 'active' }

beforeEach(() => {
  vi.resetAllMocks()
  window.localStorage.clear()
  window.history.replaceState({}, '', '/business-profile')
  mockedApi.getCurrentOrganization.mockResolvedValue(organization)
  mockedApi.listBusinessLocations.mockResolvedValue([robiaLocation])
  mockedApi.getGoogleBusinessProfileStatus.mockResolvedValue({ connected: false, googleAccountEmail: null, connectedAt: null, lastSyncedAt: null, locationCount: 0 })
  mockedApi.listGoogleBusinessProfileLocations.mockResolvedValue([])
})

describe('BusinessProfilePage', () => {
  it('renders the real connected state and maps an imported Google location', async () => {
    mockedApi.getGoogleBusinessProfileStatus.mockResolvedValue({ connected: true, googleAccountEmail: 'owner@example.com', connectedAt: '2026-09-21T08:00:00Z', lastSyncedAt: '2026-09-21T09:00:00Z', locationCount: 1 })
    mockedApi.listGoogleBusinessProfileLocations.mockResolvedValue([{
      id: 'gbp-1', googleAccountName: 'accounts/1', accountDisplayName: 'ROBIA', googleLocationName: 'locations/1', title: 'ROBIA Google', storeCode: null,
      address: { addressLines: ['12 Avenue'], locality: 'Antananarivo', regionCode: 'MG' }, primaryPhone: null, websiteUri: null, primaryCategory: 'Agence marketing', lastSyncedAt: '2026-09-21T09:00:00Z', robiaLocationId: null, robiaLocation: null,
    }])
    mockedApi.linkGoogleBusinessProfileLocation.mockResolvedValue({} as api.GoogleBusinessProfileLocation)

    render(<BusinessProfilePage />)
    await screen.findByText('ROBIA Analakely')
    fireEvent.click(screen.getByRole('button', { name: 'Connecteur Google' }))
    expect(await screen.findByText('ROBIA Google')).toBeInTheDocument()
    expect(screen.getByText('owner@example.com')).toBeInTheDocument()
    expect(screen.getByText(/Mode strictement lecture seule/i)).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Associer à ROBIA'), { target: { value: 'loc-1' } })
    await waitFor(() => expect(mockedApi.linkGoogleBusinessProfileLocation).toHaveBeenCalledWith('gbp-1', 'loc-1'))
  })

  it('migrates legacy browser locations only when the server has none, then clears the cache', async () => {
    mockedApi.listBusinessLocations.mockResolvedValue([])
    mockedApi.createBusinessLocation.mockResolvedValue(robiaLocation)
    saveBusinessLocations([{ id: 'legacy-1', name: 'ROBIA Analakely', address: '12 Avenue', city: 'Antananarivo', country: 'Madagascar', phone: '+261340000000', primary: true }])

    render(<BusinessProfilePage />)
    expect(await screen.findByText(/transférés vers ROBIA/i)).toBeInTheDocument()
    expect(mockedApi.createBusinessLocation).toHaveBeenCalledWith(expect.objectContaining({ name: 'ROBIA Analakely', isPrimary: true }))
    expect(window.localStorage.getItem('robia_business_locations')).toBeNull()
  })

  it('keeps Google writes out of the UI and explains read-only mode', async () => {
    mockedApi.getGoogleBusinessProfileStatus.mockResolvedValue({ connected: true, googleAccountEmail: 'owner@example.com', connectedAt: '2026-09-21T08:00:00Z', lastSyncedAt: null, locationCount: 0 })
    render(<BusinessProfilePage />)
    await screen.findByText('ROBIA Analakely')
    fireEvent.click(screen.getByRole('button', { name: 'Connecteur Google' }))
    expect(await screen.findByText(/importe vos établissements sans modifier vos fiches Google/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /publier|modifier la fiche|répondre/i })).not.toBeInTheDocument()
  })
})
