/**
 * Native HTML5 Canvas Image Compressor (Pure JavaScript - 0 External Dependencies)
 * Optimizes avatars and portfolio project photos to lightweight Base64 DataURLs (< 200 KB)
 * with smooth proportional scaling and dynamic quality adjustment.
 */

/**
 * Compresses an image file or blob to an optimized DataURL string.
 * 
 * @param {File|Blob|string} file - The image file, blob or existing dataURL to compress
 * @param {object} options - Compression options
 * @param {number} [options.maxWidth=800] - Maximum width in pixels
 * @param {number} [options.maxHeight=800] - Maximum height in pixels
 * @param {number} [options.quality=0.82] - Initial JPEG compression quality (0.0 to 1.0)
 * @param {number} [options.maxSizeBytes=204800] - Target max size in bytes (200 KB)
 * @param {string} [options.mimeType='image/jpeg'] - Output mime type
 * @returns {Promise<string>} Resolves to the optimized DataURL string
 */
export async function compressImage(
  file,
  {
    maxWidth = 800,
    maxHeight = 800,
    quality = 0.82,
    maxSizeBytes = 200 * 1024,
    mimeType = 'image/jpeg'
  } = {}
) {
  if (!file) {
    throw new Error('compressImage: No file provided')
  }

  // Load image into an HTMLImageElement
  const img = await loadImage(file)

  // Calculate proportional dimensions
  let { width, height } = calculateProportionalDimensions(
    img.naturalWidth || img.width,
    img.naturalHeight || img.height,
    maxWidth,
    maxHeight
  )

  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d', { alpha: false, willReadFrequently: false })

  if (!ctx) {
    throw new Error('Canvas 2D context is not supported in this environment')
  }

  canvas.width = width
  canvas.height = height

  // Apply high-quality interpolation
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'

  // Fill with white background for JPEG rendering (prevents transparent PNG black background artifacts)
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(0, 0, width, height)

  // Draw image scaled
  ctx.drawImage(img, 0, 0, width, height)

  // Iteratively adjust quality/dimensions if output exceeds maxSizeBytes
  let currentQuality = Math.min(Math.max(quality, 0.1), 1.0)
  let dataUrl = canvas.toDataURL(mimeType, currentQuality)
  let estimatedBytes = getApproximateDataUrlBytes(dataUrl)

  let iterations = 0
  const maxIterations = 6

  while (estimatedBytes > maxSizeBytes && iterations < maxIterations) {
    iterations++
    
    // First step: reduce quality
    if (currentQuality > 0.45) {
      currentQuality = Math.max(0.4, currentQuality - 0.12)
    } else {
      // Second step: scale down dimensions slightly
      width = Math.round(width * 0.85)
      height = Math.round(height * 0.85)
      canvas.width = width
      canvas.height = height
      
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
      ctx.fillStyle = '#FFFFFF'
      ctx.fillRect(0, 0, width, height)
      ctx.drawImage(img, 0, 0, width, height)
    }

    dataUrl = canvas.toDataURL(mimeType, currentQuality)
    estimatedBytes = getApproximateDataUrlBytes(dataUrl)
  }

  return dataUrl
}

/**
 * Loads an image from a File, Blob, or URL string
 * @param {File|Blob|string} source 
 * @returns {Promise<HTMLImageElement>}
 */
function loadImage(source) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'

    let objectUrl = null

    img.onload = () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl)
      }
      resolve(img)
    }

    img.onerror = (err) => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl)
      }
      reject(new Error('Failed to load image for compression'))
    }

    if (typeof source === 'string') {
      img.src = source
    } else if (source instanceof Blob || source instanceof File) {
      objectUrl = URL.createObjectURL(source)
      img.src = objectUrl
    } else {
      reject(new Error('Unsupported image source type'))
    }
  })
}

/**
 * Calculates proportional dimensions keeping aspect ratio within limits
 */
function calculateProportionalDimensions(origW, origH, maxW, maxH) {
  if (origW <= maxW && origH <= maxH) {
    return { width: Math.max(origW, 1), height: Math.max(origH, 1) }
  }

  const ratio = Math.min(maxW / origW, maxH / origH)
  return {
    width: Math.max(Math.round(origW * ratio), 1),
    height: Math.max(Math.round(origH * ratio), 1)
  }
}

/**
 * Approximates byte size of a Base64 DataURL
 * @param {string} dataUrl 
 * @returns {number}
 */
export function getApproximateDataUrlBytes(dataUrl) {
  if (!dataUrl) return 0
  const base64Index = dataUrl.indexOf('base64,')
  if (base64Index === -1) return dataUrl.length
  const base64String = dataUrl.slice(base64Index + 7)
  const padding = base64String.endsWith('==') ? 2 : base64String.endsWith('=') ? 1 : 0
  return Math.max(0, (base64String.length * 3) / 4 - padding)
}

/**
 * Formats bytes to human-readable string (e.g. "124 KB")
 * @param {number} bytes 
 * @returns {string}
 */
export function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}
