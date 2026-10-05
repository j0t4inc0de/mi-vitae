import React from 'react'
import SnakePage from '../../pages/SnakePage'

/**
 * ponytail: Backward-compatible wrapper around dedicated SnakePage.
 * Clean, zero-emoji, 60fps retro game view.
 */
export default function SnakeEasterEggModal({ isOpen = true, onClose, ...props }) {
  if (!isOpen) return null
  return <SnakePage onClose={onClose} {...props} />
}
