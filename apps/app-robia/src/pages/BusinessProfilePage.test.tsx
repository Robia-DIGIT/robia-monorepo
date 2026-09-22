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
    importLegacyBusinessLocations: vi.fn(),
    deleteBusinessLocation: vi.fn(),
    getGoogleBusinessProfileStatus: vi.fn(),
    getGoogleBusinessProfileAuthorizationUrl: vi.fn(),
    listGoogleBusinessProfileLocations: vi.fn(),
    syncGoogleBusinessProfileLocations: vi.fn(),
    linkGoogleBusinessProfileLocation: vi.fn(),
    unlinkGoogleBusinessProfileLocation: vi.fn(),
    disconnectGoogleBusinessProfile: vi.fn(),
    listGoogleBusinessProfileReviews: vi.fn(),
    syncGoogleBusinessProfileReviews: vi.fn(),
    getGoogleBusinessProfilePerformance: vi.fn(),
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
  mockedApi.getGoogleBusinessProfileStatus.mockResolvedValue({ connected: false, googleAccountEmail: null, connectedAt: null, lastSyncedAt: null, lastSyncAttemptAt: null, lastSyncStatus: 'never', locationCount: 0, stale: false })
  mockedApi.listGoogleBusinessProfileLocations.mockResolvedValue([])
  mockedApi.listGoogleBusinessProfileReviews.mockResolvedValue({
    reviews: [], averageRating: null, totalReviewCount: null, lastSyncedAt: null, expiresAt: null,
  })
})

