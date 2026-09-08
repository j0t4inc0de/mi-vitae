import React from 'react'
import MinimalistTheme from './MinimalistTheme'
import CreativeTheme from './CreativeTheme'
import TechTheme from './TechTheme'
import WarmTheme from './WarmTheme'
import ExecutiveTheme from './ExecutiveTheme'
import FloatingViralBadge from '../Common/FloatingViralBadge'

// ponytail: Polymorphic theme map - O(1) lookup table eliminates 60+ lines of switch boilerplate
const THEME_COMPONENTS = {
  minimalist: MinimalistTheme,
  creative: CreativeTheme,
  tech: TechTheme,
  warm: WarmTheme,
  executive: ExecutiveTheme,
}

/**
 * Polymorphic Theme Renderer component
 * Dynamically resolves and mounts the corresponding theme layout with smooth 60fps transitions
 */
export default function ThemeRenderer({ profile, themeOverride, onRecordClick, showViralBadge = true }) {
  if (!profile) return null

  const resolvedTheme = (themeOverride || profile.theme || 'minimalist').toLowerCase().trim()
  const SelectedTheme = THEME_COMPONENTS[resolvedTheme] || MinimalistTheme

  return (
    <div key={resolvedTheme} className="transition-opacity duration-200 animate-fadeIn">
      <SelectedTheme 
        profile={profile} 
        onRecordClick={onRecordClick} 
      />
      {showViralBadge && (
        <FloatingViralBadge theme={resolvedTheme} />
      )}
    </div>
  )
}

