import React, { useState } from 'react'
import { Link } from '../../router/Router'
import { Sparkles, ArrowRight, X } from 'lucide-react'

/**
 * FloatingViralBadge - Subtle, elegant, high-converting floating pill
 * promoting Mi Vitae on all public portfolio websites (similar to Linktree / Bento / Framer badges).
 * Perfectly optimized for mobile and desktop screens.
 */
export default function FloatingViralBadge({ theme = 'minimalist' }) {
  const [isDismissed, setIsDismissed] = useState(false)

  if (isDismissed) return null

  // Subtle theme-aware accent colors
  const accentClasses = {
    minimalist: 'bg-white/95 dark:bg-stone-900/95 text-stone-900 dark:text-stone-100 border-stone-300 dark:border-stone-700 shadow-stone-900/10',
    creative: 'bg-[#161524]/95 text-white border-purple-500/30 shadow-purple-950/40',
    tech: 'bg-[#0D131F]/95 text-emerald-300 border-emerald-500/30 shadow-emerald-950/40 font-mono',
    warm: 'bg-[#FFF9F5]/95 text-[#43281C] border-amber-300/80 shadow-amber-900/10',
    executive: 'bg-[#0F172A]/95 text-slate-100 border-blue-500/30 shadow-blue-950/40',
  }[theme] || 'bg-white/95 text-slate-900 border-slate-200 shadow-slate-900/10'

  return (
    <aside
      aria-label="Promoción Mi Vitae"
      className="fixed bottom-4 left-3 sm:bottom-6 sm:left-6 z-40 flex items-center group select-none animate-fadeIn max-w-[50vw] sm:max-w-none"
    >
      <Link
        to="/"
        className={`flex items-center gap-1.5 sm:gap-2 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-full border backdrop-blur-md shadow-lg transition-all duration-300 hover:scale-105 active:scale-95 ${accentClasses}`}
        title="Crear mi propio portafolio web en Mi Vitae"
      >
        <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shrink-0 shadow-sm">
          <Sparkles className="w-2 h-2 sm:w-2.5 sm:h-2.5 animate-pulse" />
        </div>

        {/* Text reduced an extra 2% (from 10.5px/11.5px to 10px/11px) */}
        <div className="text-[10px] sm:text-[11px] font-medium flex items-center gap-1 sm:gap-1.5 whitespace-nowrap leading-none tracking-tight">
          <span>Hecho con <strong className="font-extrabold tracking-tight">Mi Vitae</strong></span>
          <span className="opacity-40 hidden md:inline">•</span>
          <span className="text-indigo-600 dark:text-indigo-400 font-bold hidden md:inline flex items-center gap-0.5 group-hover:underline">
            Crea el tuyo gratis
            <ArrowRight className="w-2.5 h-2.5 group-hover:translate-x-0.5 transition-transform" />
          </span>
        </div>
      </Link>

      {/* Dismiss button */}
      <button
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setIsDismissed(true)
        }}
        title="Ocultar insignia"
        className="ml-0.5 sm:ml-1 p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 opacity-0 group-hover:opacity-80 transition-opacity cursor-pointer"
      >
        <X className="w-3 h-3" />
      </button>
    </aside>
  )
}
