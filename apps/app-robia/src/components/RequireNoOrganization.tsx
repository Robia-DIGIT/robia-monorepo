import { useEffect, useState } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { getCurrentOrganization } from '../lib/api'

type CheckState = 'checking' | 'has-organization' | 'no-organization' | 'error'

export default function RequireNoOrganization() {
  const [state, setState] = useState<CheckState>('checking')

  useEffect(() => {
    let cancelled = false

    async function check() {
      try {
        const organization = await getCurrentOrganization()
        if (cancelled) return
        setState(organization ? 'has-organization' : 'no-organization')
      } catch (err) {
        if (cancelled) return
        // /organizations/current renvoie probablement un 404 quand
        // l'utilisateur n'a pas encore d'organisation — c'est le cas
        // "normal" ici, pas une vraie erreur.
        const status = (err as { status?: number })?.status
        setState(status === 404 ? 'no-organization' : 'error')
      }
    }

    check()
    return () => {
      cancelled = true
    }
  }, [])

  if (state === 'checking') {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-slate-bg">
        <Loader2 size={20} className="animate-spin text-teal" aria-hidden />
      </div>
    )
  }

  if (state === 'has-organization') {
    return <Navigate to="/analyse" replace />
  }

  // 'no-organization' → formulaire accessible.
  // 'error' (panne réseau/serveur) → on laisse passer plutôt que de
  // bloquer l'utilisateur indéfiniment sur un loader.
  return <Outlet />
}