import React from 'react'
import { Link } from '../../router/Router'
import { Sparkles, ArrowRight } from 'lucide-react'

/**
 * ViralFooter - Discreet, high-converting footer watermark linking to Mi Vitae creator
 * @param {string} theme - Current theme key ('warm', 'executive', 'minimalist', 'creative', 'tech')
 * @param {string} className - Additional custom classes
 * @param {boolean} dark - Forces dark mode styling
 */
export default function ViralFooter({ theme = 'minimalist', className = '', dark = false }) {
  // Theme specific border and badge colors
  const themeAccents = {
    warm: 'hover:border-[#D97706]/40 text-[#43281C]/70 hover:text-[#43281C]',
    executive: 'hover:border-[#3A86FF]/40 text-[#94A3B8] hover:text-white',
    minimalist: 'hover:border-slate-400 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white',
    creative: 'hover:border-purple-500/40 text-purple-200/70 hover:text-white',
    tech: 'hover:border-emerald-500/40 text-emerald-400/80 hover:text-emerald-300 font-mono',
  }[theme] || 'hover:border-indigo-500/40 text-slate-500 hover:text-slate-900'

  return (
    <footer aria-label="Pie de página Mi Vitae" className={`w-full py-8 mt-12 border-t border-current/10 transition-colors ${className}`}>
      <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
        
        {/* Brand identity & attribution */}
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-sm">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div>
            <p className="text-xs font-semibold tracking-tight">
              Portafolio impulsado por{' '}
              <span className="font-extrabold underline decoration-indigo-500 underline-offset-2">
                Mi Vitae
              </span>
            </p>
            <p className="text-[11px] opacity-60">
              Crea tu CV web interactivo y enlace personal en minutos.
            </p>
          </div>
        </div>

        {/* Viral CTA Button */}
        <Link
          to="/"
          className={`group inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border border-current/15 bg-current/5 backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:bg-current/10 active:scale-95 ${themeAccents}`}
        >
          <span>Crea tu portafolio profesional en Mi Vitae</span>
          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
        </Link>

      </div>
    </footer>
  )
}
