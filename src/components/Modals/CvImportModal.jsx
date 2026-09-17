import React, { useState, useRef, useEffect } from 'react'
import {
  UploadCloud,
  FileText,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  X,
  RefreshCw,
  Zap,
  ArrowRight
} from 'lucide-react'

export default function CvImportModal({ isOpen, onClose, onSuccess }) {
  const [dragActive, setDragActive] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [progressStep, setProgressStep] = useState(1) // 1: reading, 2: analyzing, 3: structuring
  const [errorMessage, setErrorMessage] = useState('')
  const fileInputRef = useRef(null)

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedFile(null)
      setIsLoading(false)
      setProgressStep(1)
      setErrorMessage('')
      setDragActive(false)
    }
  }, [isOpen])

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && !isLoading) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, isLoading, onClose])

  if (!isOpen) return null

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const validateAndProcessFile = (file) => {
    setErrorMessage('')
    if (!file) return

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setErrorMessage('Por favor sube un archivo en formato PDF (.pdf).')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage('El archivo excede el tamaño máximo permitido de 10 MB.')
      return
    }

    setSelectedFile(file)
    processPdfWithAi(file)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndProcessFile(e.dataTransfer.files[0])
    }
  }

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      validateAndProcessFile(e.target.files[0])
    }
  }

  const processPdfWithAi = async (file) => {
    setIsLoading(true)
    setProgressStep(1)

    try {
      // Step 1: Read PDF into Base64
      const reader = new FileReader()
      const base64Promise = new Promise((resolve, reject) => {
        reader.onload = () => resolve(reader.result)
        reader.onerror = () => reject(new Error('No se pudo leer el archivo local.'))
      })
      reader.readAsDataURL(file)
      const dataUrl = await base64Promise
      const base64 = dataUrl.split(',')[1]

      // Step 2: Send to serverless Cloudflare Pages Edge Function
      setProgressStep(2)

      const response = await fetch('/api/parse-cv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileBase64: base64,
          fileName: file.name
        })
      })

      const result = await response.json().catch(() => ({}))

      if (!response.ok || !result.success || !result.data) {
        throw new Error(result.error || 'No se pudo procesar la información del CV.')
      }

      // Step 3: Successfully structured
      setProgressStep(3)

      setTimeout(() => {
        onSuccess(result.data)
        onClose()
      }, 700)

    } catch (err) {
      console.error('[CvImportModal] Error processing PDF:', err)
      setErrorMessage(err.message || 'Ocurrió un error inesperado al procesar el archivo.')
      setIsLoading(false)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="cv-modal-title"
      className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 sm:p-6 bg-slate-900/70 backdrop-blur-md animate-fade-in"
    >
      <div 
        className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        {!isLoading && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar modal"
            className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200/60 dark:border-indigo-800/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-sm shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 id="cv-modal-title" className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
              Autocompletar con CV
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Sube tu currículum en PDF y la IA rellenará tu Studio en segundos.
            </p>
          </div>
        </div>

        {/* Dynamic Content: Upload Zone vs Loading State */}
        {!isLoading ? (
          <div className="mt-6 space-y-4">
            {/* Drag & Drop Area */}
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 ${
                dragActive
                  ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30 scale-[1.01]'
                  : 'border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600 bg-slate-50/60 dark:bg-slate-950/40'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf,.pdf"
                onChange={handleFileInput}
                className="hidden"
              />

              <div className="w-14 h-14 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-sm">
                <UploadCloud className="w-7 h-7 animate-pulse" />
              </div>

              <div className="space-y-1">
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  Sube tu CV en PDF aquí
                </p>
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold mt-1">
                <Zap className="w-3 h-3" />
                <span>Extracción multimodal con IA</span>
              </div>
            </div>

            {/* Error Message Display */}
            {errorMessage && (
              <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2.5 animate-shake">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold">{errorMessage}</p>
                </div>
              </div>
            )}

            {/* Privacy Note */}
            <p className="text-[11px] text-slate-400 dark:text-slate-500 text-center leading-relaxed">
              Tu documento se procesa en memoria únicamente para extraer los datos y no queda almacenado en ningún servidor.
            </p>
          </div>
        ) : (
          /* Processing / Loading Steps State */
          <div className="mt-8 mb-4 space-y-6 text-center">
            <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-indigo-100 dark:border-indigo-950 animate-pulse" />
              <div className="w-16 h-16 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <RefreshCw className="w-8 h-8 animate-spin text-indigo-600 dark:text-indigo-400" />
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                {progressStep === 1 && '1/3 Leyendo documento PDF...'}
                {progressStep === 2 && '2/3 Analizando trayectoria con IA...'}
                {progressStep === 3 && '3/3 ¡Poblando tu portafolio STUDIO!'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                {selectedFile?.name || 'Currículum Vitae'} — Extrayendo experiencia, educación, proyectos, habilidades e idiomas.
              </p>
            </div>

            {/* Progress Bar Indicator */}
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className="bg-indigo-600 h-full transition-all duration-500 rounded-full"
                style={{
                  width: progressStep === 1 ? '33%' : progressStep === 2 ? '75%' : '100%'
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
