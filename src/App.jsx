import React, { useEffect } from 'react'
import { Router, useRouter } from './router/Router'
import Navbar from './components/Navbar'
import LandingPage from './pages/LandingPage'
import PortfolioPage from './pages/PortfolioPage'
import DashboardPage from './pages/DashboardPage'
import AdminPage from './pages/AdminPage'
import AuthPage from './pages/AuthPage'
import NotFoundPage from './pages/NotFoundPage'
import RegisterFeedbackModal from './components/Modals/RegisterFeedbackModal'
import FlowCheckoutModal from './components/Modals/FlowCheckoutModal'
import UserAccountModal from './components/Modals/UserAccountModal'
import GlobalLoader from './components/Common/GlobalLoader'
import { useProfileStore } from './stores/profileStore'
import { getCurrentUserProfile, isSupabaseConfigured, supabase } from './lib/supabaseClient'

// ponytail: Minimal standard React error boundary to prevent full-page crashes
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }
  static getDerivedStateFromError() {
    return { hasError: true }
  }
  componentDidCatch(error, info) {
    console.error('[ErrorBoundary caught]:', error, info)
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
          <div className="max-w-md p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">No pudimos cargar esta sección</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Ocurrió un problema temporal. Puedes intentar recargar o regresar al inicio.
            </p>
            <div className="flex justify-center gap-3">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Recargar página
              </button>
              <a
                href="/"
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Ir al inicio
              </a>
            </div>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

function AppContent() {
  const { route } = useRouter()

  const isRegisterModalOpen = useProfileStore((state) => state.isRegisterModalOpen)
  const registerModalPrefill = useProfileStore((state) => state.registerModalPrefill)
  const closeRegisterModal = useProfileStore((state) => state.closeRegisterModal)

  const isFlowModalOpen = useProfileStore((state) => state.isFlowModalOpen)
  const flowModalData = useProfileStore((state) => state.flowModalData)
  const closeFlowModal = useProfileStore((state) => state.closeFlowModal)

  const isAccountModalOpen = useProfileStore((state) => state.isAccountModalOpen)
  const closeAccountModal = useProfileStore((state) => state.closeAccountModal)

  const isGlobalLoading = useProfileStore((state) => state.isGlobalLoading)
  const loadingMessage = useProfileStore((state) => state.loadingMessage)
  const setRemoteProfile = useProfileStore((state) => state.setRemoteProfile)
  const logout = useProfileStore((state) => state.logout)

  // ponytail: Global sync with real authenticated Supabase session
  useEffect(() => {
    let isMounted = true

    const syncAuth = async () => {
      const realProfile = await getCurrentUserProfile()
      if (realProfile && isMounted) {
        setRemoteProfile(realProfile)
      }
    }

    syncAuth()

    if (isSupabaseConfigured && supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
        if (event === 'SIGNED_IN' || event === 'USER_UPDATED' || event === 'TOKEN_REFRESHED') {
          syncAuth()
        } else if (event === 'SIGNED_OUT') {
          logout()
        }
      })
      return () => {
        isMounted = false
        subscription?.unsubscribe()
      }
    }

    return () => { isMounted = false }
  }, [])

  const renderRoute = () => {
    switch (route) {
      case 'landing':
        return <LandingPage />
      case 'portfolio':
        return <PortfolioPage />
      case 'dashboard':
        return <DashboardPage />
      case 'admin':
        return <AdminPage />
      case 'auth':
        return <AuthPage />
      default:
        return <NotFoundPage />
    }
  }

  return (
    <div className={`min-h-screen flex flex-col font-sans ${route === 'portfolio' ? '' : 'bg-slate-50 dark:bg-slate-950'} text-slate-900 dark:text-slate-100 overflow-x-clip`}>
      {route !== 'portfolio' && <Navbar />}
      <div className="flex-1">
        <ErrorBoundary>
          {renderRoute()}
        </ErrorBoundary>
      </div>

      {/* Global Modals rendered at root */}
      <RegisterFeedbackModal
        isOpen={isRegisterModalOpen}
        onClose={closeRegisterModal}
        initialUsername={registerModalPrefill?.username || ''}
      />

      <FlowCheckoutModal
        isOpen={isFlowModalOpen}
        onClose={closeFlowModal}
        username={flowModalData?.username}
        planName={flowModalData?.planName}
        amount={flowModalData?.amount || 3490}
      />

      <UserAccountModal
        isOpen={isAccountModalOpen}
        onClose={closeAccountModal}
      />

      {/* Global Loader Overlay */}
      {isGlobalLoading && (
        <GlobalLoader message={loadingMessage} />
      )}
    </div>
  )
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  )
}
