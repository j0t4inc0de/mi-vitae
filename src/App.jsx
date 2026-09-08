import React from 'react'
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
import GlobalLoader from './components/Common/GlobalLoader'
import { useProfileStore } from './stores/profileStore'

function AppContent() {
  const { route } = useRouter()

  const isRegisterModalOpen = useProfileStore((state) => state.isRegisterModalOpen)
  const registerModalPrefill = useProfileStore((state) => state.registerModalPrefill)
  const closeRegisterModal = useProfileStore((state) => state.closeRegisterModal)

  const isFlowModalOpen = useProfileStore((state) => state.isFlowModalOpen)
  const flowModalData = useProfileStore((state) => state.flowModalData)
  const closeFlowModal = useProfileStore((state) => state.closeFlowModal)

  const isGlobalLoading = useProfileStore((state) => state.isGlobalLoading)
  const loadingMessage = useProfileStore((state) => state.loadingMessage)

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
    <div className="min-h-screen flex flex-col font-sans bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
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
