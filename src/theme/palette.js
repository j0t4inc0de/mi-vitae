/**
 * =========================================================================
 * 🎨 PALETA DE COLORES GLOBAL ACTIVA (MI VITAE)
 * =========================================================================
 * Cada vez que envíes una paleta con 5 familias de colores en formato Tailwind
 * (50 a 950), simplemente se reemplaza este objeto y todo el proyecto se actualiza.
 */

export const rawPalette = {
  "almond-cream": {
    "50": "#faf2ea",
    "100": "#f5e5d6",
    "200": "#eccbac",
    "300": "#e2b183",
    "400": "#d8975a",
    "500": "#cf7d30",
    "600": "#a56427",
    "700": "#7c4b1d",
    "800": "#533213",
    "900": "#29190a",
    "950": "#1d1107"
  },
  "lilac-ash": {
    "50": "#f3f1f3",
    "100": "#e6e3e8",
    "200": "#cdc7d1",
    "300": "#b4acb9",
    "400": "#9b90a2",
    "500": "#83748b",
    "600": "#685d6f",
    "700": "#4e4653",
    "800": "#342e38",
    "900": "#1a171c",
    "950": "#121013"
  },
  "dusty-grape": {
    "50": "#efeff5",
    "100": "#dfe0ec",
    "200": "#c0c1d8",
    "300": "#a0a2c5",
    "400": "#8183b1",
    "500": "#61649e",
    "600": "#4e507e",
    "700": "#3a3c5f",
    "800": "#27283f",
    "900": "#131420",
    "950": "#0e0e16"
  },
  "prussian-blue": {
    "50": "#edeff7",
    "100": "#dbdff0",
    "200": "#b8bee0",
    "300": "#949ed1",
    "400": "#707ec2",
    "500": "#4d5eb3",
    "600": "#3d4b8f",
    "700": "#2e386b",
    "800": "#1f2547",
    "900": "#0f1324",
    "950": "#0b0d19"
  },
  "ink-black": {
    "50": "#eeedf7",
    "100": "#dcdbf0",
    "200": "#bab7e1",
    "300": "#9793d2",
    "400": "#756fc3",
    "500": "#524bb4",
    "600": "#423c90",
    "700": "#312d6c",
    "800": "#211e48",
    "900": "#100f24",
    "950": "#0c0b19"
  }
}

/**
 * Extracción semántica automática de tokens:
 * - primary: escala más profunda de acción (prussian-blue o ink-black)
 * - accent: escala intermedia armónica (dusty-grape o lilac-ash)
 * - highlight: escala cálida de contraste (almond-cream)
 */
const keys = Object.keys(rawPalette)

// Identificación de roles:
const warmKey = keys.find(k => k.includes('cream') || k.includes('gold') || k.includes('amber') || k.includes('almond')) || keys[0]
const primaryKey = keys.find(k => k.includes('blue') || k.includes('indigo') || k.includes('primary')) || keys[3] || keys[0]
const accentKey = keys.find(k => k.includes('grape') || k.includes('violet') || k.includes('purple') || k.includes('rose')) || keys[2] || keys[1]
const darkKey = keys.find(k => k.includes('black') || k.includes('dark') || k.includes('ink')) || keys[4] || keys[keys.length - 1]

const primaryScale = rawPalette[primaryKey]
const accentScale = rawPalette[accentKey]
const highlightScale = rawPalette[warmKey]
const darkScale = rawPalette[darkKey]

export function hexToRgb(hex) {
  if (!hex) return '77 94 179'
  const cleaned = hex.replace('#', '')
  const num = parseInt(cleaned, 16)
  const r = (num >> 16) & 255
  const g = (num >> 8) & 255
  const b = num & 255
  return `${r} ${g} ${b}`
}

export const semanticTokens = {
  primary: {
    DEFAULT: primaryScale['500'],
    hover: primaryScale['600'],
    light: primaryScale['50'],
    dark: primaryScale['700'],
  },
  accent: {
    DEFAULT: accentScale['500'],
    hover: accentScale['600'],
    light: accentScale['50'],
    dark: accentScale['700'],
  },
  highlight: {
    DEFAULT: highlightScale['500'],
    hover: highlightScale['600'],
    light: highlightScale['50'],
    dark: highlightScale['700'],
  },
  primaryRgb: hexToRgb(primaryScale['500']),
  accentRgb: hexToRgb(accentScale['500']),
  highlightRgb: hexToRgb(highlightScale['500']),
  gradientFrom: primaryScale['500'],
  gradientVia: accentScale['500'],
  gradientTo: highlightScale['400'],
  glow: `${primaryScale['500']}55`, // ~35% alpha
}

export function generateCssVariables() {
  return `
    --primary: ${semanticTokens.primary.DEFAULT};
    --primary-rgb: ${semanticTokens.primaryRgb};
    --primary-hover: ${semanticTokens.primary.hover};
    --accent: ${semanticTokens.accent.DEFAULT};
    --accent-rgb: ${semanticTokens.accentRgb};
    --highlight: ${semanticTokens.highlight.DEFAULT};
    --gradient-from: ${semanticTokens.gradientFrom};
    --gradient-via: ${semanticTokens.gradientVia};
    --gradient-to: ${semanticTokens.gradientTo};
    --glow: ${semanticTokens.glow};
  `
}
