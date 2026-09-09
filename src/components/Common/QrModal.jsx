import React, { useEffect, useRef, useState } from 'react'
import { X, Download, Copy, Check, QrCode } from 'lucide-react'
import { drawQRCodeToCanvas } from './qrGenerator'

// ponytail: Pure canvas-based zero-dependency QR code modal with native print-res PNG export
/**
 * QrModal - Interactive modal that renders a crisp QR Code and exports high-res PNG for physical business cards.
 * @param {boolean} isOpen - Modal open state
 * @param {function} onClose - Close callback
 * @param {object} profile - Profile object containing username, personalInfo, etc.
 * @param {string} customUrl - Optional custom URL override
 */
export default function QrModal({ isOpen, onClose, profile, username: propUsername, customUrl }) {
  const canvasRef = useRef(null)
  const [copied, setCopied] = useState(false)

  const username = propUsername || profile?.username || ''

  // Build target URL pointing to production domain (mivitae.wearesamod.com)
  const productionBase = 'https://mivitae.wearesamod.com'
  const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  const targetUrl = customUrl || (isLocal || typeof window === 'undefined' || window.location.origin.includes('mi-vitae')
    ? `${productionBase}/${username}` 
    : `${window.location.origin}/${username}`)

  // Target URL for scanning includes ?ref=qr to attribute and record physical QR scans
  const qrScanUrl = targetUrl.includes('?') ? `${targetUrl}&ref=qr` : `${targetUrl}?ref=qr`

  // Render QR Code onto canvas whenever modal opens or URL changes
  useEffect(() => {
    if (!isOpen) return

    // Small delay to ensure canvas DOM element is mounted
    const timer = setTimeout(() => {
      if (canvasRef.current) {
        drawQRCodeToCanvas({
          canvas: canvasRef.current,
          text: qrScanUrl,
          size: 512,
          darkColor: '#0f172a',
          lightColor: '#ffffff',
          margin: 4,
          errorCorrection: 'M',
        })
      }
    }, 50)

    // Escape key handler
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      clearTimeout(timer)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, targetUrl])

  if (!isOpen) return null

  const handleCopyLink = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(targetUrl)
      } else {
        // Fallback
        const el = document.createElement('textarea')
        el.value = targetUrl
        document.body.appendChild(el)
        el.select()
        document.execCommand('copy')
        document.body.removeChild(el)
      }
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch (err) {
      console.error('Failed to copy link', err)
    }
  }

  const handleDownloadPng = () => {
    // Generate an ultra high-res canvas (1024x1024) for print quality
    const exportCanvas = document.createElement('canvas')
    drawQRCodeToCanvas({
      canvas: exportCanvas,
      text: qrScanUrl,
      size: 1024,
      darkColor: '#0b132b',
      lightColor: '#ffffff',
      margin: 4,
      errorCorrection: 'H', // High error correction for print resilience
    })

    const imageUri = exportCanvas.toDataURL('image/png')
    const downloadLink = document.createElement('a')
    downloadLink.href = imageUri
    downloadLink.download = `mi-vitae-${username}-qr.png`
    document.body.appendChild(downloadLink)
    downloadLink.click()
    document.body.removeChild(downloadLink)
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="qr-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      {/* Modal Card Container */}
      <div 
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border p-6 sm:p-8 flex flex-col max-h-[90vh] overflow-y-auto transition-all"
        style={{
          borderColor: 'rgb(var(--primary-rgb, 77 94 179) / 0.3)',
          boxShadow: '0 25px 60px -15px var(--glow, rgba(77, 94, 179, 0.25))'
        }}
      >
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          aria-label="Cerrar modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-5">
          <div 
            className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-md shrink-0 transition-all"
            style={{
              background: 'linear-gradient(135deg, var(--gradient-from), var(--gradient-to))',
              boxShadow: '0 4px 12px -2px var(--glow)'
            }}
          >
            <QrCode className="w-5 h-5" />
          </div>
          <div>
            <h2 id="qr-modal-title" className="text-xl font-bold text-slate-900 dark:text-white">
              Código QR de tu Portafolio
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Escanea con la cámara de tu smartphone o imprime para tus tarjetas de presentación.
            </p>
          </div>
        </div>

        {/* QR Code View */}
        <div className="flex flex-col items-center">
          <div className="p-4 bg-white rounded-2xl border-2 border-slate-200 dark:border-slate-700 shadow-md mb-4 group relative">
            <canvas
              ref={canvasRef}
              className="w-56 h-56 rounded-lg block"
              style={{ imageRendering: 'pixelated' }}
            />
            <div className="absolute inset-x-0 -bottom-2 flex justify-center">
              <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-900 text-white px-2.5 py-0.5 rounded-full shadow-sm">
                @{username}
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 text-center">
            Apunta con la cámara de tu móvil para abrir el portafolio instantáneamente.
          </p>
        </div>

        {/* Action Link & Copy Box */}
        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 mb-5">
          <input
            type="text"
            readOnly
            value={targetUrl}
            className="flex-1 bg-transparent text-xs font-mono text-slate-700 dark:text-slate-300 focus:outline-none truncate pl-1"
          />
          <button
            onClick={handleCopyLink}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 shrink-0 cursor-pointer ${
              copied
                ? 'bg-emerald-600 text-white'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>¡Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copiar</span>
              </>
            )}
          </button>
        </div>

        {/* Modal Footer Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Cerrar
          </button>

          <button
            onClick={handleDownloadPng}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-all hover:scale-102 active:scale-98 cursor-pointer"
          >
            <Download className="w-4 h-4 text-indigo-400 dark:text-indigo-600" />
            <span>Descargar QR</span>
          </button>
        </div>

      </div>
    </div>
  )
}
