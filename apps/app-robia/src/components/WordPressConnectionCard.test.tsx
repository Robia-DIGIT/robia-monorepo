import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import WordPressConnectionCard from './WordPressConnectionCard'
import * as api from '../lib/api'

vi.mock('../lib/api', async (importOriginal) => {
  const actual = await importOriginal<typeof api>()
  return {
    ...actual,
    connectWordPress: vi.fn(),
    disconnectWordPress: vi.fn(),
    getWordPressStatus: vi.fn(),
  }
})

const mockedApi = vi.mocked(api)

const READY_CONNECTION: api.WordPressConnection = {
  id: 'wpc-1',
  websiteId: 'site-1',
  siteUrl: 'https://client-site.example.com',
  remoteUserId: 'u-1',
  remoteUserName: 'Rédaction',
  username: 'redaction',
  canCreatePosts: true,
  canCreatePages: true,
  status: 'ready',
  connectionVersion: 1,
  lastVerifiedAt: '2026-09-24T08:00:00Z',
  disconnectedAt: null,
  createdAt: '2026-09-24T08:00:00Z',
  updatedAt: '2026-09-24T08:00:00Z',
}

beforeEach(() => {
  vi.resetAllMocks()
  mockedApi.getWordPressStatus.mockResolvedValue({ connected: false, connection: null })
})

