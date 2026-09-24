import { useEffect, useMemo, useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { Menu, Search } from 'lucide-react'
import { getCurrentOrganization, getCurrentUser, logout, type Organization, type UserSummary } from './lib/api'
import Sidebar from './components/Sidebar'
import { resolvePageIcon, resolvePageTitle } from './lib/navigation'
import { clearAuthResponse, isAuthenticated } from './lib/auth'
import { WebsiteProvider } from './components/WebsiteContext'

export type ConnectionStatus = 'loading' | 'connected' | 'partial' | 'error'

type MetaOAuthStatus = 'connected' | 'denied' | 'error'

const META_OAUTH_NOTICE: Record<MetaOAuthStatus, { message: string; className: string }> = {
  connected: {
    message: 'Connexion Meta réussie. Les données Facebook et Instagram disponibles peuvent maintenant être chargées.',
    className: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  },
  denied: {
    message: 'Connexion Meta annulée ou refusée. Aucune donnée Meta n’a été modifiée.',
    className: 'border-amber-200 bg-amber-50 text-amber-800',
  },
  error: {
    message: 'La connexion Meta n’a pas abouti. Vérifiez la configuration Meta puis réessayez.',
    className: 'border-red-200 bg-red-50 text-red-700',
  },
}

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window === 'undefined') {
      return false
    }

    return window.localStorage.getItem('robia_sidebar_collapsed') === 'true'
  })
  const location = useLocation()
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [currentUser, setCurrentUser] = useState<UserSummary | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('loading')

  const activePath = location.pathname
  const pageTitle = resolvePageTitle(activePath, location.search)
  const PageIcon = resolvePageIcon(activePath, location.search)
  const metaOAuthStatus = useMemo(() => {
    if (location.pathname !== '/meta-data') return null
    const value = new URLSearchParams(location.search).get('meta')
    return value === 'connected' || value === 'denied' || value === 'error'
      ? value
      : null
  }, [location.pathname, location.search])
  const metaOAuthNotice = metaOAuthStatus ? META_OAUTH_NOTICE[metaOAuthStatus] : null

  const handleSidebarToggle = () => {
    setSidebarCollapsed((value) => {
      const nextValue = !value
      window.localStorage.setItem('robia_sidebar_collapsed', String(nextValue))
      return nextValue
    })
  }

  useEffect(() => {
    let mounted = true

    if (!isAuthenticated()) {
      clearAuthResponse()
      setConnectionStatus('error')
      return () => {
        mounted = false
      }
    }

    Promise.allSettled([getCurrentOrganization(), getCurrentUser()]).then(([orgResult, userResult]) => {
      if (!mounted) {
        return
      }

      const orgOk = orgResult.status === 'fulfilled'
      const userOk = userResult.status === 'fulfilled'

      if (!orgOk && !userOk) {
        clearAuthResponse()
      }

      if (orgOk) setOrganization(orgResult.value)
      if (userOk) setCurrentUser(userResult.value)

      if (orgOk && userOk) setConnectionStatus('connected')
      else if (orgOk || userOk) setConnectionStatus('partial')
      else setConnectionStatus('error')
    })

    return () => {
      mounted = false
    }
  }, [])

  const orgInitial = useMemo(() => {
    const base = organization?.name ?? currentUser?.name ?? currentUser?.email ?? '?'
    const letter = base.trim().charAt(0).toUpperCase()
    return letter || 'O'
  }, [organization, currentUser])

  const userInitial = useMemo(() => {
    const base = currentUser?.name ?? currentUser?.email ?? organization?.name ?? '?'
    const letter = base.trim().charAt(0).toUpperCase()
    return letter || 'U'
  }, [currentUser, organization])

  const handleLogout = async () => {
    await logout().catch(() => {
      window.location.assign('/login')
    })
  }

  if (!isAuthenticated() && location.pathname !== '/login' && location.pathname !== '/register') {
    return <Navigate to="/login" replace />
  }

  if (location.pathname === '/analyse' && new URLSearchParams(location.search).has('meta')) {
    return <Navigate to={`/meta-data${location.search}`} replace />
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-bg">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar
        activePath={activePath}
        collapsed={sidebarCollapsed}
        onToggleCollapsed={handleSidebarToggle}
        onNavigate={() => setSidebarOpen(false)}
        isOpen={sidebarOpen}
        organization={organization}
        currentUser={currentUser}
        onLogout={handleLogout}
        connectionStatus={connectionStatus}
        orgInitial={orgInitial}
        userInitial={userInitial}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile topbar */}
        <div className="lg:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-border">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg text-muted hover:bg-border-light transition-colors"
          >
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-teal flex items-center justify-center">
              <Search size={13} color="white" strokeWidth={2.5} />
            </div>
            <span className="font-display font-semibold text-dark text-sm">ROBIA Copilot</span>
          </div>
        </div>

        {/* Desktop topbar — orientation constante (section active), la
            sidebar seule n'affiche pas où on se trouve une fois repliée,
            et les routes de détail (ex. une automatisation précise) n'ont
            pas d'entrée de nav pour se resituer. */}
        {pageTitle && (
          <div className="hidden lg:flex items-center h-16 shrink-0 px-6 bg-white/90 backdrop-blur-sm border-b border-border shadow-[0_1px_0_rgba(15,23,42,0.02)]">
            <nav aria-label="Fil d'ariane" className="flex items-center gap-2.5 text-sm">
              <span className="text-[13px] font-medium text-muted">ROBIA</span>
              <span className="text-border" aria-hidden="true">/</span>
              {PageIcon && (
                <span className="flex h-6 w-6 items-center justify-center rounded-md bg-teal-light text-teal-dark">
                  <PageIcon size={13} strokeWidth={2.25} aria-hidden="true" />
                </span>
              )}
              <span className="font-display text-[15px] font-semibold text-navy">{pageTitle}</span>
            </nav>
          </div>
        )}

        <main className="flex-1 overflow-y-auto">
          <WebsiteProvider>
            {metaOAuthNotice && (
              <div
                role="status"
                aria-live="polite"
                className={`mx-4 mt-4 rounded-xl border px-4 py-3 text-sm font-medium sm:mx-6 lg:mx-8 ${metaOAuthNotice.className}`}
              >
                {metaOAuthNotice.message}
              </div>
            )}
            <Outlet />
          </WebsiteProvider>
        </main>
      </div>
    </div>
  )
}
