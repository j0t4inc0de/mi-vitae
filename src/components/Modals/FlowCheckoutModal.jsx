import React, { useState, useEffect, useRef } from 'react'
import { useProfileStore } from '../../stores/profileStore'
import { saveTransactionToSupabase } from '../../lib/supabaseClient'
import { sendPaymentReceiptEmail } from '../../lib/emailService'
import { 
  getStoredCreatorCode, 
  setStoredCreatorCode, 
  sanitizeCreatorCode 
} from '../../lib/creatorCode'
import { 
  X, ShieldCheck, CheckCircle2, AlertCircle, 
  Download, ArrowRight, RefreshCw, Lock, Sparkles,
  Check, Copy, CreditCard, Smartphone, Landmark, Building2,
  Globe, DollarSign, ExternalLink, HelpCircle, Mail
} from 'lucide-react'

// Chilean Payment Methods supported by Flow.cl
const FLOW_PAYMENT_METHODS = [
  {
    id: 'webpay',
    name: 'Webpay Plus (Transbank)',
    desc: 'Tarjetas de Crédito, Débito (Redcompra) y Prepago',
    icon: CreditCard,
    iconColor: 'text-indigo-600 dark:text-indigo-400',
    popular: true,
    tags: ['Visa', 'Mastercard', 'Redcompra', 'Magna', 'AMEX']
  },
  {
    id: 'mach_chek',
    name: 'Mach / Chek / Billeteras',
    desc: 'Paga al instante con saldo de tu cuenta Mach o app Chek',
    icon: Smartphone,
    iconColor: 'text-purple-600 dark:text-purple-400',
    popular: false,
    tags: ['Mach', 'Chek', 'Fpay']
  },
  {
    id: 'servipag',
    name: 'Servipag',
    desc: 'Portal Servipag con Banco de Chile, BCI, Santander, etc.',
    icon: Landmark,
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    popular: false,
    tags: ['Servipag', 'Bancos']
  },
  {
    id: 'banco_estado',
    name: 'Banco Estado / Transferencia',
    desc: 'Transferencia electrónica simplificada o CuentaRUT',
    icon: Building2,
    iconColor: 'text-amber-600 dark:text-amber-400',
    popular: false,
    tags: ['CuentaRUT', 'Khipu', 'Multicaja']
  }
]


/**
 * Dynamically loads PayPal JS SDK v2 without npm packages
 */
