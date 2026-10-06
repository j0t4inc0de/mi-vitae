/**
 * Creator Code / Referral System Utility ("Apoya a un creador")
 * Inspired by Epic Games Creator Program
 */

const STORAGE_KEY = 'mivitae_creator_code'
const MAX_LENGTH = 30

/**
 * Sanitizes a creator code:
 * - Keeps only alphanumeric characters, underscores, and hyphens [A-Z0-9_-]
 * - Converts to uppercase
 * - Maximum 30 characters
 */
export function sanitizeCreatorCode(code) {
  if (!code || typeof code !== 'string') return ''
  const cleaned = code
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9_-]/g, '')
    .slice(0, MAX_LENGTH)
  return cleaned
}

function getStorage() {
  if (typeof window !== 'undefined' && window.localStorage) return window.localStorage
  if (typeof localStorage !== 'undefined') return localStorage
  return null
}

/**
 * Retrieves the stored creator code from localStorage if available
 */
export function getStoredCreatorCode() {
  const storage = getStorage()
  if (!storage) return ''
  try {
    const raw = storage.getItem(STORAGE_KEY)
    return sanitizeCreatorCode(raw)
  } catch {
    return ''
  }
}

/**
 * Persists or clears the creator code in localStorage
 */
export function setStoredCreatorCode(code) {
  const storage = getStorage()
  if (!storage) return ''
  try {
    const sanitized = sanitizeCreatorCode(code)
    if (sanitized) {
      storage.setItem(STORAGE_KEY, sanitized)
      return sanitized
    } else {
      storage.removeItem(STORAGE_KEY)
      return ''
    }
  } catch {
    return ''
  }
}

/**
 * Automatically captures creator code from URL search query parameters:
 * Supports '?ref=NOMBRECREADOR' or '?creator=NOMBRECREADOR' or full URLs
 */
export function captureCreatorCodeFromUrl(searchString) {
  const search = searchString !== undefined 
    ? searchString 
    : (typeof window !== 'undefined' && window.location ? window.location.search : '')

  if (!search) return null

  try {
    const queryString = search.includes('?') ? search.slice(search.indexOf('?')) : search
    const params = new URLSearchParams(queryString)
    const codeParam = params.get('ref') || params.get('creator') || params.get('referral')

    if (codeParam) {
      const sanitized = sanitizeCreatorCode(codeParam)
      if (sanitized) {
        setStoredCreatorCode(sanitized)
        return sanitized
      }
    }
  } catch {
    // Graceful fallback
  }

  return null
}
