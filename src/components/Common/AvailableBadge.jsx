import React from 'react'

/**
 * AvailableBadge - Interactive pulsating indicator showing professional availability
 * @param {boolean} available - If false, renders nothing unless forceRender is true
 * @param {string} text - Custom label (defaults to "Disponible para nuevos proyectos")
 * @param {boolean} compact - Compact pill version for headers or small cards
 * @param {'sm'|'md'|'lg'} size - Badge size
 * @param {boolean} pulse - Enables pulsing radar ping animation
 * @param {string} className - Additional CSS classes
 */
export default function AvailableBadge({
  available = true,
  text = 'Disponible para nuevos proyectos / contratación',
  compact = false,
  size = 'md',
  pulse = true,
  className = '',
}) {
  if (!available) return null

  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5 gap-1',
    md: 'text-xs px-3 py-1 gap-1.5',
    lg: 'text-sm px-4 py-1.5 gap-2 font-semibold',
  }[size] || 'text-xs px-3 py-1 gap-1.5'

  const dotSizes = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-2.5 h-2.5',
  }[size] || 'w-2 h-2'

  return (
    <div
      role="status"
      aria-label={text}
      className={`inline-flex items-center rounded-full bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/30 dark:border-emerald-400/40 text-emerald-700 dark:text-emerald-300 font-medium tracking-tight backdrop-blur-sm shadow-sm transition-all duration-300 hover:bg-emerald-500/20 hover:border-emerald-500/50 ${sizeClasses} ${className}`}
    >
      <span className="relative flex shrink-0 items-center justify-center">
        {pulse && (
          <span
            className={`absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping`}
            aria-hidden="true"
          />
        )}
        <span
          className={`relative inline-flex rounded-full bg-emerald-500 shadow-sm ${dotSizes}`}
        />
      </span>
      <span className="truncate">{compact ? (text === 'Disponible para nuevos proyectos / contratación' ? 'Disponible' : text) : text}</span>
    </div>
  )
}
