import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Check, Eye, EyeOff, FileText, Link2, ShieldAlert, TriangleAlert, Unplug } from 'lucide-react'

import { Button, Card, Badge } from './ui'
import {
  connectWordPress,
  disconnectWordPress,
  getWordPressStatus,
  type WordPressStatus,
} from '../lib/api'

interface Props {
  websiteId: string
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Une erreur inattendue est survenue.'
}

const NEVER_CONNECTED: WordPressStatus = { connected: false, connection: null }

// RC42 — per-site WordPress connector. No URL field: the target site is
// whatever ROBIA already knows for this website, resolved server-side.
// The Application Password is never stored client-side beyond the instant
// it is sent — no localStorage, no URL, no log, no persisted component
// state after a successful connect or after this form unmounts.
export default function WordPressConnectionCard({ websiteId }: Props) {
  const [status, setStatus] = useState<WordPressStatus>(NEVER_CONNECTED)
  const [loading, setLoading] = useState(true)
  const [username, setUsername] = useState('')
  const [applicationPassword, setApplicationPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      // The secret must never survive this form's unmount (a site change
      // unmounts this whole card — see key={websiteId} at the call site).
      setApplicationPassword('')
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')

    void getWordPressStatus(websiteId)
      .then((result) => {
        if (cancelled) return
        setStatus(result)
      })
      .catch((loadError: unknown) => {
        if (cancelled) return
        setError(errorMessage(loadError))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [websiteId])

  async function handleConnect(event: FormEvent) {
    event.preventDefault()
    if (busy) return
    setBusy(true)
    setError('')
    setNotice('')

    try {
      const result = await connectWordPress({
        websiteId,
        username: username.trim(),
        applicationPassword,
      })
      if (!mountedRef.current) return
      setStatus({ connected: result.connection.status === 'ready', connection: result.connection })
      setUsername('')
      // Cleared immediately on success — this component never keeps the
      // secret around once the server has confirmed the connection.
      setApplicationPassword('')
      setNotice('Connexion WordPress établie.')
    } catch (connectError) {
      if (!mountedRef.current) return
      setError(errorMessage(connectError))
    } finally {
      if (mountedRef.current) setBusy(false)
    }
  }

  async function handleDisconnect() {
    if (busy) return
    if (!window.confirm('Déconnecter WordPress de ce site dans ROBIA ?')) return
    setBusy(true)
    setError('')
    setNotice('')

    try {
      const result = await disconnectWordPress(websiteId)
      if (!mountedRef.current) return
      setNotice(
        result.remoteApplicationPasswordRevoked
          ? 'La connexion a été supprimée de ROBIA et le mot de passe d’application a été révoqué.'
          : 'La connexion est supprimée de ROBIA, mais le mot de passe d’application doit aussi être révoqué dans WordPress.',
      )
      const refreshed = await getWordPressStatus(websiteId)
      if (!mountedRef.current) return
      setStatus(refreshed)
    } catch (disconnectError) {
      if (!mountedRef.current) return
      setError(errorMessage(disconnectError))
    } finally {
      if (mountedRef.current) setBusy(false)
    }
  }

  if (loading) {
    return (
      <Card className="p-4">
        <div className="h-4 w-40 animate-pulse rounded bg-slate-100" />
      </Card>
    )
  }

  const connection = status.connection

  return (
    <Card className="border-t-2 border-teal p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-navy text-sm font-bold text-white">W</div>
          <h3 className="text-sm font-bold text-navy">WordPress</h3>
        </div>
        {connection?.status === 'ready' && <Badge variant="teal">Connecté</Badge>}
        {connection?.status === 'failed' && <Badge variant="red">Connexion en échec</Badge>}
        {connection?.status === 'disconnected' && <Badge variant="gray">Déconnecté</Badge>}
        {!connection && <Badge variant="gray">Non configuré</Badge>}
      </div>

      {error && (
        <div role="alert" className="mt-3 border-l-2 border-red-500 bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </div>
      )}
      {notice && (
        <div role="status" className="mt-3 border-l-2 border-orange bg-orange-light/30 px-3 py-2 text-xs text-orange-dark">
          {notice}
        </div>
      )}

      {connection?.status === 'ready' ? (
        <div className="mt-3 space-y-2">
          <p className="flex items-center gap-1.5 text-xs text-dark">
            <Check size={13} className="text-teal-dark" />
            Compte connecté : <span className="font-semibold text-navy">{connection.remoteUserName ?? connection.username}</span>
          </p>
          <ul className="space-y-1 text-xs text-dark">
            <li className="flex items-center gap-1.5">
              {connection.canCreatePosts ? <Check size={13} className="text-teal-dark" /> : <TriangleAlert size={13} className="text-orange-dark" />}
              Peut créer des brouillons d’article {connection.canCreatePosts ? '' : '— non autorisé par ce compte'}
            </li>
            <li className="flex items-center gap-1.5">
              {connection.canCreatePages ? <Check size={13} className="text-teal-dark" /> : <TriangleAlert size={13} className="text-orange-dark" />}
              Peut créer des brouillons de page {connection.canCreatePages ? '' : '— non autorisé par ce compte'}
            </li>
          </ul>
          <Button variant="ghost" size="sm" icon={<Unplug size={13} />} loading={busy} onClick={() => void handleDisconnect()}>
            Déconnecter
          </Button>
        </div>
      ) : (
        <form onSubmit={(event) => void handleConnect(event)} className="mt-3 space-y-2.5">
          {connection?.status === 'disconnected' && (
            <p className="text-xs text-muted">Reconnectez ce site pour créer de nouveaux brouillons WordPress.</p>
          )}
          {connection?.status === 'failed' && (
            <p className="text-xs text-muted">La dernière tentative de connexion a échoué. Vérifiez les identifiants ci-dessous.</p>
          )}
          <label className="block text-xs font-bold text-navy">
            Identifiant WordPress
            <input
              required
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="ex. redaction"
              autoComplete="username"
              className="mt-1.5 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-teal"
            />
          </label>
          <label className="block text-xs font-bold text-navy">
            Mot de passe d’application
            <div className="relative mt-1.5">
              <input
                required
                type={showPassword ? 'text' : 'password'}
                value={applicationPassword}
                onChange={(event) => setApplicationPassword(event.target.value)}
                placeholder="xxxx xxxx xxxx xxxx xxxx xxxx"
                autoComplete="new-password"
                className="w-full rounded-lg border border-border bg-white px-3 py-2 pr-9 text-sm outline-none focus:border-teal"
              />
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-navy"
              >
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </label>
          <p className="flex items-start gap-1.5 text-[11px] leading-4 text-orange-dark">
            <ShieldAlert size={13} className="mt-0.5 shrink-0" />
            Utilisez un mot de passe d’application WordPress, jamais votre mot de passe principal.
          </p>
          <Button type="submit" variant="primary" size="sm" className="w-full" loading={busy} icon={<Link2 size={13} />}>
            Connecter WordPress
          </Button>
          <p className="flex items-start gap-1.5 text-[11px] leading-4 text-muted">
            <FileText size={13} className="mt-0.5 shrink-0" />
            Aucune URL à renseigner — le site cible est celui déjà configuré pour ce site ROBIA.
          </p>
        </form>
      )}
    </Card>
  )
}