function loadPayPalScript(clientId) {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') return reject(new Error('SSR environment'))
    if (window.paypal) return resolve(window.paypal)

    const scriptId = 'paypal-js-sdk-v2'
    const existingScript = document.getElementById(scriptId)
    if (existingScript) {
      if (window.paypal) return resolve(window.paypal)
      existingScript.addEventListener('load', () => resolve(window.paypal))
      existingScript.addEventListener('error', reject)
      return
    }

    const script = document.createElement('script')
    script.id = scriptId
    script.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(clientId)}&currency=USD`
    script.async = true
    script.onload = () => {
      if (window.paypal) {
        resolve(window.paypal)
      } else {
        reject(new Error('PayPal SDK loaded but window.paypal is undefined'))
      }
    }
    script.onerror = () => reject(new Error('Failed to load PayPal SDK from CDN'))
    document.head.appendChild(script)
  })
}

/**
 * Minimalist Crisp Chile Flag SVG Icon
 */
function ChileFlagIcon({ className = 'w-6 h-4' }) {
  return (
    <svg 
      viewBox="0 0 30 20" 
      className={`${className} rounded-[3px] shadow-xs shrink-0 overflow-hidden border border-slate-300/80 dark:border-slate-700/80`}
      aria-label="Bandera de Chile"
    >
      <rect x="0" y="10" width="30" height="10" fill="#D52B1E" />
      <rect x="10" y="0" width="20" height="10" fill="#FFFFFF" />
      <rect x="0" y="0" width="10" height="10" fill="#0039A6" />
      <polygon
        points="5,2.4 5.59,4.19 7.47,4.2 5.95,5.31 6.53,7.1 5,6 3.47,7.1 4.05,5.31 2.53,4.2 4.41,4.19"
        fill="#FFFFFF"
      />
    </svg>
  )
}

/**
 * Minimalist Crisp World Globe SVG Icon
 */
function WorldGlobeIcon({ className = 'w-[22px] h-[22px]' }) {
  return (
    <svg 
      viewBox="0 0 24 24" 
      className={`${className} shrink-0`}
      aria-label="Internacional"
    >
      <circle cx="12" cy="12" r="11.2" fill="#0079C1" />
      <ellipse cx="12" cy="12" rx="5" ry="11.2" fill="none" stroke="#FFFFFF" strokeWidth="1.3" strokeOpacity="0.9" />
      <line x1="0.8" y1="12" x2="23.2" y2="12" stroke="#FFFFFF" strokeWidth="1.3" strokeOpacity="0.9" />
      <path d="M3.5 7h17M3.5 17h17" fill="none" stroke="#FFFFFF" strokeWidth="1.1" strokeOpacity="0.75" />
      <circle cx="12" cy="12" r="11.2" fill="none" stroke="#FFFFFF" strokeWidth="1.2" strokeOpacity="0.3" />
    </svg>
  )
}

/**
 * FlowCheckoutModal - Multi-Gateway & Multi-Currency Checkout Modal
 * Pestaña 1: Chile ($3.490 CLP/mes vía Flow.cl)
 * Pestaña 2: Internacional ($3.99 USD/mes vía PayPal Checkout v2)
 * Incluye Sistema "Apoya a un Creador" estilo Epic Games
 */
export default function FlowCheckoutModal({ 
  isOpen, 
  onClose, 
  username, 
  planName = 'Suscripción Mi Vitae ($3.490 CLP/mes)', 
  amount = 3490 
}) {
  const profiles = useProfileStore((state) => state.profiles)
  const activeUsername = useProfileStore((state) => state.activeUsername)
  const updateProfile = useProfileStore((state) => state.updateProfile)
  const closeFlowModal = useProfileStore((state) => state.closeFlowModal)

  const targetUsername = username || activeUsername
  const currentProfile = (targetUsername && profiles[targetUsername]) || {}

  // Gateway Selector: 'flow' (Chile) | 'paypal' (Internacional)
  const [activeGateway, setActiveGateway] = useState('flow')

  // Payment states: 'select' | 'processing' | 'approved' | 'rejected' | 'error' | 'paypal_sim'
  const [paymentState, setPaymentState] = useState('select')
  const [selectedMethodId, setSelectedMethodId] = useState('webpay')
  const [payerEmail, setPayerEmail] = useState(currentProfile?.personalInfo?.email || 'usuario@mivitae.cl')
  const [payerRut, setPayerRut] = useState('18.765.432-1')
  const [processingMessage, setProcessingMessage] = useState('')
  const [transactionVoucher, setTransactionVoucher] = useState(null)
  const [voucherCopied, setVoucherCopied] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  // Creator / Referral Code ("Apoya a un creador")
  const [creatorCode, setCreatorCode] = useState(() => getStoredCreatorCode())
  const [inputCreatorCode, setInputCreatorCode] = useState('')
  const [isEditingCreatorCode, setIsEditingCreatorCode] = useState(false)
  const [creatorCodeFeedback, setCreatorCodeFeedback] = useState('')
  const [isEditingEmail, setIsEditingEmail] = useState(false)

  // PayPal SDK states
  const [isPayPalLoading, setIsPayPalLoading] = useState(false)
  const [isPayPalSdkReady, setIsPayPalSdkReady] = useState(false)
  const paypalContainerRef = useRef(null)

  // Client ID detection
  const paypalClientId = 
    (typeof window !== 'undefined' && window.__ENV__?.VITE_PAYPAL_CLIENT_ID) ||
    import.meta.env.VITE_PAYPAL_CLIENT_ID ||
    ''

  const hasValidPayPalClientId = Boolean(
    paypalClientId && 
    !paypalClientId.includes('client_id_aqui') && 
    !paypalClientId.includes('xxxxxxxx')
  )

  // Sync payer email & creator code on open
  useEffect(() => {
    if (currentProfile?.personalInfo?.email) {
      setPayerEmail(currentProfile.personalInfo.email)
    }
  }, [currentProfile])

  useEffect(() => {
    if (isOpen) {
      setCreatorCode(getStoredCreatorCode())
      setIsEditingCreatorCode(false)
      setInputCreatorCode('')
      setCreatorCodeFeedback('')
      setIsEditingEmail(false)
    }
  }, [isOpen])

  // Escape key handler
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && paymentState !== 'processing') {
        handleModalClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, paymentState])

  // Render PayPal Buttons when tab is active and Client ID is available
  useEffect(() => {
    let isCancelled = false

    if (isOpen && paymentState === 'select' && activeGateway === 'paypal' && hasValidPayPalClientId) {
      setIsPayPalLoading(true)

      loadPayPalScript(paypalClientId)
        .then((paypal) => {
          if (isCancelled || !paypal || !paypal.Buttons) return
          setIsPayPalSdkReady(true)
          setIsPayPalLoading(false)

          const container = document.getElementById('paypal-button-container')
          if (container && container.childNodes.length === 0) {
            paypal.Buttons({
              style: {
                layout: 'vertical',
                color: 'gold',
                shape: 'rect',
                label: 'paypal'
              },
              createOrder: (data, actions) => {
                return actions.order.create({
                  purchase_units: [{
                    description: 'Suscripción Mi Vitae Pro ($3.99 USD/mes)',
                    custom_id: JSON.stringify({
                      username: targetUsername,
                      creator_code: creatorCode || null
                    }),
                    amount: {
                      currency_code: 'USD',
                      value: '3.99'
                    }
                  }]
                })
              },
              onApprove: async (data, actions) => {
                setPaymentState('processing')
                setProcessingMessage('Capturando pago seguro con PayPal...')
                try {
                  const order = await actions.order.capture()
                  await handleCompletePayPalPayment(order.id, order)
                } catch (err) {
                  console.error('[PayPal] Error capturing order:', err)
                  setErrorMessage('Error al capturar la orden en PayPal. Por favor intenta de nuevo.')
                  setPaymentState('error')
                }
              },
              onError: (err) => {
                console.error('[PayPal] Error in button:', err)
                setErrorMessage('Ocurrió un error en el portal de PayPal. Puedes reintentar o usar otro método.')
                setPaymentState('error')
              }
            }).render('#paypal-button-container').catch(() => {})
          }
        })
        .catch((err) => {
          console.warn('[PayPal] Could not load SDK, activating local fallback:', err)
          if (!isCancelled) {
            setIsPayPalLoading(false)
            setIsPayPalSdkReady(false)
          }
        })
    }

    return () => { isCancelled = true }
  }, [isOpen, paymentState, activeGateway, hasValidPayPalClientId, targetUsername, creatorCode])

  if (!isOpen) return null

  const handleModalClose = () => {
    if (onClose) onClose()
    closeFlowModal()
    setTimeout(() => {
      setPaymentState('select')
      setTransactionVoucher(null)
      setErrorMessage('')
      setIsEditingEmail(false)
    }, 200)
  }

  // Handler: Apply creator code
  const handleApplyCreatorCode = (e) => {
    if (e) e.preventDefault()
    const sanitized = sanitizeCreatorCode(inputCreatorCode)
    if (!sanitized) {
      setCreatorCodeFeedback('Ingresa un código válido (alfanumérico, máx 30 caracteres)')
      return
    }
    setStoredCreatorCode(sanitized)
    setCreatorCode(sanitized)
    setInputCreatorCode('')
    setIsEditingCreatorCode(false)
    setCreatorCodeFeedback(`¡Código ${sanitized} aplicado!`)
    setTimeout(() => setCreatorCodeFeedback(''), 4000)
  }

  // Handler: Remove creator code
  const handleRemoveCreatorCode = () => {
    setStoredCreatorCode('')
    setCreatorCode('')
    setInputCreatorCode('')
    setIsEditingCreatorCode(false)
    setCreatorCodeFeedback('')
  }

  // =========================================================================
  // GATEWAY 1: FLOW.CL (CHILE - $3.490 CLP)
  // =========================================================================
  const handleProcessFlowPayment = async () => {
    setPaymentState('processing')
    setProcessingMessage('Conectando con la pasarela oficial Flow.cl en Chile...')
    setErrorMessage('')

    const selectedMethod = FLOW_PAYMENT_METHODS.find((m) => m.id === selectedMethodId)

    try {
      const response = await fetch('/api/create-flow-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          email: payerEmail,
          username: targetUsername,
          subject: planName,
          creator_code: creatorCode || undefined
        })
      })

      const result = await response.json().catch(() => ({}))

      if (response.ok && result.redirectUrl && result.isSimulation !== true) {
        // Record initiated transaction in Supabase
        await saveTransactionToSupabase({
          transactionId: result.commerceOrder,
          flowOrder: result.flowOrder,
          orderNumber: result.commerceOrder,
          username: targetUsername,
          amount,
          currency: 'CLP',
          status: 'PENDIENTE',
          paymentMethod: selectedMethod?.name || 'Flow.cl Webpay',
          payerEmail,
          creator_code: creatorCode || null,
          metadata: {
            creator_code: creatorCode || null
          }
        }).catch(() => {})

        // Redirect user to official Flow.cl portal
        window.location.href = result.redirectUrl
        return
      }

      setErrorMessage(
        result.error ||
        result.message ||
        'No se pudo generar la orden de pago en Flow.cl. Por favor verifica tus credenciales o intenta nuevamente.'
      )
      setPaymentState('error')
    } catch (err) {
      console.error('[FlowModal] Error connecting to Flow gateway:', err)
      setErrorMessage('Error de conexión con el servicio de pagos Flow.cl. Por favor intenta nuevamente.')
      setPaymentState('error')
    }
  }

  // =========================================================================
  // GATEWAY 2: PAYPAL CHECKOUT (INTERNACIONAL - $3.99 USD)
  // =========================================================================
  const handleCompletePayPalPayment = async (orderId, orderDetails = {}) => {
    const now = new Date()
    const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

    try {
      // 1. Update local state in Zustand store
      updateProfile(targetUsername, {
        plan: 'premium',
        planName: 'Suscripción Mi Vitae ($3.99 USD/mes)',
        planStatus: 'active',
        planExpiresAt: expiresAt.toISOString()
      })

      // 2. Record in Supabase
      await saveTransactionToSupabase({
        transactionId: orderId,
        orderNumber: orderId,
        username: targetUsername,
        amount: 3.99,
        currency: 'USD',
        status: 'APROBADO',
        paymentMethod: 'PayPal',
        authorizationCode: orderId,
        payerEmail: payerEmail,
        creator_code: creatorCode || null,
        metadata: {
          paypal_order_id: orderId,
          creator_code: creatorCode || null,
          details: orderDetails
        }
      }).catch(() => {})

      // 3. Send email receipt
      sendPaymentReceiptEmail({
        email: payerEmail,
        name: currentProfile?.personalInfo?.name || targetUsername,
        orderNumber: orderId,
        amount: '$3.99 USD',
        paymentMethod: 'PayPal',
        planName: 'Suscripción Mi Vitae ($3.99 USD/mes)'
      }).catch(() => {})

      // 4. Build voucher ticket
      setTransactionVoucher({
        transactionId: orderId,
        orderNumber: orderId,
        authorizationCode: `PP-${Date.now().toString(36).toUpperCase()}`,
        dateFormatted: now.toLocaleString('es-CL'),
        paymentMethod: 'PayPal (Tarjetas / Cuenta PayPal)',
        amount: 3.99,
        currency: 'USD',
        commerceName: 'Mi Vitae (PayPal Checkout)',
        payerEmail,
        payerRut: 'N/A (Internacional)',
        creatorCode: creatorCode || null
      })

      setPaymentState('approved')
    } catch (err) {
      console.error('[PayPal Completion] Error:', err)
      setErrorMessage('Error al completar el registro del pago con PayPal.')
      setPaymentState('error')
    }
  }

  // Local development simulation fallback for PayPal
  const handleSimulatePayPalPayment = async () => {
    setPaymentState('processing')
    setProcessingMessage('Simulando procesamiento seguro con PayPal ($3.99 USD)...')
    const simOrderId = `PP-SIM-${Date.now()}`
    await handleCompletePayPalPayment(simOrderId, { simulated: true })
  }

  // Download printable text voucher
  const handleDownloadVoucher = () => {
    if (!transactionVoucher) return

    const isUsd = transactionVoucher.currency === 'USD'
    const formattedAmount = isUsd 
      ? `$${transactionVoucher.amount.toFixed(2)} USD`
      : `$${transactionVoucher.amount.toLocaleString('es-CL')} CLP`

    const creatorLine = transactionVoucher.creatorCode
      ? `Creador Apoyado:     ${transactionVoucher.creatorCode}\n`
      : ''

    const voucherText = `
