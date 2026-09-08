import React from 'react'

/**
 * MiVitaeLogo — Logotipo minimalista, audaz y de alto impacto para Mi Vitae.
 * Combina un contenedor geométrico de alto contraste con un monograma 'V'
 * facetado que representa identidad digital y portafolio interactivo.
 */
export default function MiVitaeLogo({ className = "w-9 h-9" }) {
  return (
    <svg 
      viewBox="0 0 40 40" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Logo Mi Vitae"
    >
      <defs>
        {/* Gradiente dinámico sutil basado en la paleta global */}
        <linearGradient id="mivitae-bg-grad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0F172A" />
          <stop offset="100%" stopColor="#1E293B" />
        </linearGradient>

        <linearGradient id="mivitae-v-accent" x1="12" y1="12" x2="28" y2="28" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#E2E8F0" />
        </linearGradient>
      </defs>

      {/* Base squircle sólida y nítida */}
      <rect 
        width="40" 
        height="40" 
        rx="11" 
        fill="url(#mivitae-bg-grad)" 
      />

      {/* Trazo geométrico 'V' audaz y minimalista */}
      <path 
        d="M11.5 12.5L20 28.5L28.5 12.5" 
        stroke="url(#mivitae-v-accent)" 
        strokeWidth="3.6" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />

      {/* Punto de acento / foco interactivo digital */}
      <circle 
        cx="20" 
        cy="15" 
        r="2.4" 
        fill="var(--highlight, #cf7d30)" 
      />
    </svg>
  )
}
