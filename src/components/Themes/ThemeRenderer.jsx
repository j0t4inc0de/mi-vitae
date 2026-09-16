import React from 'react'
import MinimalistTheme from './MinimalistTheme'
import CreativeTheme from './CreativeTheme'
import TechTheme from './TechTheme'
import WarmTheme from './WarmTheme'
import ExecutiveTheme from './ExecutiveTheme'

// ponytail: Polymorphic theme map - O(1) lookup table eliminates 60+ lines of switch boilerplate
const THEME_COMPONENTS = {
  minimalist: MinimalistTheme,
  creative: CreativeTheme,
  tech: TechTheme,
  warm: WarmTheme,
  executive: ExecutiveTheme,
}

// ponytail: Sort experience and education chronologically (most recent first) across all themes
const sortExperience = (list = []) => [...list].sort((a, b) => {
  if (a.current && !b.current) return -1
  if (!a.current && b.current) return 1
  return (b.startDate || '').localeCompare(a.startDate || '')
})

const sortEducation = (list = []) => [...list].map((edu) => ({
  ...edu,
  year: edu.current ? `${edu.startDate || ''} — Presente` : (edu.startDate && edu.endDate ? `${edu.startDate} — ${edu.endDate}` : edu.year || edu.endDate || edu.startDate || '')
})).sort((a, b) => {
  if (a.current && !b.current) return -1
  if (!a.current && b.current) return 1
  return (b.startDate || b.endDate || b.year || '').localeCompare(a.startDate || a.endDate || a.year || '')
})

/**
 * Polymorphic Theme Renderer component
 * Dynamically resolves and mounts the corresponding theme layout with smooth 60fps transitions
 */
export default function ThemeRenderer({ profile, themeOverride, onRecordClick }) {
  if (!profile) return null

  const resolvedTheme = (themeOverride || profile.theme || 'minimalist').toLowerCase().trim()
  const SelectedTheme = THEME_COMPONENTS[resolvedTheme] || MinimalistTheme
  const normalizedProfile = {
    ...profile,
    ...(profile.experience && { experience: sortExperience(profile.experience) }),
    ...(profile.education && { education: sortEducation(profile.education) })
  }

  return (
    <div key={resolvedTheme} className="transition-opacity duration-200 animate-fadeIn">
      <SelectedTheme 
        profile={normalizedProfile} 
        onRecordClick={onRecordClick} 
      />
    </div>
  )
}

