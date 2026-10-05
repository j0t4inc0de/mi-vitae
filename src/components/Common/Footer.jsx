import React, { useState, useEffect, useRef } from 'react'
import { Link } from '../../router/Router'
import MiVitaeLogo from './MiVitaeLogo'
import LegalModal from '../Modals/LegalModal'
import { ArrowUp, Sparkles, X, AlertTriangle } from 'lucide-react'
import { useProfileStore } from '../../stores/profileStore'
import FooterIllustration from './FooterIllustration'

/**
 * Custom Brutalist Minimalist Trash Can Icon
 * Fulfills the exact visual cue from 'inspiracion de footer.png':
 * Horizontal lid with top handle, tapered bin, and 3 vertical ribs.
 */
function BrutalistTrashIcon({ className = "w-5 h-5" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {/* Handle */}
      <path d="M9.5 4.5h5" />
      {/* Lid */}
      <path d="M4 7h16" />
      {/* Body */}
      <path d="M6 7l1.2 12.5a2 2 0 0 0 2 1.5h5.6a2 2 0 0 0 2-1.5L18 7" />
      {/* Vertical Ribs */}
      <path d="M9.5 11v6" />
      <path d="M12 11v6" />
      <path d="M14.5 11v6" />
    </svg>
  )
}

/**
 * Main Footer Component
 * Inspired faithfully by the editorial layout, artisanal doodle art,
 * direct contact typography, and playful brutalist trash interaction of 'inspiracion de footer.png'.
 */