=====================================================
          COMPROBANTE OFICIAL DE PAGO
              Mi Vitae by We Are Samod
=====================================================
Estado:              APROBADO
Orden de Compra:     ${transactionVoucher.orderNumber}
ID Transacción:      ${transactionVoucher.transactionId}
Código Autorización: ${transactionVoucher.authorizationCode}
Fecha y Hora:        ${transactionVoucher.dateFormatted}
Medio de Pago:       ${transactionVoucher.paymentMethod}
Monto Total:         ${formattedAmount}
Pasarela / Comercio: ${transactionVoucher.commerceName || (isUsd ? 'PayPal Checkout' : 'Flow.cl')}
Usuario / Perfil:    @${targetUsername}
Email Pagador:       ${transactionVoucher.payerEmail}
RUT Pagador:         ${transactionVoucher.payerRut || 'N/A'}
${creatorLine}Detalle:             Suscripción Mi Vitae Premium (Activa)
=====================================================
Gracias por confiar en Mi Vitae para impulsar tu 
carrera y portafolio profesional online.
Soporte técnico: contacto@wearesamod.com
=====================================================
`.trim()

    const blob = new Blob([voucherText], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `comprobante-${isUsd ? 'paypal' : 'flow'}-${transactionVoucher.transactionId}.txt`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  // Copy transaction ID
  const handleCopyTransactionId = () => {
    if (!transactionVoucher) return
    navigator.clipboard?.writeText(transactionVoucher.transactionId)
    setVoucherCopied(true)
    setTimeout(() => setVoucherCopied(false), 2000)
  }

  // =========================================================================
  // SUB-COMPONENT: "APOYA A UN CREADOR" (Epic Games Style)
  // =========================================================================
  const renderCreatorCodeSection = () => {
    if (creatorCode && !isEditingCreatorCode) {
      return (
        <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 flex items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-1.5 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="min-w-0 text-xs">
              <span className="text-emerald-800 dark:text-emerald-300 font-semibold block sm:inline">
                ✨ Apoyando a:
              </span>
              <span className="font-mono font-black text-emerald-900 dark:text-emerald-200 bg-white dark:bg-slate-900 px-2 py-0.5 rounded-lg border border-emerald-300 dark:border-emerald-700 ml-0 sm:ml-1.5 text-xs tracking-wider">
                {creatorCode}
              </span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold ml-1.5">✓</span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                setIsEditingCreatorCode(true)
                setInputCreatorCode(creatorCode)
              }}
              className="text-[11px] font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white underline transition-colors cursor-pointer"
            >
              Cambiar
            </button>
            <button
              type="button"
              onClick={handleRemoveCreatorCode}
              className="text-[11px] font-bold text-rose-500 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 transition-colors cursor-pointer"
              title="Quitar código de creador"
            >
              Quitar
            </button>
          </div>
        </div>
      )
    }

    return (
      <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            <span>¿Tienes un código de creador?</span>
          </label>
          <span className="text-[10px] text-slate-400 font-medium">Opcional</span>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            value={inputCreatorCode}
            onChange={(e) => {
              setInputCreatorCode(e.target.value.toUpperCase())
              setCreatorCodeFeedback('')
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleApplyCreatorCode()
              }
            }}
            placeholder="EJ: CREADOR10"
            maxLength={30}
            className="flex-1 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-mono font-bold uppercase tracking-wider text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            type="button"
            onClick={handleApplyCreatorCode}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 text-xs font-bold transition-all cursor-pointer shadow-sm shrink-0"
          >
            Aplicar
          </button>
          {isEditingCreatorCode && (
            <button
              type="button"
              onClick={() => {
                setIsEditingCreatorCode(false)
                setInputCreatorCode('')
              }}
              className="px-2 py-2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              Cancelar
            </button>
          )}
        </div>

        {creatorCodeFeedback && (
          <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 animate-fadeIn">
            {creatorCodeFeedback}
          </p>
        )}
      </div>
    )
  }

  return (
    <div 
      className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md transition-all animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget && paymentState !== 'processing') {
          handleModalClose()
        }
      }}
    >
      
      {/* Modal Dialog Card */}
      <div 
        className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border overflow-hidden flex flex-col max-h-[92vh] transition-all"
        style={{
          borderColor: 'rgb(var(--primary-rgb, 77 94 179) / 0.3)',
          boxShadow: '0 25px 60px -15px var(--glow, rgba(77, 94, 179, 0.25))'
        }}
      >
        
        {/* Dynamic Gateway Header */}
        <div className={`p-5 sm:p-6 relative text-white transition-colors duration-300 ${
          activeGateway === 'flow' ? 'bg-[#677023]' : 'bg-[#003087]'
        }`}>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {activeGateway === 'flow' ? (
                // Flow.cl Chilean Brand Badge
                <div className="h-9 px-3 rounded-xl bg-black/35 border border-white/10 flex items-center justify-center font-black text-base tracking-tight shadow-md">
                  <span style={{ color: '#dbff00' }}>flow</span>
                  <span className="text-[10px] font-bold ml-0.5" style={{ color: '#dbff00' }}>.cl</span>
                </div>
              ) : (
                // PayPal Checkout International Brand Badge
                <div className="h-9 px-3.5 rounded-xl bg-white text-[#003087] flex items-center justify-center font-black text-base italic tracking-tight shadow-md">
                  <span className="text-[#003087]">Pay</span>
                  <span className="text-[#0079C1]">Pal</span>
                  <span className="text-[9px] font-sans font-bold not-italic ml-1 px-1.5 py-0.5 rounded bg-blue-100 text-[#003087]">
                    Checkout
                  </span>
                </div>
              )}

              <div>
                <div className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1 ${
                  activeGateway === 'flow' ? 'text-[#dbff00]' : 'text-cyan-300'
                }`}>
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>
                    {activeGateway === 'flow' ? 'Pasarela Oficial Chile' : 'Pasarela Internacional PayPal'}
                  </span>
                </div>
                <div className="text-sm font-semibold text-slate-100">
                  Mi Vitae <span className="text-xs text-slate-300 font-normal">by We Are Samod</span>
                </div>
              </div>
            </div>

            {paymentState !== 'processing' && (
              <button
                onClick={handleModalClose}
                className="p-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title="Cerrar ventana de pago"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Amount and Order Banner */}
          <div className="mt-4 pt-3 border-t border-white/15 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-slate-200">Total Mensual</span>
              <div className="text-2xl font-black text-white tracking-tight">
                {activeGateway === 'flow' ? (
                  <>
                    ${amount.toLocaleString('es-CL')}{' '}
                    <span className="text-xs font-bold" style={{ color: '#dbff00' }}>CLP</span>
                  </>
                ) : (
                  <>
                    $3.99{' '}
                    <span className="text-xs font-bold text-cyan-300">USD</span>
                  </>
                )}
              </div>
            </div>

            <div className="text-right">
              <div className="text-xs font-mono font-bold text-white bg-white/10 px-2.5 py-1 rounded-lg">
                @{targetUsername}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
          
          {/* ========================================================================= */}
          {/* GATEWAY SELECTOR TABS (Visible in 'select' mode) */}
          {/* ========================================================================= */}
          {paymentState === 'select' && (
            <div className="mb-6">
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                Selecciona País o Región de Facturación:
              </label>

              <div className="grid grid-cols-2 p-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-2xl gap-1.5 border border-slate-200 dark:border-slate-700/60">
                {/* Tab 1: Chile (Flow.cl) */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveGateway('flow')
                    setErrorMessage('')
                  }}
                  className={`flex items-center gap-2.5 py-2.5 px-3 rounded-xl text-left transition-all cursor-pointer ${
                    activeGateway === 'flow'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm ring-1 ring-slate-300 dark:ring-slate-700'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <div className="w-7 h-6 flex items-center justify-center shrink-0">
                    <ChileFlagIcon className="w-6 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs sm:text-sm font-bold truncate">Chile</div>
                    <div className="text-[11px] font-bold text-[#00A3E0] leading-none mt-0.5">
                      $3.490 CLP/mes
                    </div>
                  </div>
                </button>

                {/* Tab 2: Internacional (PayPal Checkout) */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveGateway('paypal')
                    setErrorMessage('')
                  }}
                  className={`flex items-center gap-2.5 py-2.5 px-3 rounded-xl text-left transition-all cursor-pointer ${
                    activeGateway === 'paypal'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm ring-1 ring-slate-300 dark:ring-slate-700'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <div className="w-7 h-6 flex items-center justify-center shrink-0">
                    <WorldGlobeIcon className="w-[22px] h-[22px]" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs sm:text-sm font-bold truncate">Internacional</div>
                    <div className="text-[11px] font-bold text-[#0079C1] dark:text-cyan-400 leading-none mt-0.5">
                      $3.99 USD/mes
                    </div>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* ========================================================================= */}
          {/* ========================================================================= */}
          {/* ========================================================================= */}
          {/* TAB 1 CONTENT: FLOW.CL CHILE (OPCIÓN C: ULTRA-COMPACT BAR) */}
          {/* ========================================================================= */}
          {paymentState === 'select' && activeGateway === 'flow' && (
            <div className="space-y-3 animate-fadeIn">
              
              {/* Barra de Medios Inline Ultra-Compacta */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-1.5 shrink-0">
                  <div className="h-5 px-1.5 rounded bg-[#677023] text-[#dbff00] font-black text-[11px] flex items-center justify-center border border-[#dbff00]/30 shadow-xs">
                    flow
                  </div>
                  <ChileFlagIcon className="w-5 h-3.5" />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Chile
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400 overflow-x-auto no-scrollbar">
                  <span className="bg-white dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                    Webpay
                  </span>
                  <span className="bg-white dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                    CuentaRUT
                  </span>
                  <span className="bg-white dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                    Mach
                  </span>
                  <span className="bg-white dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                    Servipag
                  </span>
                </div>
              </div>

              {/* Campo de Correo Directo y Limpio */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Correo para tu Comprobante de Pago:
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    value={payerEmail}
                    onChange={(e) => setPayerEmail(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#00A3E0]"
                    placeholder="correo@ejemplo.cl"
                  />
                </div>
              </div>

              {/* Support a Creator Section */}
              {renderCreatorCodeSection()}

              {/* Botón de Pago Principal */}
              <div className="pt-1.5 space-y-2">
                <button
                  type="button"
                  onClick={handleProcessFlowPayment}
                  className="font-sans flex justify-center gap-2.5 items-center w-full shadow-xl shadow-palette-primary/25 hover:shadow-palette-primary/35 text-sm sm:text-base text-white bg-palette-primary hover:bg-palette-hover font-bold rounded-2xl px-5 py-3.5 sm:py-4 group cursor-pointer transition-all active:scale-[0.99]"
                >
                  <span>Obtener Premium</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 16 19"
                    className="w-7 h-7 sm:w-8 sm:h-8 justify-end bg-white text-slate-900 transition-transform ease-out duration-300 rounded-full p-1.5 sm:p-2 rotate-45 shrink-0 shadow-xs group-hover:rotate-90"
                    aria-hidden="true"
                  >
                    <path
                      className="fill-slate-900"
                      d="M7 18C7 18.5523 7.44772 19 8 19C8.55228 19 9 18.5523 9 18H7ZM8.70711 0.292893C8.31658 -0.0976311 7.68342 -0.0976311 7.29289 0.292893L0.928932 6.65685C0.538408 7.04738 0.538408 7.68054 0.928932 8.07107C1.31946 8.46159 1.95262 8.46159 2.34315 8.07107L8 2.41421L13.6569 8.07107C14.0474 8.46159 14.6805 8.46159 15.0711 8.07107C15.4616 7.68054 15.4616 7.04738 15.0711 6.65685L8.70711 0.292893ZM9 18L9 1H7L7 18H9Z"
                    />
                  </svg>
                </button>

                <p className="text-[11px] text-center text-slate-400 dark:text-slate-500">
                  Conexión segura oficial con Flow.cl. Acreditación automática.
                </p>
              </div>

            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2 CONTENT: PAYPAL CHECKOUT (INTERNACIONAL - $3.99 USD) */}
          {/* ========================================================================= */}
          {paymentState === 'select' && activeGateway === 'paypal' && (
            <div className="space-y-3 animate-fadeIn">
              
              {/* Barra de Medios Inline Ultra-Compacta (Symmetrical to Tab 1 Flow) */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-1.5 shrink-0">
                  <div className="h-5 px-1.5 rounded bg-[#003087] text-white font-black text-[11px] flex items-center justify-center shadow-xs">
                    PayPal
                  </div>
                  <WorldGlobeIcon className="w-4 h-4" />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Global
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400 overflow-x-auto no-scrollbar">
                  <span className="bg-white dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                    Visa
                  </span>
                  <span className="bg-white dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                    Mastercard
                  </span>
                  <span className="bg-white dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                    AMEX
                  </span>
                  <span className="bg-white dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                    Saldo PayPal
                  </span>
                </div>
              </div>

              {/* Campo de Correo Directo y Limpio */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Correo para tu Comprobante de Pago:
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    value={payerEmail}
                    onChange={(e) => setPayerEmail(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#0079C1]"
                    placeholder="name@example.com"
                  />
                </div>
              </div>

              {/* Support a Creator Section */}
              {renderCreatorCodeSection()}

              {/* Official PayPal Buttons Container or Fallback */}
              <div className="pt-1.5 space-y-2">
                {hasValidPayPalClientId ? (
                  <div className="space-y-3">
                    {isPayPalLoading && (
                      <div className="py-6 flex items-center justify-center gap-2 text-xs font-semibold text-slate-500">
                        <div className="w-4 h-4 rounded-full border-2 border-[#003087] border-t-transparent animate-spin" />
                        <span>Cargando botones oficiales de PayPal...</span>
                      </div>
                    )}
                    {/* Official PayPal JS SDK Mount Point */}
                    <div id="paypal-button-container" className="min-h-[100px] relative z-0" />
                  </div>
                ) : (
                  // Local Development / Test Interactive Simulation Mode
                  <button
                    type="button"
                    onClick={handleSimulatePayPalPayment}
                    className="font-sans flex justify-center gap-2.5 items-center w-full shadow-xl shadow-palette-primary/25 hover:shadow-palette-primary/35 text-sm sm:text-base text-white bg-palette-primary hover:bg-palette-hover font-bold rounded-2xl px-5 py-3.5 sm:py-4 group cursor-pointer transition-all active:scale-[0.99]"
                  >
                    <span>Obtener Premium ($3.99 USD)</span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 16 19"
                      className="w-7 h-7 sm:w-8 sm:h-8 justify-end bg-white text-slate-900 transition-transform ease-out duration-300 rounded-full p-1.5 sm:p-2 rotate-45 shrink-0 shadow-xs group-hover:rotate-90"
                      aria-hidden="true"
                    >
                      <path
                        className="fill-slate-900"
                        d="M7 18C7 18.5523 7.44772 19 8 19C8.55228 19 9 18.5523 9 18H7ZM8.70711 0.292893C8.31658 -0.0976311 7.68342 -0.0976311 7.29289 0.292893L0.928932 6.65685C0.538408 7.04738 0.538408 7.68054 0.928932 8.07107C1.31946 8.46159 1.95262 8.46159 2.34315 8.07107L8 2.41421L13.6569 8.07107C14.0474 8.46159 14.6805 8.46159 15.0711 8.07107C15.4616 7.68054 15.4616 7.04738 15.0711 6.65685L8.70711 0.292893ZM9 18L9 1H7L7 18H9Z"
                      />
                    </svg>
                  </button>
                )}

                <p className="text-[11px] text-center text-slate-400 dark:text-slate-500">
                  Conexión segura oficial con PayPal Checkout v2. Acreditación automática.
                </p>

              </div>

            </div>
          )}

          {/* ========================================================================= */}
          {/* STATE: PROCESSING PAYMENT */}
          {/* ========================================================================= */}
          {paymentState === 'processing' && (
            <div className="py-12 text-center space-y-6">
              <div className="relative w-20 h-20 mx-auto">
                <div className="w-20 h-20 rounded-full border-4 border-slate-200 dark:border-slate-800 border-t-[#00A3E0] animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Lock className="w-7 h-7 text-[#00A3E0]" />
                </div>
              </div>

              <div>
                <h4 className="text-lg font-extrabold text-slate-900 dark:text-white">
                  Procesando transacción segura...
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-2 leading-relaxed font-medium">
                  {processingMessage}
                </p>
              </div>

              <div className="text-[11px] text-slate-400">
                Por favor, no cierres ni recargues esta ventana.
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STATE: APPROVED PAYMENT VOUCHER */}
          {/* ========================================================================= */}
          {paymentState === 'approved' && transactionVoucher && (
            <div className="space-y-6">
              
              {/* Success Header */}
              <div className="text-center">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3 shadow-lg">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <span className="text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  ¡Pago Aprobado con Éxito!
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
                  Comprobante Oficial de Pago
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Tu suscripción Mi Vitae Premium ha sido activada correctamente.
                </p>
              </div>

              {/* Official Voucher Ticket */}
              <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden space-y-3 font-sans">
                
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Código Transacción</span>
                    <div className="text-sm font-mono font-black text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                      <span className="truncate max-w-[200px]">{transactionVoucher.transactionId}</span>
                      <button
                        onClick={handleCopyTransactionId}
                        className="text-slate-400 hover:text-indigo-600 transition-colors"
                        title="Copiar ID"
                      >
                        {voucherCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Estado</span>
                    <div className="text-xs font-black px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                      APROBADO
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 block">Medio de Pago</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 truncate block">{transactionVoucher.paymentMethod}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 block">Fecha y Hora</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{transactionVoucher.dateFormatted}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 block">Orden de Compra</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200 truncate block">{transactionVoucher.orderNumber}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 block">Código Autorización</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200 truncate block">{transactionVoucher.authorizationCode}</span>
                  </div>

                  {transactionVoucher.creatorCode && (
                    <div className="col-span-2 pt-2 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Creador / Influencer Apoyado:</span>
                      </span>
                      <span className="font-mono font-black text-xs text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                        {transactionVoucher.creatorCode}
                      </span>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Monto Total Cargado</span>
                  <span className="text-lg font-black text-slate-900 dark:text-white">
                    {transactionVoucher.currency === 'USD' 
                      ? `$${transactionVoucher.amount.toFixed(2)} USD`
                      : `$${transactionVoucher.amount.toLocaleString('es-CL')} CLP`}
                  </span>
                </div>

              </div>

              {/* Action Buttons */}
              <div className="space-y-2.5 pt-2">
                <button
                  type="button"
                  onClick={handleDownloadVoucher}
                  className="w-full py-3 rounded-2xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs sm:text-sm border border-slate-300 dark:border-slate-700 transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                >
                  <Download className="w-4 h-4 text-[#003087] dark:text-cyan-400" />
                  <span>Descargar Comprobante Oficial (TXT/Voucher)</span>
                </button>

                <button
                  type="button"
                  onClick={handleModalClose}
                  className="w-full py-3.5 rounded-2xl bg-palette-primary hover:bg-palette-hover text-white font-extrabold text-sm shadow-xl shadow-palette-glow transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Continuar en el Dashboard Studio</span>
                </button>
              </div>

            </div>
          )}

          {/* ========================================================================= */}
          {/* STATE: ERROR / GATEWAY ISSUE */}
          {/* ========================================================================= */}
          {paymentState === 'error' && (
            <div className="text-center py-6 space-y-5">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-lg">
                <AlertCircle className="w-8 h-8" />
              </div>

              <div>
                <span className="text-xs font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  Aviso de Pasarela
                </span>
                <h3 className="text-xl font-black text-slate-900 dark:text-white mt-1">
                  No se pudo iniciar el pago
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 max-w-sm mx-auto mt-2 leading-relaxed">
                  {errorMessage || 'Ocurrió un error al contactar con el proveedor de pagos. Por favor intenta de nuevo en unos momentos.'}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setPaymentState('select')}
                  className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-[#00A3E0] hover:bg-[#0082B4] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer shadow-md"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Volver a intentar</span>
                </button>

                <button
                  type="button"
                  onClick={handleModalClose}
                  className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs sm:text-sm hover:bg-slate-200 transition-colors"
                >
                  <span>Cerrar</span>
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STATE: REJECTED PAYMENT */}
          {/* ========================================================================= */}
          {paymentState === 'rejected' && (
            <div className="text-center py-6 space-y-5">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 flex items-center justify-center shadow-lg">
                <AlertCircle className="w-8 h-8" />
              </div>

              <div>
                <span className="text-xs font-black uppercase tracking-wider text-rose-600 dark:text-rose-400">
                  Transacción Rechazada
                </span>
                <h3 className="text-xl font-black text-slate-900 dark:text-white mt-1">
                  El pago no pudo ser procesado
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-2 leading-relaxed">
                  La entidad bancaria rechazó la solicitud. Puedes intentar nuevamente o seleccionar otro medio de pago.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setPaymentState('select')}
                  className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-[#0F265C] hover:bg-[#163884] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Reintentar Pago</span>
                </button>

                <button
                  type="button"
                  onClick={handleModalClose}
                  className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs sm:text-sm hover:bg-slate-200 transition-colors"
                >
                  <span>Cerrar</span>
                </button>
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  )
}
