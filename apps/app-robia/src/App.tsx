import { useEffect, useMemo, useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { Menu, Search } from 'lucide-react'
import { getCurrentOrganization, getCurrentUser, logout, type Organization, type UserSummary } from './lib/api'
import Sidebar from './components/Sidebar'
import { clearAuthResponse, isAuthenticated } from './lib/auth'
import { WebsiteProvider } from './components/WebsiteContext'

export type ConnectionStatus = 'loading' | 'connected' | 'partial' | 'error'

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
            <span className="font-semibold text-dark text-sm">ROBIA Copilot</span>
          </div>
        </div>

        <main className="flex-1 overflow-y-auto">
          <WebsiteProvider>
            <Outlet />
          </WebsiteProvider>
        </main>
      </div>
    </div>
  )
}
