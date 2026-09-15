import React, { useState } from 'react'
import { Blobatar } from '@blobatar/react'

/**
 * UserAvatar Component
 * Intelligently renders either a custom uploaded/linked image or a deterministic Blobatar
 * based on username, with automatic fallback if an external image fails to load.
 */
export default function UserAvatar({
  username = 'usuario',
  avatarUrl = '',
  size = 40,
  className = '',
  alt = '',
  animate = false,
  showBorder = false
}) {
  const [imgError, setImgError] = useState(false)

  // Use Blobatar if avatarUrl is explicitly 'blobatar', empty, or if custom image fails to load
  const isBlobatar = !avatarUrl || avatarUrl === 'blobatar' || avatarUrl.trim() === '' || imgError
  const hasCustomRounding = className.includes('rounded-')
  const baseRounding = hasCustomRounding ? '' : 'rounded-full'

  const sizeStyle = size && !className.includes('w-') ? { width: size, height: size } : {}

  if (isBlobatar) {
    return (
      <div
        className={`${baseRounding} overflow-hidden flex items-center justify-center shrink-0 bg-slate-100 dark:bg-slate-800 ${
          showBorder ? 'ring-2 ring-white dark:ring-slate-900 shadow-sm' : ''
        } ${className}`}
        style={sizeStyle}
      >
        <Blobatar
          name={username || 'usuario'}
          size={size || 100}
          animate={animate}
          alt={alt || `@${username}`}
          className="w-full h-full object-cover"
        />
      </div>
    )
  }

  return (
    <img
      src={avatarUrl}
      alt={alt || `@${username}`}
      onError={() => setImgError(true)}
      className={`${baseRounding} object-cover shrink-0 ${
        showBorder ? 'ring-2 ring-white dark:ring-slate-900 shadow-sm' : ''
      } ${className}`}
      style={sizeStyle}
      loading="lazy"
    />
  )
}