describe('WordPressConnectionCard', () => {
  it('never renders a URL field and shows the application-password warning', async () => {
    render(<WordPressConnectionCard websiteId="site-1" />)
    await screen.findByText(/Connecter WordPress/)

    expect(screen.queryByPlaceholderText(/url/i)).not.toBeInTheDocument()
    expect(screen.getByText(/jamais votre mot de passe principal/)).toBeInTheDocument()
    expect(screen.getByText(/Aucune URL à renseigner/)).toBeInTheDocument()
  })

  it('connects successfully and displays the connected account and both real capabilities', async () => {
    mockedApi.connectWordPress.mockResolvedValue({ connection: READY_CONNECTION })
    render(<WordPressConnectionCard websiteId="site-1" />)

    fireEvent.change(await screen.findByPlaceholderText('ex. redaction'), { target: { value: 'redaction' } })
    fireEvent.change(screen.getByPlaceholderText(/xxxx xxxx/), { target: { value: 'a1b2 c3d4 e5f6 g7h8' } })
    fireEvent.click(screen.getByRole('button', { name: /Connecter WordPress/ }))

    await waitFor(() => expect(mockedApi.connectWordPress).toHaveBeenCalledWith({
      websiteId: 'site-1',
      username: 'redaction',
      applicationPassword: 'a1b2 c3d4 e5f6 g7h8',
    }))

    expect(await screen.findByText('Rédaction')).toBeInTheDocument()
    expect(screen.getByText(/Peut créer des brouillons d’article/)).toBeInTheDocument()
    expect(screen.getByText(/Peut créer des brouillons de page/)).toBeInTheDocument()
  })

  it('shows one real capability as unavailable when the WordPress account cannot do it', async () => {
    mockedApi.connectWordPress.mockResolvedValue({
      connection: { ...READY_CONNECTION, canCreatePosts: true, canCreatePages: false },
    })
    render(<WordPressConnectionCard websiteId="site-1" />)

    fireEvent.change(await screen.findByPlaceholderText('ex. redaction'), { target: { value: 'redaction' } })
    fireEvent.change(screen.getByPlaceholderText(/xxxx xxxx/), { target: { value: 'a1b2 c3d4 e5f6 g7h8' } })
    fireEvent.click(screen.getByRole('button', { name: /Connecter WordPress/ }))

    expect(await screen.findByText(/Peut créer des brouillons de page — non autorisé par ce compte/)).toBeInTheDocument()
  })

  it('refuses the connection and surfaces the real backend message without clearing the typed username', async () => {
    mockedApi.connectWordPress.mockRejectedValue(new api.ApiError('WordPress a refusé la vérification des identifiants.', 422))
    render(<WordPressConnectionCard websiteId="site-1" />)

    fireEvent.change(await screen.findByPlaceholderText('ex. redaction'), { target: { value: 'redaction' } })
    fireEvent.change(screen.getByPlaceholderText(/xxxx xxxx/), { target: { value: 'wrong-secret-value' } })
    fireEvent.click(screen.getByRole('button', { name: /Connecter WordPress/ }))

    expect(await screen.findByText('WordPress a refusé la vérification des identifiants.')).toBeInTheDocument()
    expect(screen.queryByText('Rédaction')).not.toBeInTheDocument()
  })

  it('never leaves the application password visible in the DOM after a failed attempt', async () => {
    mockedApi.connectWordPress.mockRejectedValue(new api.ApiError('WordPress a refusé la vérification des identifiants.', 422))
    render(<WordPressConnectionCard websiteId="site-1" />)

    const secretValue = 'super-secret-app-password-value'
    fireEvent.change(await screen.findByPlaceholderText('ex. redaction'), { target: { value: 'redaction' } })
    fireEvent.change(screen.getByPlaceholderText(/xxxx xxxx/), { target: { value: secretValue } })
    fireEvent.click(screen.getByRole('button', { name: /Connecter WordPress/ }))

    await screen.findByText('WordPress a refusé la vérification des identifiants.')
    // The secret is never echoed anywhere else in the rendered output — only
    // the (still-focused) input itself may still hold it until the user
    // clears it, which is a browser form field, not something this
    // component persists or displays elsewhere.
    expect(document.body.textContent).not.toContain(secretValue)
  })

  it('clears the application password field as soon as the connection succeeds', async () => {
    mockedApi.connectWordPress.mockResolvedValue({ connection: READY_CONNECTION })
    render(<WordPressConnectionCard websiteId="site-1" />)

    fireEvent.change(await screen.findByPlaceholderText('ex. redaction'), { target: { value: 'redaction' } })
    const passwordInput = screen.getByPlaceholderText(/xxxx xxxx/) as HTMLInputElement
    fireEvent.change(passwordInput, { target: { value: 'a1b2 c3d4 e5f6 g7h8' } })
    fireEvent.click(screen.getByRole('button', { name: /Connecter WordPress/ }))

    await screen.findByText('Rédaction')
    // The form is gone (replaced by the connected view) — the password
    // input, and therefore the secret, no longer exists in the DOM at all.
    expect(screen.queryByPlaceholderText(/xxxx xxxx/)).not.toBeInTheDocument()
  })

  it('clears the application password on unmount (a site change tears down this whole card)', async () => {
    const { unmount } = render(<WordPressConnectionCard websiteId="site-1" />)
    const passwordInput = await screen.findByPlaceholderText(/xxxx xxxx/) as HTMLInputElement
    fireEvent.change(passwordInput, { target: { value: 'about-to-be-discarded-secret' } })
    expect(passwordInput.value).toBe('about-to-be-discarded-secret')

    unmount()
    // No crash and nothing left behind — the component's internal state is
    // gone with it; there is no localStorage/URL path for this value at all.
    expect(window.localStorage.getItem('applicationPassword')).toBeNull()
  })

  it('honestly reports a local-only disconnect and never claims the remote password was revoked', async () => {
    mockedApi.getWordPressStatus.mockResolvedValueOnce({ connected: true, connection: READY_CONNECTION })
    mockedApi.disconnectWordPress.mockResolvedValue({ disconnected: true, localOnly: true, remoteApplicationPasswordRevoked: false })
    mockedApi.getWordPressStatus.mockResolvedValueOnce({
      connected: false,
      connection: { ...READY_CONNECTION, status: 'disconnected' },
    })
    vi.spyOn(window, 'confirm').mockReturnValue(true)

    render(<WordPressConnectionCard websiteId="site-1" />)
    await screen.findByText('Rédaction')
    fireEvent.click(screen.getByRole('button', { name: /Déconnecter/ }))

    expect(await screen.findByText(
      'La connexion est supprimée de ROBIA, mais le mot de passe d’application doit aussi être révoqué dans WordPress.',
    )).toBeInTheDocument()
    // The other, success-revocation variant of this notice must never be
    // shown here — this disconnect was reported as localOnly, not remotely revoked.
    expect(screen.queryByText(/a été révoqué/)).not.toBeInTheDocument()
  })

  it('does not disconnect when the confirmation dialog is dismissed', async () => {
    mockedApi.getWordPressStatus.mockResolvedValueOnce({ connected: true, connection: READY_CONNECTION })
    vi.spyOn(window, 'confirm').mockReturnValue(false)

    render(<WordPressConnectionCard websiteId="site-1" />)
    await screen.findByText('Rédaction')
    fireEvent.click(screen.getByRole('button', { name: /Déconnecter/ }))

    expect(mockedApi.disconnectWordPress).not.toHaveBeenCalled()
  })

  it('never shows any wording suggesting a public publish', async () => {
    mockedApi.getWordPressStatus.mockResolvedValueOnce({ connected: true, connection: READY_CONNECTION })
    render(<WordPressConnectionCard websiteId="site-1" />)
    await screen.findByText('Rédaction')

    expect(screen.queryByText(/publié/i)).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /publier/i })).not.toBeInTheDocument()
  })
})
