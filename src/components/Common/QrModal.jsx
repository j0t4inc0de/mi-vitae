import React, { useEffect, useRef, useState } from 'react'
import { X, Download, Copy, Check, QrCode, CreditCard, Lightbulb } from 'lucide-react'
import { drawQRCodeToCanvas } from './qrGenerator'

// ponytail: Pure canvas-based zero-dependency QR code modal with native print-res PNG export
/**
 * QrModal - Interactive modal that renders a crisp QR Code and exports high-res PNG for physical business cards.
 * @param {boolean} isOpen - Modal open state
 * @param {function} onClose - Close callback
 * @param {object} profile - Profile object containing username, personalInfo, etc.
 * @param {string} customUrl - Optional custom URL override
 */
export default function QrModal({ isOpen, onClose, profile, customUrl }) {
  const canvasRef = useRef(null)
  const [copied, setCopied] = useState(false)
  const [activeTab, setActiveTab] = useState('qr') // 'qr' | 'card'

  const username = profile?.username || 'perfil'
  const name = profile?.personalInfo?.name || 'Profesional'
  const title = profile?.personalInfo?.title || 'Mi Vitae'
  const avatar = profile?.personalInfo?.avatar

  // Build target URL
  const targetUrl = customUrl || (typeof window !== 'undefined' 
    ? `${window.location.origin}/${username}` 
    : `https://mi-vitae.wearesamod.com/${username}`)

  // Render QR Code onto canvas whenever modal opens or URL changes
  useEffect(() => {
    if (!isOpen) return

    // Small delay to ensure canvas DOM element is mounted
    const timer = setTimeout(() => {
      if (canvasRef.current) {
        drawQRCodeToCanvas({
          canvas: canvasRef.current,
          text: targetUrl,
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
  }, [isOpen, targetUrl, activeTab])

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
      text: targetUrl,
      size: 1024,
      darkColor: '#0b132b',
      lightColor: '#ffffff',
      margin: 4,
      errorCorrection: 'H', // High error correction for print resilience
    })

    const imageUri = exportCanvas.toDataURL('image/png')
    const downloadLink = document.createElement('a')
    downloadLink.href = imageUri
    downloadLink.download = `mi-vitae-${username}-qr-tarjetas.png`
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
      <div
        className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Cerrar modal"
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-inner">
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

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 p-1 mb-6 bg-slate-100 dark:bg-slate-800/60 rounded-xl">
          <button
            onClick={() => setActiveTab('qr')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'qr'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Código QR Nítido</span>
          </button>
          <button
            onClick={() => setActiveTab('card')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'card'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Simulador Tarjeta Física</span>
          </button>
        </div>

        {/* Tab 1: QR Code View */}
        {activeTab === 'qr' && (
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
        )}

        {/* Tab 2: Physical Business Card Mockup Preview */}
        {activeTab === 'card' && (
          <div className="mb-5">
            <div className="relative rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-6 shadow-xl border border-indigo-500/20 overflow-hidden">
              <div className="absolute -top-12 -right-12 w-32 h-32 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="inline-block text-[10px] font-extrabold uppercase tracking-widest text-indigo-400 mb-2">
                    Mi Vitae • Business Card
                  </span>
                  <h3 className="font-bold text-lg leading-tight">{name}</h3>
                  <p className="text-xs text-slate-300 font-medium mt-0.5">{title}</p>
                  
                  <div className="mt-4 pt-3 border-t border-white/10 text-[11px] text-slate-400 space-y-0.5 font-mono">
                    <p className="truncate">mi-vitae.wearesamod.com/{username}</p>
                    <p className="text-emerald-400 text-[10px]">● Escanea para ver portafolio completo</p>
                  </div>
                </div>

                {/* Mini canvas for the card mockup */}
                <div className="p-2 bg-white rounded-xl shadow-md shrink-0">
                  <canvas
                    ref={canvasRef}
                    className="w-20 h-20 rounded block"
                    style={{ imageRendering: 'pixelated' }}
                  />
                </div>
              </div>
            </div>
            <p className="text-[11px] text-center text-slate-500 dark:text-slate-400 mt-2 flex items-center justify-center gap-1.5">
              <Lightbulb className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>Descarga el PNG e incorpóralo en tu diseño en Canva o Illustrator para imprenta.</span>
            </p>
          </div>
        )}

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
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 shrink-0 ${
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
            className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Cerrar
          </button>

          <button
            onClick={handleDownloadPng}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-all hover:scale-102 active:scale-98"
          >
            <Download className="w-4 h-4 text-indigo-400 dark:text-indigo-600" />
            <span>Descargar QR en PNG (Alta Resolución)</span>
          </button>
        </div>

      </div>
    </div>
  )
}
