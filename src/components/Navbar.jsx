import React from 'react'
import { Link, useRouter } from '../router/Router'
import { LogIn } from 'lucide-react'
import MiVitaeLogo from './Common/MiVitaeLogo'

// Re-export for compatibility
export { MiVitaeLogo }

export default function Navbar() {
  const { currentPath } = useRouter()
  const isAuthPage = currentPath === '/login' || currentPath === '/register' || currentPath === '/auth'

  return (
    <header className="sticky top-0 z-50 bg-[#f8fafc] dark:bg-slate-950 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Logo - Minimalista y Notorio */}
        <Link to="/" className="flex items-center gap-2.5 group shrink-0 no-underline">
          <div className="group-hover:scale-105 transition-transform duration-200 shadow-sm rounded-xl">
            <MiVitaeLogo className="w-9 h-9" />
          </div>
          <span className="font-extrabold text-xl tracking-tight text-slate-900 dark:text-white no-underline">
            Mi Vitae
          </span>
        </Link>

        {/* Right side: Only Sign In button */}
        {!isAuthPage && (
          <div className="flex items-center">
            <Link
              to="/login"
              className="px-5 py-2.5 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold text-xs sm:text-sm hover:opacity-90 active:scale-[0.98] transition-all flex items-center gap-2 shadow-sm cursor-pointer no-underline"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign in</span>
            </Link>
          </div>
        )}

      </div>
    </header>
  )
}
