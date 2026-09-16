import React from 'react'
import { Link, useRouter } from '../router/Router'
import { LogIn, Eye, Save, RefreshCw, ExternalLink, Sparkles, ChevronDown, Check } from 'lucide-react'
import MiVitaeLogo from './Common/MiVitaeLogo'
import UserAvatar from './Common/UserAvatar'
import { useProfileStore } from '../stores/profileStore'

// Re-export for compatibility
export { MiVitaeLogo }

export default function Navbar() {
  const { currentPath } = useRouter()
  const isAuthPage = currentPath === '/login' || currentPath === '/register' || currentPath === '/auth'
  const isDashboard = currentPath === '/dashboard'

  // Dashboard store coordination
  const profiles = useProfileStore((state) => state.profiles)
  const activeUsername = useProfileStore((state) => state.activeUsername)
  const isDashboardSaving = useProfileStore((state) => state.isDashboardSaving)
  const hasUnsavedChanges = useProfileStore((state) => state.hasUnsavedChanges)
  const triggerDashboardSave = useProfileStore((state) => state.triggerDashboardSave)
  const triggerDashboardReset = useProfileStore((state) => state.triggerDashboardReset)
  const openAccountModal = useProfileStore((state) => state.openAccountModal)

  const currentProfile = (activeUsername && profiles[activeUsername]) || {}

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
            <span className="hidden sm:inline font-extrabold text-xl tracking-tight text-slate-900 dark:text-white no-underline">
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
                {/* Interactive Profile Avatar & Settings Button */}
                <button
                  type="button"
                  onClick={openAccountModal}
                  title="Administrar cuenta, membresía y Blobatar"
                  aria-label="Perfil y cuenta"
                  className="flex items-center gap-2 h-9 sm:h-10 px-2 sm:px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-300/90 dark:border-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 hover:border-indigo-500 hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20 active:scale-[0.98] transition-all shadow-sm cursor-pointer shrink-0"
                >
                  <div className="relative">
                    <UserAvatar
                      username={activeUsername}
                      avatarUrl={currentProfile?.personalInfo?.avatar}
                      size={26}
                      showBorder={false}
                    />
                    <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 ring-1 ring-white dark:ring-slate-900" />
                  </div>
                  <span className="hidden sm:inline font-mono text-[11px]">@{activeUsername}</span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>

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
                  onClick={() => triggerDashboardSave()}
                  title="Ver portafolio en vivo en nueva pestaña"
                  aria-label="Ver en vivo"
                  className="h-9 sm:h-10 px-2.5 sm:px-3.5 rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-[0.98] transition-all hidden sm:flex items-center justify-center gap-1.5 text-xs font-bold shadow-sm cursor-pointer no-underline shrink-0"
                >
                  <Eye className="w-4 h-4 text-palette-primary shrink-0" />
                  <span className="hidden sm:inline">Ver en Vivo</span>
                  <ExternalLink className="hidden md:inline w-3 h-3 text-slate-400 opacity-80 shrink-0" />
                </a>

                {/* Guardar Cambios button / Auto-save status */}
                <button
                  type="button"
                  onClick={() => triggerDashboardSave()}
                  disabled={isDashboardSaving}
                  title={hasUnsavedChanges ? "Guardando cambios en Supabase Cloud..." : "Todos los cambios están guardados"}
                  aria-label="Guardar cambios"
                  className={`h-9 sm:h-10 px-2.5 sm:px-3.5 rounded-xl transition-all flex items-center justify-center gap-1.5 text-xs font-bold shadow-sm cursor-pointer shrink-0 ${
                    isDashboardSaving
                      ? 'bg-palette-primary text-white'
                      : hasUnsavedChanges
                      ? 'bg-amber-500 hover:bg-amber-600 text-white'
                      : 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:opacity-90'
                  }`}
                >
                  {isDashboardSaving ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin shrink-0" />
                      <span className="hidden sm:inline">Guardando...</span>
                    </>
                  ) : hasUnsavedChanges ? (
                    <>
                      <Save className="w-4 h-4 shrink-0 animate-pulse" />
                      <span className="hidden sm:inline">Guardando...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 text-emerald-400 dark:text-emerald-600 shrink-0" />
                      <span className="hidden sm:inline">Guardado</span>
                    </>
                  )}
                </button>
              </>
            ) : activeUsername ? (
              <div className="flex items-center gap-2 sm:gap-3">
                <Link
                  to="/dashboard"
                  className="h-9 sm:h-10 px-3 sm:px-4 rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 font-bold text-xs sm:text-sm flex items-center gap-2 shadow-sm cursor-pointer no-underline"
                >
                  <span>Studio</span>
                </Link>

                <button
                  type="button"
                  onClick={openAccountModal}
                  title="Administrar cuenta y membresía"
                  className="flex items-center gap-2 h-9 sm:h-10 px-2 sm:px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-300/90 dark:border-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 hover:border-indigo-500 transition-all shadow-sm cursor-pointer"
                >
                  <UserAvatar
                    username={activeUsername}
                    avatarUrl={currentProfile?.personalInfo?.avatar}
                    size={26}
                    showBorder={false}
                  />
                  <span className="hidden sm:inline font-mono text-[11px]">@{activeUsername}</span>
                </button>
              </div>
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