export default function Footer() {
  // Global profileStore legal modal integration (if mounted at App level)
  const openLegalModal = useProfileStore((state) => state.openLegalModal)

  // Local fallback legal modal state
  const [isLegalOpen, setIsLegalOpen] = useState(false)
  const [legalTab, setLegalTab] = useState('terms')

  // Easter egg "Eliminar Sitio..." state
  const [isTrashEggOpen, setIsTrashEggOpen] = useState(false)
  const [trashStep, setTrashStep] = useState('loading') // 'loading' | 'prevented'
  const [fakeProgress, setFakeProgress] = useState(15)
  const [fakeStatusMsg, setFakeStatusMsg] = useState('Conectando con servidores cuánticos...')
  const progressTimerRef = useRef(null)

  const handleOpenTerms = (e) => {
    if (e) e.preventDefault()
    if (typeof openLegalModal === 'function') {
      openLegalModal('terms')
    } else {
      setLegalTab('terms')
      setIsLegalOpen(true)
    }
  }

  const handleOpenPrivacy = (e) => {
    if (e) e.preventDefault()
    if (typeof openLegalModal === 'function') {
      openLegalModal('privacy')
    } else {
      setLegalTab('privacy')
      setIsLegalOpen(true)
    }
  }

  const handleScrollTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Trigger funny Easter egg modal
  const handleTriggerTrashEgg = () => {
    setTrashStep('loading')
    setFakeProgress(12)
    setFakeStatusMsg('Iniciando desintegrador de páginas web...')
    setIsTrashEggOpen(true)

    // Sequence funny progress steps
    if (progressTimerRef.current) clearInterval(progressTimerRef.current)

    const steps = [
      { p: 34, msg: 'Eliminando servidores de We Are Samod en Santiago...' },
      { p: 68, msg: 'Vaciando la papelera de reciclaje de todo internet...' },
      { p: 89, msg: 'Comprimiendo enlaces personalizados a 0 bytes...' },
      { p: 99, msg: 'Borrando los últimos 3 kilobytes de genialidad...' }
    ]

    let currentIdx = 0
    progressTimerRef.current = setInterval(() => {
      if (currentIdx < steps.length) {
        setFakeProgress(steps[currentIdx].p)
        setFakeStatusMsg(steps[currentIdx].msg)
        currentIdx++
      } else {
        clearInterval(progressTimerRef.current)
        setTimeout(() => {
          setTrashStep('prevented')
        }, 500)
      }
    }, 450)
  }

  const handleCloseTrashEgg = () => {
    if (progressTimerRef.current) clearInterval(progressTimerRef.current)
    setIsTrashEggOpen(false)
  }

  useEffect(() => {
    return () => {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current)
    }
  }, [])

  return (
    <>
      <footer
        id="colophon"
        role="contentinfo"
        aria-label="Pie de página Mi Vitae"
        className="w-full bg-[#FAF8F5] dark:bg-slate-950 border-t border-[#E7E2D8] dark:border-slate-800 text-slate-800 dark:text-slate-100 transition-colors"
      >
        <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 py-8 sm:py-9 lg:py-10">
          
          {/* Main 2-Column Grid aligned to the top items-start */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            
            {/* ========================================================================= */}
            {/* LEFT COLUMN: BRAND HEADER & ARTISANAL DOODLE ART */}
            {/* ========================================================================= */}
            <div className="lg:col-span-5 flex flex-col justify-between self-stretch space-y-5 sm:space-y-6">
              
              {/* Brand Header — Aligned horizontally with Right Column Contact Header */}
              <div className="space-y-2.5">
                <div className="flex items-center gap-2.5">
                  <MiVitaeLogo className="w-7 h-7 shrink-0" />
                  <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white font-sans lowercase leading-none">
                    mi vitae
                  </span>
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300/60 dark:border-slate-700">
                    por We Are Samod
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm leading-relaxed">
                  Portafolios web interactivos de alto impacto para profesionales que dejan atrás el PDF tradicional.
                </p>
              </div>

              {/* Doodle Art grounded at the bottom-left */}
              <div className="pt-2 sm:pt-3 flex justify-start items-end">
                <div className="p-1 transition-transform duration-300 hover:scale-[1.02]">
                  <FooterIllustration className="w-44 sm:w-52 lg:w-56 h-auto text-slate-900 dark:text-slate-100 drop-shadow-sm" />
                </div>
              </div>

            </div>

            {/* ========================================================================= */}
            {/* RIGHT COLUMN: CONTACT & SUBIR (TOP), STUDIO, SOCIALS, TRASH & COPYRIGHT */}
            {/* ========================================================================= */}
            <div className="lg:col-span-7 flex flex-col justify-between self-stretch space-y-5 sm:space-y-6">
              
              {/* Top Row: Direct Contact & Pill Button 'Subir ↑' in a single horizontal line */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <a
                  href="mailto:contacto@wearesamod.com"
                  className="text-lg sm:text-xl lg:text-2xl font-normal tracking-tight text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors break-all leading-none"
                >
                  contacto@wearesamod.com
                </a>

                <button
                  type="button"
                  onClick={handleScrollTop}
                  aria-label="Volver arriba"
                  className="group inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full border border-slate-300 dark:border-slate-700 bg-white/90 dark:bg-slate-900/90 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-slate-400 dark:hover:border-slate-600 transition-all shadow-sm active:scale-95 cursor-pointer shrink-0"
                >
                  <span>Subir</span>
                  <ArrowUp className="w-3.5 h-3.5 transition-transform group-hover:-translate-y-0.5" />
                </button>
              </div>

              {/* Middle Section: Studio Location, Socials & Trash Can Easter Egg */}
              <div className="space-y-3.5 sm:space-y-4">
                
                {/* Studio Location */}
                <div className="text-sm sm:text-base text-slate-700 dark:text-slate-300 font-normal leading-snug">
                  <p className="text-slate-500 dark:text-slate-400">We Are Samod Studio</p>
                </div>

                {/* Social Networks */}
                <div className="text-sm sm:text-base font-normal text-slate-800 dark:text-slate-200 space-y-1">
                  {/* <div>
                    <a
                      href="https://instagram.com/wearesamod"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline underline-offset-4 decoration-slate-400 transition-all inline-block"
                    >
                      instagram
                    </a>
                  </div> */}
                  <div>
                    <a
                      href="https://www.linkedin.com/in/juan-erices-fuentealba-628b4a27a/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline underline-offset-4 decoration-slate-400 transition-all inline-block"
                    >
                      linkedin
                    </a>
                  </div>
                  {/* <div>
                    <a
                      href="https://github.com/wearesamod"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline underline-offset-4 decoration-slate-400 transition-all inline-block"
                    >
                      github
                    </a>
                  </div> */}
                </div>

                {/* Brutalist SVG Trash Can & 'Eliminar Sitio...' Easter Egg Button */}
                {/* ponytail: hide easter egg button on mobile screens */}
                <div className="hidden sm:block pt-1">
                  <button
                    type="button"
                    onClick={handleTriggerTrashEgg}
                    title="¿Qué pasará si haces clic?"
                    aria-label="Eliminar Sitio (Easter Egg)"
                    className="group inline-flex items-center gap-2 text-slate-700 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer text-left py-0.5"
                  >
                    <div className="transition-transform duration-200 group-hover:scale-110 group-hover:rotate-[-8deg] group-active:scale-95">
                      <BrutalistTrashIcon className="w-4 h-4 sm:w-5 sm:h-5 stroke-current" />
                    </div>
                    <span className="text-xs sm:text-sm font-normal tracking-tight group-hover:underline underline-offset-4">
                      Eliminar Sitio...
                    </span>
                  </button>
                </div>

              </div>

              {/* Bottom Row: Legal Links & Clean Copyright */}
              <div className="pt-4 sm:pt-5 border-t border-[#E7E2D8] dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-end justify-between gap-4 text-xs sm:text-sm">
                
                {/* Legal Links (Terms & Privacy) */}
                <div className="space-y-1 text-slate-600 dark:text-slate-400">
                  <div>
                    <button
                      type="button"
                      onClick={handleOpenTerms}
                      className="hover:underline underline-offset-4 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer text-left"
                    >
                      Términos del Servicio
                    </button>
                  </div>
                  <div>
                    <button
                      type="button"
                      onClick={handleOpenPrivacy}
                      className="hover:underline underline-offset-4 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer text-left"
                    >
                      Política de Privacidad
                    </button>
                  </div>
                </div>

                {/* Bottom Right Copyright */}
                <div className="text-slate-900 dark:text-white text-sm sm:text-base font-normal tracking-tight sm:text-right">
                  <span>©2026 Mi Vitae</span>
                </div>

              </div>

            </div>

          </div>

        </div>
      </footer>

      {/* ========================================================================= */}
      {/* LEGAL MODAL (TERMS & PRIVACY) */}
      {/* ========================================================================= */}
      <LegalModal
        isOpen={isLegalOpen}
        onClose={() => setIsLegalOpen(false)}
        initialTab={legalTab}
      />

      {/* ========================================================================= */}
      {/* EASTER EGG POPUP MODAL (ELIMINAR SITIO...) */}
      {/* ========================================================================= */}
      {isTrashEggOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="trash-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget && trashStep === 'prevented') handleCloseTrashEgg()
          }}
        >
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 text-center overflow-hidden">
            
            {/* Close button */}
            <button
              type="button"
              onClick={handleCloseTrashEgg}
              aria-label="Cerrar broma"
              className="absolute top-4 right-4 w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {trashStep === 'loading' ? (
              /* Phase 1: Dramatic Fake Destruction in Progress */
              <div className="py-4 space-y-5">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/80 flex items-center justify-center text-amber-500 animate-pulse">
                  <AlertTriangle className="w-8 h-8" />
                </div>

                <div className="space-y-1.5">
                  <h3 id="trash-modal-title" className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">
                    ⚠️ Destrucción de Mi Vitae en progreso...
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-mono">
                    {fakeStatusMsg}
                  </p>
                </div>

                {/* Progress bar container */}
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3.5 overflow-hidden p-0.5 border border-slate-200 dark:border-slate-700">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 via-rose-500 to-rose-600 rounded-full transition-all duration-300"
                    style={{ width: `${fakeProgress}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                  <span>Procesando solicitud...</span>
                  <span className="font-bold text-rose-500">{fakeProgress}%</span>
                </div>
              </div>
            ) : (
              /* Phase 2: Easter Egg Punchline */
              <div className="py-2 space-y-6 animate-in zoom-in-95 duration-200">
                <div className="w-20 h-20 mx-auto rounded-3xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-3xl shadow-lg shadow-indigo-500/10">
                  😎🚀
                </div>

                <div className="space-y-2">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-xs font-extrabold uppercase tracking-wider">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Error 418: Imposible Eliminar</span>
                  </div>

                  <h3 id="trash-modal-title" className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                    ¡Este portafolio es demasiado genial!
                  </h3>

                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-md mx-auto">
                    Ningún servidor fue herido en el intento. Este portafolio es demasiado genial para desaparecer del internet. 😎🚀
                    <br className="hidden sm:inline" />
                    ¡Tus proyectos, estilo y enlace exclusivo están <strong>100% a salvo en la nube</strong> de We Are Samod!
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleCloseTrashEgg}
                    className="w-full sm:w-auto px-8 py-3 rounded-2xl font-extrabold text-sm text-white bg-slate-900 dark:bg-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 shadow-xl transition-all cursor-pointer hover:scale-[1.02] active:scale-95"
                  >
                    ¡Uff, qué susto! Respirar aliviado 🎉
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}
    </>
  )
}