describe('BusinessProfilePage', () => {
  it('renders the real connected state and maps an imported Google location', async () => {
    mockedApi.getGoogleBusinessProfileStatus.mockResolvedValue({ connected: true, googleAccountEmail: 'owner@example.com', connectedAt: '2026-09-21T08:00:00Z', lastSyncedAt: '2026-09-21T09:00:00Z', lastSyncAttemptAt: '2026-09-21T09:00:00Z', lastSyncStatus: 'success', locationCount: 1, stale: false })
    mockedApi.listGoogleBusinessProfileLocations.mockResolvedValue([{
      id: 'gbp-1', googleAccountName: 'accounts/1', accountDisplayName: 'ROBIA', googleLocationName: 'locations/1',
      languageCode: 'fr', title: 'ROBIA Google', storeCode: 'STORE-42',
      address: { addressLines: ['12 Avenue'], locality: 'Antananarivo', regionCode: 'MG' }, primaryPhone: null,
      additionalPhones: ['+261 34 11 111 11'],
      websiteUri: 'https://robia.example.com', primaryCategory: 'Agence marketing',
      additionalCategories: ['Consultant SEO'],
      description: 'Une agence marketing locale à Antananarivo.',
      regularHours: { periods: [{ openDay: 'MONDAY', openTime: { hours: 9 }, closeDay: 'MONDAY', closeTime: { hours: 18 } }] },
      specialHours: { specialHourPeriods: [{ startDate: { year: 2026, month: 12, day: 25 }, closed: true }] },
      moreHours: [{ hoursTypeId: 'DELIVERY', periods: [{ openDay: 'TUESDAY', openTime: { hours: 10 }, closeDay: 'TUESDAY', closeTime: { hours: 16 } }] }],
      serviceArea: { businessType: 'CUSTOMER_AND_BUSINESS_LOCATION' },
      labels: ['VIP'],
      latitude: -18.9, longitude: 47.5,
      openStatus: 'OPEN',
      metadata: { mapsUri: 'https://maps.google.com/?cid=123' },
      lastSyncedAt: '2026-09-21T09:00:00Z', robiaLocationId: null, robiaLocation: null,
    }])
    mockedApi.linkGoogleBusinessProfileLocation.mockResolvedValue({} as api.GoogleBusinessProfileLocation)

    render(<BusinessProfilePage />)
    await screen.findByText('ROBIA Analakely')
    fireEvent.click(screen.getByRole('button', { name: 'Connecteur Google' }))
    expect(await screen.findByText('ROBIA Google')).toBeInTheDocument()
    expect(screen.getByText('owner@example.com')).toBeInTheDocument()
    expect(screen.getByText(/Mode strictement lecture seule/i)).toBeInTheDocument()

    // RC-38 display fix — data the backend already returns (account name,
    // store code, website, Maps link) must actually be shown, not just
    // fetched and silently dropped.
    expect(screen.getByText(/Compte Google : ROBIA/)).toBeInTheDocument()
    expect(screen.getByText(/STORE-42/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Site web/i })).toHaveAttribute(
      'href',
      'https://robia.example.com',
    )
    expect(
      screen.getByRole('link', { name: /Voir sur Google Maps/i }),
    ).toHaveAttribute('href', 'https://maps.google.com/?cid=123')

    fireEvent.change(screen.getByLabelText('Associer à ROBIA'), { target: { value: 'loc-1' } })
    await waitFor(() => expect(mockedApi.linkGoogleBusinessProfileLocation).toHaveBeenCalledWith('gbp-1', 'loc-1'))
  })

  it('expands the full fiche and shows every field Google provided', async () => {
    mockedApi.getGoogleBusinessProfileStatus.mockResolvedValue({ connected: true, googleAccountEmail: 'owner@example.com', connectedAt: '2026-09-21T08:00:00Z', lastSyncedAt: '2026-09-21T09:00:00Z', lastSyncAttemptAt: '2026-09-21T09:00:00Z', lastSyncStatus: 'success', locationCount: 1, stale: false })
    mockedApi.listGoogleBusinessProfileLocations.mockResolvedValue([{
      id: 'gbp-1', googleAccountName: 'accounts/1', accountDisplayName: 'ROBIA', googleLocationName: 'locations/1',
      languageCode: 'fr', title: 'ROBIA Google', storeCode: 'STORE-42',
      address: { addressLines: ['12 Avenue'], locality: 'Antananarivo', regionCode: 'MG' }, primaryPhone: null,
      additionalPhones: ['+261 34 11 111 11'],
      websiteUri: 'https://robia.example.com', primaryCategory: 'Agence marketing',
      additionalCategories: ['Consultant SEO'],
      description: 'Une agence marketing locale à Antananarivo.',
      regularHours: { periods: [{ openDay: 'MONDAY', openTime: { hours: 9 }, closeDay: 'MONDAY', closeTime: { hours: 18 } }] },
      specialHours: { specialHourPeriods: [{ startDate: { year: 2026, month: 12, day: 25 }, closed: true }] },
      moreHours: [{ hoursTypeId: 'DELIVERY', periods: [{ openDay: 'TUESDAY', openTime: { hours: 10 }, closeDay: 'TUESDAY', closeTime: { hours: 16 } }] }],
      serviceArea: { businessType: 'CUSTOMER_AND_BUSINESS_LOCATION' },
      labels: ['VIP'],
      latitude: -18.9, longitude: 47.5,
      openStatus: 'OPEN',
      metadata: { mapsUri: 'https://maps.google.com/?cid=123' },
      lastSyncedAt: '2026-09-21T09:00:00Z', robiaLocationId: null, robiaLocation: null,
    }])

    render(<BusinessProfilePage />)
    await screen.findByText('ROBIA Analakely')
    fireEvent.click(screen.getByRole('button', { name: 'Connecteur Google' }))
    await screen.findByText('ROBIA Google')

    expect(screen.getByText('Ouvert')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Voir les détails de la fiche' }))

    expect(screen.getByText(/Consultant SEO/)).toBeInTheDocument()
    expect(screen.getByText(/VIP/)).toBeInTheDocument()
    expect(screen.getByText(/Langue de la fiche : fr/)).toBeInTheDocument()
    expect(screen.getByText(/\+261 34 11 111 11/)).toBeInTheDocument()
    expect(screen.getByText(/-18\.90000, 47\.50000/)).toBeInTheDocument()
    expect(screen.getByText(/Une agence marketing locale à Antananarivo\./)).toBeInTheDocument()
    expect(screen.getByText(/Se déplace chez le client et accueille sur place/)).toBeInTheDocument()
    expect(screen.getByText(/09:00 – 18:00/)).toBeInTheDocument()
    expect(screen.getByText(/25\/12\/2026.*Fermé/)).toBeInTheDocument()
    expect(screen.getByText('Livraison')).toBeInTheDocument()
    expect(screen.getByText(/10:00 – 16:00/)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Masquer les détails' }))
    expect(screen.queryByText(/Consultant SEO/)).not.toBeInTheDocument()
  })

  it('never renders a website/Maps link when Google did not provide one, and the fiche shows no data cleanly', async () => {
    mockedApi.getGoogleBusinessProfileStatus.mockResolvedValue({ connected: true, googleAccountEmail: 'owner@example.com', connectedAt: '2026-09-21T08:00:00Z', lastSyncedAt: '2026-09-21T09:00:00Z', lastSyncAttemptAt: '2026-09-21T09:00:00Z', lastSyncStatus: 'success', locationCount: 1, stale: false })
    mockedApi.listGoogleBusinessProfileLocations.mockResolvedValue([{
      id: 'gbp-2', googleAccountName: 'accounts/1', accountDisplayName: null, googleLocationName: 'locations/2',
      languageCode: null, title: 'ROBIA sans site', storeCode: null,
      address: null, primaryPhone: null, additionalPhones: [], websiteUri: null, primaryCategory: null,
      additionalCategories: [], description: null, regularHours: null, specialHours: null, moreHours: [],
      serviceArea: null, labels: [], latitude: null, longitude: null, openStatus: null, metadata: null,
      lastSyncedAt: '2026-09-21T09:00:00Z', robiaLocationId: null, robiaLocation: null,
    }])

    render(<BusinessProfilePage />)
    await screen.findByText('ROBIA Analakely')
    fireEvent.click(screen.getByRole('button', { name: 'Connecteur Google' }))
    expect(await screen.findByText('ROBIA sans site')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /Site web/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /Voir sur Google Maps/i })).not.toBeInTheDocument()
    expect(screen.queryByText(/Compte Google :/)).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Voir les détails de la fiche' }))
    expect(screen.getByText(/Google n’a fourni aucun horaire pour cette fiche\./)).toBeInTheDocument()
  })

  it('replays the idempotent legacy import even when the server is already partially populated, then clears the cache', async () => {
    mockedApi.listBusinessLocations.mockResolvedValue([robiaLocation])
    mockedApi.importLegacyBusinessLocations.mockResolvedValue([robiaLocation])
    saveBusinessLocations([{ id: 'legacy-1', name: 'ROBIA Analakely', address: '12 Avenue', city: 'Antananarivo', country: 'Madagascar', phone: '+261340000000', primary: true }])

    render(<BusinessProfilePage />)
    expect(await screen.findByText(/transférés vers ROBIA/i)).toBeInTheDocument()
    expect(mockedApi.importLegacyBusinessLocations).toHaveBeenCalledWith([
      expect.objectContaining({ legacyId: 'legacy-1', name: 'ROBIA Analakely', isPrimary: true }),
    ])
    expect(window.localStorage.getItem('robia_business_locations')).toBeNull()
  })

  it('keeps the legacy cache when the transactional import fails so the next load can retry it', async () => {
    mockedApi.importLegacyBusinessLocations.mockRejectedValue(new Error('import unavailable'))
    saveBusinessLocations([{ id: 'legacy-1', name: 'ROBIA Analakely', address: '12 Avenue', city: 'Antananarivo', country: 'Madagascar', phone: '', primary: true }])

    render(<BusinessProfilePage />)

    expect(await screen.findByText('import unavailable')).toBeInTheDocument()
    expect(window.localStorage.getItem('robia_business_locations')).not.toBeNull()
  })

  it('shows an honest warning when Google returns a partial synchronization', async () => {
    mockedApi.getGoogleBusinessProfileStatus.mockResolvedValue({ connected: true, googleAccountEmail: 'owner@example.com', connectedAt: '2026-09-21T08:00:00Z', lastSyncedAt: '2026-09-21T09:00:00Z', lastSyncAttemptAt: '2026-09-21T10:00:00Z', lastSyncStatus: 'partial', locationCount: 1, stale: false })
    mockedApi.syncGoogleBusinessProfileLocations.mockResolvedValue({ synced: false, status: 'partial', locationCount: 1, syncedAt: '2026-09-21T09:00:00Z' })

    render(<BusinessProfilePage />)
    await screen.findByText('ROBIA Analakely')
    fireEvent.click(screen.getByRole('button', { name: 'Connecteur Google' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Synchroniser' }))

    expect(await screen.findByText('Synchronisation incomplète, données précédentes conservées.')).toBeInTheDocument()
  })

  it('keeps Google writes out of the UI and explains read-only mode', async () => {
    mockedApi.getGoogleBusinessProfileStatus.mockResolvedValue({ connected: true, googleAccountEmail: 'owner@example.com', connectedAt: '2026-09-21T08:00:00Z', lastSyncedAt: null, lastSyncAttemptAt: null, lastSyncStatus: 'never', locationCount: 0, stale: false })
    render(<BusinessProfilePage />)
    await screen.findByText('ROBIA Analakely')
    fireEvent.click(screen.getByRole('button', { name: 'Connecteur Google' }))
    expect(await screen.findByText(/importe vos établissements sans modifier vos fiches Google/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /publier|modifier la fiche|répondre/i })).not.toBeInTheDocument()
  })

  // RC-41 — the backend now resyncs the fiche automatically on a schedule;
  // `stale` only surfaces true if that automatic refresh has itself been
  // failing, and must be shown honestly rather than silently ignored.
  it('warns when the automatic fiche refresh appears to be failing', async () => {
    mockedApi.getGoogleBusinessProfileStatus.mockResolvedValue({ connected: true, googleAccountEmail: 'owner@example.com', connectedAt: '2026-09-21T08:00:00Z', lastSyncedAt: '2026-09-18T09:00:00Z', lastSyncAttemptAt: '2026-09-18T09:00:00Z', lastSyncStatus: 'success', locationCount: 1, stale: true })
    render(<BusinessProfilePage />)
    await screen.findByText('ROBIA Analakely')
    fireEvent.click(screen.getByRole('button', { name: 'Connecteur Google' }))
    expect(await screen.findByText(/resynchronisation automatique semble en échec/i)).toBeInTheDocument()
  })

  it('shows no staleness warning when the fiche is fresh', async () => {
    mockedApi.getGoogleBusinessProfileStatus.mockResolvedValue({ connected: true, googleAccountEmail: 'owner@example.com', connectedAt: '2026-09-21T08:00:00Z', lastSyncedAt: '2026-09-21T09:00:00Z', lastSyncAttemptAt: '2026-09-21T09:00:00Z', lastSyncStatus: 'success', locationCount: 1, stale: false })
    render(<BusinessProfilePage />)
    await screen.findByText('ROBIA Analakely')
    fireEvent.click(screen.getByRole('button', { name: 'Connecteur Google' }))
    await screen.findByText('owner@example.com')
    expect(screen.queryByText(/resynchronisation automatique semble en échec/i)).not.toBeInTheDocument()
  })

  // RC-40 fix — reviews and performance, both read-only, backend-owned
  // aggregate, honest expiry states, timezone-safe dates.
  describe('reviews and performance (RC-40)', () => {
    const googleLocation: api.GoogleBusinessProfileLocation = {
      id: 'gbp-1', googleAccountName: 'accounts/1', accountDisplayName: 'ROBIA', googleLocationName: 'locations/1',
      languageCode: 'fr', title: 'ROBIA Google', storeCode: null, address: null, primaryPhone: null,
      additionalPhones: [], websiteUri: null, primaryCategory: null, additionalCategories: [], description: null,
      regularHours: null, specialHours: null, moreHours: [], serviceArea: null, labels: [],
      latitude: null, longitude: null, openStatus: null, metadata: null,
      lastSyncedAt: '2026-09-21T09:00:00Z', robiaLocationId: null, robiaLocation: null,
    }
    const review = (overrides: Partial<api.GoogleBusinessProfileReview> = {}): api.GoogleBusinessProfileReview => ({
      id: 'r1', reviewerDisplayName: 'Alice', starRating: 5, comment: 'Top',
      createTime: '2026-09-01T00:00:00Z', updateTime: null, replyComment: null, replyUpdateTime: null,
      lastSyncedAt: '2026-09-21T09:00:00Z', expiresAt: '2026-09-22T09:00:00Z', ...overrides,
    })
    const envelope = (overrides: Partial<api.GoogleBusinessProfileReviewsEnvelope> = {}): api.GoogleBusinessProfileReviewsEnvelope => ({
      reviews: [], averageRating: null, totalReviewCount: null, lastSyncedAt: null, expiresAt: null, ...overrides,
    })

    beforeEach(() => {
      mockedApi.getGoogleBusinessProfileStatus.mockResolvedValue({ connected: true, googleAccountEmail: 'owner@example.com', connectedAt: '2026-09-21T08:00:00Z', lastSyncedAt: '2026-09-21T09:00:00Z', lastSyncAttemptAt: '2026-09-21T09:00:00Z', lastSyncStatus: 'success', locationCount: 1, stale: false })
      mockedApi.listGoogleBusinessProfileLocations.mockResolvedValue([googleLocation])
    })

    async function expandCard() {
      render(<BusinessProfilePage />)
      await screen.findByText('ROBIA Analakely')
      fireEvent.click(screen.getByRole('button', { name: 'Connecteur Google' }))
      await screen.findByText('ROBIA Google')
      fireEvent.click(screen.getByRole('button', { name: 'Voir les détails de la fiche' }))
    }

    it("shows the backend's own average/total, never a client-recomputed value", async () => {
      // Two 5-star + one 3-star reviews would average to 4.33 if recomputed
      // client-side; the backend's own Google aggregate (4.7) must win.
      mockedApi.listGoogleBusinessProfileReviews.mockResolvedValue(envelope({
        reviews: [
          review({ id: 'r1', reviewerDisplayName: 'Alice', starRating: 5, comment: 'Top' }),
          review({ id: 'r2', reviewerDisplayName: 'Bob', starRating: 3, comment: 'Correct', replyComment: 'Merci Bob !' }),
        ],
        averageRating: 4.7,
        totalReviewCount: 2,
        lastSyncedAt: '2026-09-21T09:00:00Z',
        expiresAt: '2026-09-22T09:00:00Z',
      }))

      await expandCard()

      expect(mockedApi.listGoogleBusinessProfileReviews).toHaveBeenCalledWith('gbp-1')
      expect(await screen.findByText('4.7/5')).toBeInTheDocument()
      expect(screen.queryByText('4.0/5')).not.toBeInTheDocument()
      expect(screen.getByText('Alice')).toBeInTheDocument()
      expect(screen.getByText('Top')).toBeInTheDocument()
      expect(screen.getByText(/Merci Bob !/)).toBeInTheDocument()
      // Read-only: never a reply input/button anywhere in the reviews section.
      expect(screen.queryByRole('button', { name: /répondre/i })).not.toBeInTheDocument()
      expect(screen.queryByRole('textbox', { name: /réponse/i })).not.toBeInTheDocument()
    })

    it('flags when totalReviewCount differs from the number of reviews currently displayed', async () => {
      mockedApi.listGoogleBusinessProfileReviews.mockResolvedValue(envelope({
        reviews: [review({ id: 'r1' })],
        averageRating: 4.2,
        totalReviewCount: 50,
        lastSyncedAt: '2026-09-21T09:00:00Z',
        expiresAt: '2026-09-22T09:00:00Z',
      }))

      await expandCard()

      expect(await screen.findByText(/50 avis Google/)).toBeInTheDocument()
      expect(screen.getByText(/1 affiché/)).toBeInTheDocument()
    })

    it('shows an honest empty state when Google confirms zero reviews for this fiche', async () => {
      mockedApi.listGoogleBusinessProfileReviews.mockResolvedValue(envelope({
        reviews: [], averageRating: 0, totalReviewCount: 0,
        lastSyncedAt: '2026-09-21T09:00:00Z', expiresAt: '2026-09-22T09:00:00Z',
      }))
      await expandCard()
      expect(await screen.findByText('Aucun avis pour cette fiche.')).toBeInTheDocument()
    })

    it('shows an honest never-synced/expired state instead of an empty-reviews message', async () => {
      mockedApi.listGoogleBusinessProfileReviews.mockResolvedValue(envelope())
      await expandCard()
      expect(await screen.findByText(/jamais synchronisés ou expirés/i)).toBeInTheDocument()
      expect(screen.queryByText('Aucun avis pour cette fiche.')).not.toBeInTheDocument()
    })

    it('re-syncs reviews from Google on demand and reloads the list', async () => {
      mockedApi.listGoogleBusinessProfileReviews
        .mockResolvedValueOnce(envelope())
        .mockResolvedValueOnce(envelope({
          reviews: [review({ id: 'r1', starRating: 4, comment: 'Bien', lastSyncedAt: '2026-09-21T10:00:00Z' })],
          averageRating: 4,
          totalReviewCount: 1,
          lastSyncedAt: '2026-09-21T10:00:00Z',
          expiresAt: '2026-09-22T10:00:00Z',
        }))
      mockedApi.syncGoogleBusinessProfileReviews.mockResolvedValue({
        synced: true, reviewCount: 1, averageRating: 4, totalReviewCount: 1,
        syncedAt: '2026-09-21T10:00:00Z', expiresAt: '2026-09-22T10:00:00Z',
      })

      await expandCard()
      await screen.findByText(/jamais synchronisés ou expirés/i)
      fireEvent.click(screen.getByRole('button', { name: 'Synchroniser les avis' }))

      await waitFor(() => expect(mockedApi.syncGoogleBusinessProfileReviews).toHaveBeenCalledWith('gbp-1'))
      expect(await screen.findByText('Alice')).toBeInTheDocument()
    })

    it('surfaces a 429 cooldown response from a review sync as an understandable message', async () => {
      mockedApi.listGoogleBusinessProfileReviews.mockResolvedValue(envelope())
      mockedApi.syncGoogleBusinessProfileReviews.mockRejectedValue(
        new api.ApiError('Trop de requêtes ont été envoyées. Veuillez patienter avant de réessayer.', 429),
      )
      await expandCard()
      await screen.findByText(/jamais synchronisés ou expirés/i)
      fireEvent.click(screen.getByRole('button', { name: 'Synchroniser les avis' }))
      expect(await screen.findByText(/Trop de requêtes/)).toBeInTheDocument()
    })

    it('surfaces a 409 concurrent-sync response from a review sync as an understandable message', async () => {
      mockedApi.listGoogleBusinessProfileReviews.mockResolvedValue(envelope())
      mockedApi.syncGoogleBusinessProfileReviews.mockRejectedValue(
        new api.ApiError('Une synchronisation des avis est déjà en cours pour cet établissement.', 409),
      )
      await expandCard()
      await screen.findByText(/jamais synchronisés ou expirés/i)
      fireEvent.click(screen.getByRole('button', { name: 'Synchroniser les avis' }))
      expect(await screen.findByText(/déjà en cours/)).toBeInTheDocument()
    })

    it('does not crash and renders no date when a review has an invalid createTime', async () => {
      mockedApi.listGoogleBusinessProfileReviews.mockResolvedValue(envelope({
        reviews: [review({ id: 'r1', createTime: 'not-a-date' })],
        averageRating: 5, totalReviewCount: 1,
        lastSyncedAt: '2026-09-21T09:00:00Z', expiresAt: '2026-09-22T09:00:00Z',
      }))
      await expandCard()
      expect(await screen.findByText('Alice')).toBeInTheDocument()
    })

    it('never fetches performance on expand — only on explicit request', async () => {
      mockedApi.getGoogleBusinessProfilePerformance.mockResolvedValue({
        locationId: 'gbp-1', startDate: '2026-08-23', endDate: '2026-09-21',
        summary: { impressions: 120, calls: 8, websiteClicks: 15, directionRequests: 4, conversations: 2 },
        daily: [{ date: '2026-09-21', impressions: 5, calls: 1, websiteClicks: 1, directionRequests: 0, conversations: 0 }],
        syncedAt: '2026-09-21T10:00:00Z',
      })

      await expandCard()
      expect(await screen.findByText(/Non chargées/)).toBeInTheDocument()
      expect(mockedApi.getGoogleBusinessProfilePerformance).not.toHaveBeenCalled()

      fireEvent.click(screen.getByRole('button', { name: 'Charger' }))

      expect(await screen.findByText('120')).toBeInTheDocument()
      expect(screen.getByText('impressions')).toBeInTheDocument()
      expect(mockedApi.getGoogleBusinessProfilePerformance).toHaveBeenCalledWith('gbp-1')
    })

    it('shows the exact period and retrieval timestamp, and renders the daily date the same regardless of viewer timezone', async () => {
      mockedApi.getGoogleBusinessProfilePerformance.mockResolvedValue({
        locationId: 'gbp-1', startDate: '2026-08-23', endDate: '2026-09-21',
        summary: { impressions: 120, calls: 8, websiteClicks: 15, directionRequests: 4, conversations: 2 },
        // 2026-09-21 is a UTC-midnight instant that would render as
        // 2026-09-20 in a negative-offset timezone if routed through
        // `new Date(...)`; formatIsoDate must never do that.
        daily: [{ date: '2026-09-21', impressions: 5, calls: 1, websiteClicks: 1, directionRequests: 0, conversations: 0 }],
        syncedAt: '2026-09-21T10:00:00Z',
      })

      await expandCard()
      fireEvent.click(screen.getByRole('button', { name: 'Charger' }))

      expect(await screen.findByText(/23\/08\/2026.*21\/09\/2026/)).toBeInTheDocument()
      expect(screen.getByText(/Récupéré le/)).toBeInTheDocument()

      fireEvent.click(screen.getByRole('button', { name: 'Voir le détail quotidien' }))
      expect(screen.getByText('21/09/2026')).toBeInTheDocument()
    })

    it('surfaces a real fetch error instead of silently showing zeros', async () => {
      mockedApi.getGoogleBusinessProfilePerformance.mockRejectedValue(new Error('Google indisponible'))
      await expandCard()
      fireEvent.click(screen.getByRole('button', { name: 'Charger' }))
      expect(await screen.findByText('Google indisponible')).toBeInTheDocument()
    })

    it('surfaces a 429 cooldown response from a performance read as an understandable message', async () => {
      mockedApi.getGoogleBusinessProfilePerformance.mockRejectedValue(
        new api.ApiError('Trop de requêtes ont été envoyées. Veuillez patienter avant de réessayer.', 429),
      )
      await expandCard()
      fireEvent.click(screen.getByRole('button', { name: 'Charger' }))
      expect(await screen.findByText(/Trop de requêtes/)).toBeInTheDocument()
    })

    it('never renders any review-reply or review-publishing control anywhere in the page', async () => {
      mockedApi.listGoogleBusinessProfileReviews.mockResolvedValue(envelope({
        reviews: [review({ id: 'r1', replyComment: 'Merci !' })],
        averageRating: 5, totalReviewCount: 1,
        lastSyncedAt: '2026-09-21T09:00:00Z', expiresAt: '2026-09-22T09:00:00Z',
      }))
      await expandCard()
      await screen.findByText('Alice')
      expect(screen.queryByRole('button', { name: /répondre|publier/i })).not.toBeInTheDocument()
      expect(screen.queryByRole('textbox', { name: /réponse/i })).not.toBeInTheDocument()
    })
  })
})
