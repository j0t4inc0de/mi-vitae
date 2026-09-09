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
  const triggerDashboardReset = useProfileStore((state) => state.triggerDashboardReset)

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
                {/* Active Username Badge (hidden on smaller screens) */}
                {activeUsername && (
                  <div className="hidden lg:flex items-center gap-1.5 h-9 sm:h-10 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-300/80 dark:border-slate-800 text-xs font-mono font-bold text-slate-700 dark:text-slate-300 shrink-0 shadow-sm">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span>@{activeUsername}</span>
                  </div>
                )}

                {/* Restablecer Valores button */}
                <button
                  type="button"
                  onClick={() => triggerDashboardReset()}
                  title="Restablecer valores iniciales de prueba"
                  aria-label="Restablecer valores"
                  className="h-9 sm:h-10 px-2.5 sm:px-3.5 rounded-xl border border-slate-300 dark:border-slate-800 bg-white/80 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 text-xs font-bold shadow-sm cursor-pointer shrink-0"
                >
                  <RefreshCw className="w-4 h-4 text-slate-500 dark:text-slate-400 shrink-0" />
                  <span className="hidden sm:inline">Restablecer</span>
                </button>

                {/* Ver en Vivo button */}
                <a
                  href={liveProfileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Ver portafolio en vivo en nueva pestaña"
                  aria-label="Ver en vivo"
                  className="h-9 sm:h-10 px-2.5 sm:px-3.5 rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 text-xs font-bold shadow-sm cursor-pointer no-underline shrink-0"
                >
                  <Eye className="w-4 h-4 text-palette-primary shrink-0" />
                  <span className="hidden sm:inline">Ver en Vivo</span>
                  <ExternalLink className="hidden md:inline w-3 h-3 text-slate-400 opacity-80 shrink-0" />
                </a>

                {/* Guardar Cambios button */}
                <button
                  type="button"
                  onClick={() => triggerDashboardSave()}
                  disabled={isDashboardSaving}
                  title="Guardar cambios en Supabase Cloud"
                  aria-label="Guardar cambios"
                  className="h-9 sm:h-10 px-2.5 sm:px-3.5 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 text-xs font-bold shadow-sm cursor-pointer disabled:opacity-75 shrink-0"
                >
                  {isDashboardSaving ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin shrink-0" />
                      <span className="hidden sm:inline">Guardando...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 shrink-0" />
                      <span className="hidden sm:inline">Guardar</span>
                    </>
                  )}
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="h-9 sm:h-10 px-4 sm:px-5 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold text-xs sm:text-sm hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer no-underline"
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
