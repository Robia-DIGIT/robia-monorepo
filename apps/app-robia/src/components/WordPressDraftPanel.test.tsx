import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import WordPressDraftPanel from './WordPressDraftPanel'
import * as api from '../lib/api'

vi.mock('../lib/api', async (importOriginal) => {
  const actual = await importOriginal<typeof api>()
  return {
    ...actual,
    getWordPressStatus: vi.fn(),
    approveWordPressDraft: vi.fn(),
    createWordPressDraft: vi.fn(),
    reconcileWordPressDraft: vi.fn(),
    listWordPressAttempts: vi.fn(),
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

const DOCUMENT: api.DocumentItem = {
  id: 'doc-1',
  opportunityId: 'opp-1',
  type: 'local_page',
  title: 'Nouvelle page locale',
  content: 'Contenu du brouillon.',
  actionItemId: 'action-1',
  revision: 3,
}

type ActionWithWorkflow = api.ActionItem & { approvalStatus: string; executionStatus: string }

function approvedReadyAction(overrides: Partial<ActionWithWorkflow> = {}): ActionWithWorkflow {
  return {
    id: 'action-1',
    opportunityId: 'opp-1',
    title: 'Publier la page locale',
    status: 'in_progress',
    priority: 'high',
    dueDate: null,
    approvalStatus: 'approved',
    executionStatus: 'ready',
    ...overrides,
  }
}

const APPROVAL: api.WordPressDraftApproval = {
  id: 'approval-1',
  documentId: 'doc-1',
  actionItemId: 'action-1',
  documentRevision: 3,
  postType: 'post',
  contentDigest: 'digest',
  operationKey: 'op-1',
  connectionVersion: 1,
  revokedAt: null,
  createdAt: '2026-09-24T08:00:00Z',
}

const CONFIRMED_ATTEMPT: api.WordPressDraftAttempt = {
  id: 'attempt-1',
  approvalId: 'approval-1',
  documentId: 'doc-1',
  actionItemId: 'action-1',
  documentRevision: 3,
  status: 'confirmed',
  remotePostId: '42',
  remoteUrl: 'https://client-site.example.com/?p=42',
  remoteEditorUrl: 'https://client-site.example.com/wp-admin/post.php?post=42&action=edit',
  errorCode: null,
  createdAt: '2026-09-24T08:05:00Z',
  updatedAt: '2026-09-24T08:05:00Z',
  confirmedAt: '2026-09-24T08:05:00Z',
}

const UNKNOWN_ATTEMPT: api.WordPressDraftAttempt = {
  ...CONFIRMED_ATTEMPT,
  status: 'unknown',
  remotePostId: null,
  remoteUrl: null,
  remoteEditorUrl: null,
  errorCode: 'wordpress_http_503',
  confirmedAt: null,
}

// Confirmed for an OLDER revision of the same document/Action — must never
// be shown as the state of the document's current revision (3).
const STALE_REVISION_ATTEMPT: api.WordPressDraftAttempt = {
  ...CONFIRMED_ATTEMPT,
  id: 'attempt-stale',
  approvalId: 'approval-stale',
  documentRevision: 2,
}

beforeEach(() => {
  vi.resetAllMocks()
  mockedApi.getWordPressStatus.mockResolvedValue({ connected: true, connection: READY_CONNECTION })
})

describe('WordPressDraftPanel', () => {
  it('renders nothing when there is no linked Action', () => {
    const { container } = render(
      <WordPressDraftPanel websiteId="site-1" document={DOCUMENT} actionItem={null} />,
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('blocks the flow when the Action is not approved and ready', async () => {
    render(
      <WordPressDraftPanel
        websiteId="site-1"
        document={DOCUMENT}
        actionItem={approvedReadyAction({ approvalStatus: 'pending' })}
      />,
    )
    expect(await screen.findByText(/doit d’abord être approuvée et prête/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Autoriser et créer le brouillon/ })).not.toBeInTheDocument()
    expect(mockedApi.getWordPressStatus).not.toHaveBeenCalled()
  })

  it('shows a configuration message when WordPress is not connected for the site', async () => {
    mockedApi.getWordPressStatus.mockResolvedValue({ connected: false, connection: null })
    render(<WordPressDraftPanel websiteId="site-1" document={DOCUMENT} actionItem={approvedReadyAction()} />)

    expect(await screen.findByText(/WordPress n’est pas connecté pour ce site/)).toBeInTheDocument()
  })

  it('shows the confirmation with real capabilities for Article and Page', async () => {
    render(<WordPressDraftPanel websiteId="site-1" document={DOCUMENT} actionItem={approvedReadyAction()} />)

    expect(await screen.findByRole('button', { name: 'Article' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Page' })).toBeEnabled()
    expect(screen.getByText('https://client-site.example.com')).toBeInTheDocument()
    expect(screen.getByText('Nouvelle page locale')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText('Un brouillon sera créé. Rien ne sera publié automatiquement.')).toBeInTheDocument()
  })

  it('restores an existing confirmed attempt for the document’s current revision on mount, with no click needed', async () => {
    mockedApi.listWordPressAttempts.mockResolvedValueOnce([CONFIRMED_ATTEMPT]) // documentRevision: 3, matches DOCUMENT.revision

    render(<WordPressDraftPanel websiteId="site-1" document={DOCUMENT} actionItem={approvedReadyAction()} />)

    expect(await screen.findByText('Brouillon créé sur WordPress.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Autoriser et créer le brouillon/ })).not.toBeInTheDocument()
  })

  it('ignores an attempt found on mount for an older document revision and still offers the confirm form', async () => {
    mockedApi.listWordPressAttempts.mockResolvedValueOnce([STALE_REVISION_ATTEMPT]) // documentRevision: 2, DOCUMENT.revision is 3

    render(<WordPressDraftPanel websiteId="site-1" document={DOCUMENT} actionItem={approvedReadyAction()} />)

    expect(await screen.findByRole('button', { name: /Autoriser et créer le brouillon/ })).toBeInTheDocument()
    expect(screen.queryByText('Brouillon créé sur WordPress.')).not.toBeInTheDocument()
  })

  it('disables selecting a post type the connected account cannot create', async () => {
    mockedApi.getWordPressStatus.mockResolvedValue({
      connected: true,
      connection: { ...READY_CONNECTION, canCreatePosts: true, canCreatePages: false },
    })
    render(<WordPressDraftPanel websiteId="site-1" document={DOCUMENT} actionItem={approvedReadyAction()} />)

    expect(await screen.findByRole('button', { name: 'Page' })).toBeDisabled()
  })

  it('shows a message when the account can create neither posts nor pages', async () => {
    mockedApi.getWordPressStatus.mockResolvedValue({
      connected: true,
      connection: { ...READY_CONNECTION, canCreatePosts: false, canCreatePages: false },
    })
    render(<WordPressDraftPanel websiteId="site-1" document={DOCUMENT} actionItem={approvedReadyAction()} />)

    expect(await screen.findByText(/ne peut créer ni brouillon d’article ni brouillon de page/)).toBeInTheDocument()
  })

  it('approves then creates the draft with a stable idempotencyKey, and reloads attempts for the canonical result', async () => {
    mockedApi.approveWordPressDraft.mockResolvedValue({ approval: APPROVAL, idempotent: false })
    mockedApi.createWordPressDraft.mockResolvedValue({
      attempt: { id: 'attempt-1', status: 'confirmed', remotePostId: '42', remoteUrl: null, remoteEditorUrl: null },
      idempotent: false,
    })
    mockedApi.listWordPressAttempts
      .mockResolvedValueOnce([]) // no existing attempt yet when the panel mounts
      .mockResolvedValueOnce([CONFIRMED_ATTEMPT])

    render(<WordPressDraftPanel websiteId="site-1" document={DOCUMENT} actionItem={approvedReadyAction()} />)
    fireEvent.click(await screen.findByRole('button', { name: /Autoriser et créer le brouillon/ }))

    await waitFor(() => expect(mockedApi.approveWordPressDraft).toHaveBeenCalledWith({
      websiteId: 'site-1',
      documentId: 'doc-1',
      actionItemId: 'action-1',
      expectedRevision: 3,
      postType: 'post',
    }))
    await waitFor(() => expect(mockedApi.createWordPressDraft).toHaveBeenCalledTimes(1))
    const [[createPayload]] = mockedApi.createWordPressDraft.mock.calls
    expect(createPayload.approvalId).toBe('approval-1')
    expect(typeof createPayload.idempotencyKey).toBe('string')
    expect(createPayload.idempotencyKey.length).toBeGreaterThan(0)

    expect(await screen.findByText('Brouillon créé sur WordPress.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Ouvrir le brouillon dans l’éditeur WordPress/ })).toHaveAttribute(
      'href',
      CONFIRMED_ATTEMPT.remoteEditorUrl,
    )
    expect(screen.getByText('Cette création a été enregistrée comme preuve pour l’Action liée.')).toBeInTheDocument()
  })

  it('ignores a second click while the first authorize-and-create request is in flight', async () => {
    let resolveApprove: (value: api.WordPressApproveDraftResult) => void = () => {}
    mockedApi.approveWordPressDraft.mockReturnValue(
      new Promise((resolve) => { resolveApprove = resolve }),
    )

    render(<WordPressDraftPanel websiteId="site-1" document={DOCUMENT} actionItem={approvedReadyAction()} />)
    const button = await screen.findByRole('button', { name: /Autoriser et créer le brouillon/ })
    fireEvent.click(button)
    fireEvent.click(button)
    fireEvent.click(button)

    expect(mockedApi.approveWordPressDraft).toHaveBeenCalledTimes(1)
    resolveApprove({ approval: APPROVAL, idempotent: false })
  })

  it('surfaces a stale-revision 409 from approveDraft and never calls createDraft', async () => {
    mockedApi.approveWordPressDraft.mockRejectedValue(
      new api.ApiError('Le document a changé. Rechargez-le avant de l’approuver.', 409),
    )

    render(<WordPressDraftPanel websiteId="site-1" document={DOCUMENT} actionItem={approvedReadyAction()} />)
    fireEvent.click(await screen.findByRole('button', { name: /Autoriser et créer le brouillon/ }))

    expect(await screen.findByText('Le document a changé. Rechargez-le avant de l’approuver.')).toBeInTheDocument()
    expect(mockedApi.createWordPressDraft).not.toHaveBeenCalled()
    // Nothing was ever sent to WordPress — the confirm button is available again.
    expect(await screen.findByRole('button', { name: /Autoriser et créer le brouillon/ })).toBeEnabled()
  })

  it('treats a 422 from createDraft as a definite failure and never re-sends the same request', async () => {
    mockedApi.approveWordPressDraft.mockResolvedValue({ approval: APPROVAL, idempotent: false })
    mockedApi.createWordPressDraft.mockRejectedValue(
      new api.ApiError('WordPress a refusé le brouillon (HTTP 400).', 422),
    )
    mockedApi.listWordPressAttempts.mockResolvedValue([])

    render(<WordPressDraftPanel websiteId="site-1" document={DOCUMENT} actionItem={approvedReadyAction()} />)
    fireEvent.click(await screen.findByRole('button', { name: /Autoriser et créer le brouillon/ }))

    expect(await screen.findByText('WordPress a refusé le brouillon (HTTP 400).')).toBeInTheDocument()
    expect(mockedApi.createWordPressDraft).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('button', { name: /Autoriser et créer le brouillon/ })).not.toBeInTheDocument()
  })

  it('treats a 409 from createDraft (binding changed before dispatch) as a definite failure', async () => {
    mockedApi.approveWordPressDraft.mockResolvedValue({ approval: APPROVAL, idempotent: false })
    mockedApi.createWordPressDraft.mockRejectedValue(
      new api.ApiError('Le document ou la connexion a changé avant l’envoi.', 409),
    )
    mockedApi.listWordPressAttempts.mockResolvedValue([])

    render(<WordPressDraftPanel websiteId="site-1" document={DOCUMENT} actionItem={approvedReadyAction()} />)
    fireEvent.click(await screen.findByRole('button', { name: /Autoriser et créer le brouillon/ }))

    expect(await screen.findByText('Le document ou la connexion a changé avant l’envoi.')).toBeInTheDocument()
    expect(mockedApi.createWordPressDraft).toHaveBeenCalledTimes(1)
  })

  it('on a 409 from createDraft caused by an existing unresolved attempt, offers reconciliation instead of a false refusal', async () => {
    mockedApi.approveWordPressDraft.mockResolvedValue({ approval: APPROVAL, idempotent: false })
    mockedApi.createWordPressDraft.mockRejectedValue(
      new api.ApiError('Une tentative existe déjà et doit être réconciliée avant toute suite.', 409),
    )
    mockedApi.listWordPressAttempts
      .mockResolvedValueOnce([]) // no existing attempt yet when the panel mounts
      .mockResolvedValueOnce([UNKNOWN_ATTEMPT]) // the canonical attempt this exact approval already has

    render(<WordPressDraftPanel websiteId="site-1" document={DOCUMENT} actionItem={approvedReadyAction()} />)
    fireEvent.click(await screen.findByRole('button', { name: /Autoriser et créer le brouillon/ }))

    expect(await screen.findByText('Résultat à vérifier')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Vérifier dans WordPress/ })).toBeInTheDocument()
    // The 409's own message is never shown as a refusal — the canonical attempt's real state is.
    expect(screen.queryByText('Une tentative existe déjà et doit être réconciliée avant toute suite.')).not.toBeInTheDocument()
    expect(mockedApi.createWordPressDraft).toHaveBeenCalledTimes(1)
  })

  it('on a 503 from createDraft, moves to the unknown phase and never issues a second POST /drafts', async () => {
    mockedApi.approveWordPressDraft.mockResolvedValue({ approval: APPROVAL, idempotent: false })
    mockedApi.createWordPressDraft.mockRejectedValue(
      new api.ApiError('Réponse WordPress ambiguë. Une réconciliation est requise.', 503),
    )
    mockedApi.listWordPressAttempts
      .mockResolvedValueOnce([]) // no existing attempt yet when the panel mounts
      .mockResolvedValueOnce([UNKNOWN_ATTEMPT])

    render(<WordPressDraftPanel websiteId="site-1" document={DOCUMENT} actionItem={approvedReadyAction()} />)
    fireEvent.click(await screen.findByRole('button', { name: /Autoriser et créer le brouillon/ }))

    expect(await screen.findByText('Résultat à vérifier')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Vérifier dans WordPress/ })).toBeInTheDocument()
    expect(mockedApi.createWordPressDraft).toHaveBeenCalledTimes(1)
    // No automatic replay, and no way left in this UI to trigger another one.
    expect(screen.queryByRole('button', { name: /Autoriser et créer le brouillon/ })).not.toBeInTheDocument()
  })

  it('on a network/timeout failure from createDraft, also moves to unknown rather than assuming success or failure', async () => {
    mockedApi.approveWordPressDraft.mockResolvedValue({ approval: APPROVAL, idempotent: false })
    mockedApi.createWordPressDraft.mockRejectedValue(new Error('Impossible de contacter le serveur ROBIA.'))
    mockedApi.listWordPressAttempts
      .mockResolvedValueOnce([]) // no existing attempt yet when the panel mounts
      .mockResolvedValueOnce([UNKNOWN_ATTEMPT])

    render(<WordPressDraftPanel websiteId="site-1" document={DOCUMENT} actionItem={approvedReadyAction()} />)
    fireEvent.click(await screen.findByRole('button', { name: /Autoriser et créer le brouillon/ }))

    expect(await screen.findByText('Résultat à vérifier')).toBeInTheDocument()
    expect(mockedApi.createWordPressDraft).toHaveBeenCalledTimes(1)
  })

  it('an unknown attempt only ever calls /reconcile, never a fresh /drafts POST', async () => {
    mockedApi.approveWordPressDraft.mockResolvedValue({ approval: APPROVAL, idempotent: false })
    mockedApi.createWordPressDraft.mockRejectedValue(new api.ApiError('Réponse WordPress ambiguë.', 503))
    mockedApi.listWordPressAttempts
      .mockResolvedValueOnce([]) // no existing attempt yet when the panel mounts
      .mockResolvedValueOnce([UNKNOWN_ATTEMPT])
    mockedApi.reconcileWordPressDraft.mockResolvedValue({ attemptId: 'attempt-1', status: 'unknown', found: false })

    render(<WordPressDraftPanel websiteId="site-1" document={DOCUMENT} actionItem={approvedReadyAction()} />)
    fireEvent.click(await screen.findByRole('button', { name: /Autoriser et créer le brouillon/ }))
    fireEvent.click(await screen.findByRole('button', { name: /Vérifier dans WordPress/ }))

    await waitFor(() => expect(mockedApi.reconcileWordPressDraft).toHaveBeenCalledWith('attempt-1'))
    expect(mockedApi.createWordPressDraft).toHaveBeenCalledTimes(1)
    expect(await screen.findByText(/vérification humaine est nécessaire/)).toBeInTheDocument()
  })

  it('a reconciliation that finds the draft moves the panel to confirmed', async () => {
    mockedApi.approveWordPressDraft.mockResolvedValue({ approval: APPROVAL, idempotent: false })
    mockedApi.createWordPressDraft.mockRejectedValue(new api.ApiError('Réponse WordPress ambiguë.', 503))
    mockedApi.listWordPressAttempts
      .mockResolvedValueOnce([]) // no existing attempt yet when the panel mounts
      .mockResolvedValueOnce([UNKNOWN_ATTEMPT])
      .mockResolvedValueOnce([CONFIRMED_ATTEMPT])
    mockedApi.reconcileWordPressDraft.mockResolvedValue({ attempt: CONFIRMED_ATTEMPT, idempotent: false })

    render(<WordPressDraftPanel websiteId="site-1" document={DOCUMENT} actionItem={approvedReadyAction()} />)
    fireEvent.click(await screen.findByRole('button', { name: /Autoriser et créer le brouillon/ }))
    fireEvent.click(await screen.findByRole('button', { name: /Vérifier dans WordPress/ }))

    expect(await screen.findByText('Brouillon créé sur WordPress.')).toBeInTheDocument()
  })

  it('does not crash and never sends a second POST /drafts when the panel unmounts mid-request (site change)', async () => {
    let resolveCreate: (value: api.WordPressCreateDraftResult) => void = () => {}
    mockedApi.approveWordPressDraft.mockResolvedValue({ approval: APPROVAL, idempotent: false })
    mockedApi.createWordPressDraft.mockReturnValue(new Promise((resolve) => { resolveCreate = resolve }))

    const { unmount } = render(<WordPressDraftPanel websiteId="site-1" document={DOCUMENT} actionItem={approvedReadyAction()} />)
    fireEvent.click(await screen.findByRole('button', { name: /Autoriser et créer le brouillon/ }))
    await waitFor(() => expect(mockedApi.createWordPressDraft).toHaveBeenCalledTimes(1))

    unmount()
    resolveCreate({ attempt: { id: 'attempt-1', status: 'confirmed', remotePostId: '42', remoteUrl: null, remoteEditorUrl: null }, idempotent: false })
    await Promise.resolve()

    expect(mockedApi.createWordPressDraft).toHaveBeenCalledTimes(1)
  })

  it('reloads a fresh connection when re-rendered for a different website (a site change)', async () => {
    const { rerender } = render(<WordPressDraftPanel websiteId="site-1" document={DOCUMENT} actionItem={approvedReadyAction()} />)
    await screen.findByRole('button', { name: /Autoriser et créer le brouillon/ })
    expect(mockedApi.getWordPressStatus).toHaveBeenCalledWith('site-1')

    mockedApi.getWordPressStatus.mockResolvedValue({ connected: false, connection: null })
    rerender(<WordPressDraftPanel websiteId="site-2" document={DOCUMENT} actionItem={approvedReadyAction()} />)

    await waitFor(() => expect(mockedApi.getWordPressStatus).toHaveBeenCalledWith('site-2'))
    expect(await screen.findByText(/WordPress n’est pas connecté pour ce site/)).toBeInTheDocument()
  })

  it('reports an invalid site/organization context on a 404', async () => {
    mockedApi.getWordPressStatus.mockRejectedValue(new api.ApiError('not found', 404))
    render(<WordPressDraftPanel websiteId="site-1" document={DOCUMENT} actionItem={approvedReadyAction()} />)

    expect(await screen.findByText(/n’est plus valide pour cette opération/)).toBeInTheDocument()
  })

  it('never shows any wording or button suggesting a public publish, in any phase', async () => {
    mockedApi.approveWordPressDraft.mockResolvedValue({ approval: APPROVAL, idempotent: false })
    mockedApi.createWordPressDraft.mockResolvedValue({
      attempt: { id: 'attempt-1', status: 'confirmed', remotePostId: '42', remoteUrl: null, remoteEditorUrl: null },
      idempotent: false,
    })
    mockedApi.listWordPressAttempts
      .mockResolvedValueOnce([]) // no existing attempt yet when the panel mounts
      .mockResolvedValueOnce([CONFIRMED_ATTEMPT])

    render(<WordPressDraftPanel websiteId="site-1" document={DOCUMENT} actionItem={approvedReadyAction()} />)
    fireEvent.click(await screen.findByRole('button', { name: /Autoriser et créer le brouillon/ }))
    await screen.findByText('Brouillon créé sur WordPress.')

    expect(screen.queryByText(/publié/i)).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /publier/i })).not.toBeInTheDocument()
  })
})
