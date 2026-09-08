import React from 'react'

/**
 * GlobalLoader — Componente de carga global adaptado de Uiverse.io (por devAaus).
 * Utiliza un doble anillo concéntrico animado que responde reactivamente
 * a los tokens de la paleta de colores activa (--primary y --accent).
 */
export default function GlobalLoader({ 
  message = 'Cargando...', 
  fullScreen = true 
}) {
  const content = (
    <div className="flex flex-col gap-4 w-full items-center justify-center animate-fadeIn select-none">
      {/* Doble Spinner Concéntrico (Uiverse devAaus) */}
      <div
        className="w-20 h-20 border-4 border-transparent text-4xl animate-spin flex items-center justify-center rounded-full"
        style={{ borderTopColor: 'var(--primary, #4f46e5)' }}
      >
        <div
          className="w-14 h-14 border-4 border-transparent text-2xl animate-spin flex items-center justify-center rounded-full"
          style={{ borderTopColor: 'var(--accent, #06b6d4)' }}
        />
      </div>

      {message && (
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 tracking-wide text-center max-w-xs">
          {message}
        </p>
      )}
    </div>
  )

  if (!fullScreen) return content

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/60 backdrop-blur-sm transition-all duration-200"
      role="status"
      aria-live="polite"
    >
      <div className="bg-white/95 dark:bg-slate-900/95 p-8 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col items-center">
        {content}
      </div>
    </div>
  )
}
