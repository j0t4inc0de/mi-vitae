/**
 * Creator Code / Referral System Utility ("Apoya a un creador")
 * Inspired by Epic Games Creator Program
 */

const STORAGE_KEY = 'mivitae_creator_code'
const MAX_LENGTH = 30

// ponytail: Canonical constants for creator codes, trial periods, and pricing
export const TRIAL_DAYS_DEFAULT = 14
export const TRIAL_DAYS_WITH_CODE = 30
export const PRICE_REGULAR_CLP = 3490
export const PRICE_DISCOUNT_CLP = 2990
export const PRICE_REGULAR_USD = 3.99
export const PRICE_DISCOUNT_USD = 2.99
export const CREATOR_COMMISSION_CLP = 1000
export const CREATOR_COMMISSION_USD = 1.00

/**
 * Sanitizes a creator code:
 * - Keeps only alphanumeric characters, underscores, and hyphens [A-Z0-9_-]
 * - Converts to uppercase
 * - Maximum 30 characters
 */
const CREATOR_ALIASES = {
  'SANTIAG0Q7': 'THIAGOQ7',
  'SANTIAGOQ7': 'THIAGOQ7',
  'THIAG0Q7': 'THIAGOQ7'
}

export function sanitizeCreatorCode(code) {
  if (!code || typeof code !== 'string') return ''
  const cleaned = code
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9_-]/g, '')
    .slice(0, MAX_LENGTH)
  return CREATOR_ALIASES[cleaned] || cleaned
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

/**
 * Returns trial days: 30 if sanitized creator code exists, 14 otherwise.
 */
export function getTrialDays(code) {
  return sanitizeCreatorCode(code) ? TRIAL_DAYS_WITH_CODE : TRIAL_DAYS_DEFAULT
}

/**
 * Calculates pricing breakdown and discount based on currency and creator code.
 */
export function getSubscriptionPricing(currency = 'CLP', code = '') {
  const isUsd = String(currency).toUpperCase() === 'USD'
  const hasDiscount = Boolean(sanitizeCreatorCode(code))
  const regularPrice = isUsd ? PRICE_REGULAR_USD : PRICE_REGULAR_CLP
  const finalPrice = hasDiscount
    ? (isUsd ? PRICE_DISCOUNT_USD : PRICE_DISCOUNT_CLP)
    : regularPrice
  const discountAmount = hasDiscount
    ? (isUsd ? +(regularPrice - finalPrice).toFixed(2) : regularPrice - finalPrice)
    : 0

  return {
    regularPrice,
    finalPrice,
    hasDiscount,
    discountAmount,
    currency: isUsd ? 'USD' : 'CLP'
  }
}
