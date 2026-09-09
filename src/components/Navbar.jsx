import React from 'react'
import { Link, useRouter } from '../router/Router'
import { LogIn, Eye, Save, RefreshCw, ExternalLink } from 'lucide-react'
import MiVitaeLogo from './Common/MiVitaeLogo'
import { useProfileStore } from '../stores/profileStore'

// Re-export for compatibility
export { MiVitaeLogo }

export default function Navbar() {
  const { currentPath } = useRouter()
  const isAuthPage = currentPath === '/login' || currentPath === '/register' || currentPath === '/auth'
  const isDashboard = currentPath === '/dashboard'

  // Dashboard store coordination
  const activeUsername = useProfileStore((state) => state.activeUsername)
  const isDashboardSaving = useProfileStore((state) => state.isDashboardSaving)
  const triggerDashboardSave = useProfileStore((state) => state.triggerDashboardSave)

  const liveProfileUrl = typeof window !== 'undefined' && window.location?.origin && !window.location.origin.includes('localhost') && !window.location.origin.includes('127.0.0.1')
    ? `${window.location.origin}/${activeUsername || ''}`
    : `/${activeUsername || ''}`

  return (
    <header className="sticky top-0 z-50 bg-[#f8fafc] dark:bg-slate-950 transition-colors border-b border-slate-200/80 dark:border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Logo - Minimalista y Notorio */}
        <Link to="/" className="flex items-center gap-2.5 group shrink-0 no-underline">
          <div className="group-hover:scale-105 transition-transform duration-200 shadow-sm rounded-xl">
            <MiVitaeLogo className="w-9 h-9" />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-xl tracking-tight text-slate-900 dark:text-white no-underline">
              Mi Vitae
            </span>
            {isDashboard && (
              <span className="px-2 py-0.5 rounded-md text-[10px] sm:text-xs font-bold font-mono tracking-wider uppercase bg-palette-primary/10 text-palette-primary border border-palette-primary/30">
                STUDIO
              </span>
            )}
          </div>
        </Link>

        {/* Right side actions */}
        {!isAuthPage && (
          <div className="flex items-center gap-2 sm:gap-3">
            {isDashboard ? (
              <>
                {/* Ver en Vivo button */}
                <a
                  href={liveProfileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 font-bold text-xs sm:text-sm hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-[0.98] transition-all flex items-center gap-1.5 shadow-sm cursor-pointer no-underline"
                >
                  <Eye className="w-4 h-4 text-palette-primary" />
                  <span className="hidden sm:inline">Ver en Vivo</span>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400 opacity-80" />
                </a>

                {/* Guardar Cambios button */}
                <button
                  type="button"
                  onClick={() => triggerDashboardSave()}
                  disabled={isDashboardSaving}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold text-xs sm:text-sm hover:opacity-90 active:scale-[0.98] transition-all flex items-center gap-2 shadow-sm cursor-pointer disabled:opacity-75"
                >
                  {isDashboardSaving ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Sincronizando...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Guardar Cambios</span>
                    </>
                  )}
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="px-5 py-2.5 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold text-xs sm:text-sm hover:opacity-90 active:scale-[0.98] transition-all flex items-center gap-2 shadow-sm cursor-pointer no-underline"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign in</span>
              </Link>
            )}
          </div>
        )}

      </div>
    </header>
  )
}
