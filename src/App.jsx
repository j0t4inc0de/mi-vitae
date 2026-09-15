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
        {renderRoute()}
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
