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
  Globe, DollarSign, ExternalLink, HelpCircle
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

// International Payment Features supported by PayPal Checkout
const PAYPAL_PAYMENT_FEATURES = [
  {
    id: 'paypal_cards',
    name: 'Tarjetas de Crédito / Débito (Sin cuenta PayPal)',
    desc: 'Visa, Mastercard, American Express directo como invitado (Guest Checkout)',
    tags: ['Visa', 'Mastercard', 'AMEX', 'Guest Checkout']
  },
  {
    id: 'paypal_account',
    name: 'Cuenta PayPal Express',
    desc: 'Paga en 1-clic con tu saldo PayPal, cuenta bancaria o tarjetas vinculadas',
    tags: ['PayPal Balance', 'One-Touch', 'Global']
  },
  {
    id: 'paypal_security',
    name: 'Protección al Comprador PayPal',
    desc: 'Cifrado de extremo a extremo y garantía de transacción segura a nivel global',
    tags: ['Protección al Comprador', 'SSL 256-Bit', 'USD Oficial']
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
 * FlowCheckoutModal - Multi-Gateway & Multi-Currency Checkout Modal
 * Pestaña 1: 🇨🇱 Chile ($3.490 CLP/mes vía Flow.cl)
 * Pestaña 2: 🌎 Internacional ($3.99 USD/mes vía PayPal Checkout v2)
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

  // Gateway Selector: 'flow' (🇨🇱 Chile) | 'paypal' (🌎 Internacional)
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

  // PayPal SDK states
  const [isPayPalLoading, setIsPayPalLoading] = useState(false)
  const [isPayPalSdkReady, setIsPayPalSdkReady] = useState(false)
  const paypalContainerRef = useRef(null)

  // Client ID detection (with production live fallback)
  const FALLBACK_PAYPAL_CLIENT_ID = 'BAA8nZL3M_Z7gn4WjL8BkiMslKIDYrevDfGRKz7TduJ8Aysm_tMTMaaxeN79NE3_4Xb_1AL_tNRPQmJy78'

  const paypalClientId = 
    (typeof window !== 'undefined' && window.__ENV__?.VITE_PAYPAL_CLIENT_ID) ||
    import.meta.env.VITE_PAYPAL_CLIENT_ID ||
    FALLBACK_PAYPAL_CLIENT_ID

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
            <span>¿Tienes un código de creador / influencer?</span>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md transition-all animate-fadeIn">
      
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
          activeGateway === 'flow' ? 'bg-[#0F265C]' : 'bg-[#003087]'
        }`}>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {activeGateway === 'flow' ? (
                // Flow.cl Chilean Brand Badge
                <div className="h-9 px-3 rounded-xl bg-gradient-to-r from-[#00A3E0] to-[#27AE60] flex items-center justify-center font-black text-white text-base tracking-tight shadow-md">
                  <span>flow</span>
                  <span className="text-[10px] font-bold ml-1 opacity-90">.cl</span>
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
                <div className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>
                    {activeGateway === 'flow' ? 'Pasarela Oficial Chile' : 'Pasarela Internacional PayPal'}
                  </span>
                </div>
                <div className="text-sm font-semibold text-slate-200">
                  Mi Vitae <span className="text-xs text-slate-400 font-normal">by We Are Samod</span>
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
              <span className="text-[11px] text-slate-300">Total Mensual</span>
              <div className="text-2xl font-black text-white tracking-tight">
                {activeGateway === 'flow' ? (
                  <>
                    ${amount.toLocaleString('es-CL')}{' '}
                    <span className="text-xs font-bold text-cyan-300">CLP</span>
                  </>
                ) : (
                  <>
                    $3.99{' '}
                    <span className="text-xs font-bold text-emerald-300">USD</span>
                  </>
                )}
              </div>
            </div>

            <div className="text-right">
              <span className="text-[11px] text-slate-300">Usuario Asignado</span>
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
                  <span className="text-2xl shrink-0">🇨🇱</span>
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
                  <span className="text-2xl shrink-0">🌎</span>
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
          {/* TAB 1 CONTENT: FLOW.CL CHILE */}
          {/* ========================================================================= */}
          {paymentState === 'select' && activeGateway === 'flow' && (
            <div className="space-y-5 animate-fadeIn">
              
              {/* Flow Security Banner */}
              <div className="p-3.5 rounded-2xl bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800 text-xs text-cyan-900 dark:text-cyan-200 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-[#00A3E0] shrink-0 mt-0.5" />
                <div className="text-[11px] leading-relaxed">
                  <strong>Pago Seguro en Chile con Flow.cl:</strong> Serás redirigido a los servidores seguros y oficiales de Flow para procesar tu pago de forma encriptada vía Webpay, BancoEstado o transferencias electrónicas.
                </div>
              </div>

              {/* Payment Method Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2.5">
                  Selecciona tu Medio de Pago en Chile
                </label>

                <div className="space-y-2.5">
                  {FLOW_PAYMENT_METHODS.map((method) => {
                    const isSelected = selectedMethodId === method.id
                    return (
                      <button
                        key={method.id}
                        type="button"
                        onClick={() => setSelectedMethodId(method.id)}
                        className={`w-full p-3.5 rounded-2xl border text-left transition-all flex items-start gap-3.5 cursor-pointer ${
                          isSelected
                            ? 'border-[#00A3E0] bg-cyan-50/40 dark:bg-cyan-950/20 ring-2 ring-[#00A3E0]/20'
                            : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 hover:border-slate-300'
                        }`}
                      >
                        <div className="shrink-0 p-2 rounded-xl bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 flex items-center justify-center">
                          <method.icon className={`w-5 h-5 ${method.iconColor}`} />
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                              {method.name}
                            </h4>
                            {method.popular && (
                              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                                Más Usado
                              </span>
                            )}
                          </div>
                          
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            {method.desc}
                          </p>

                          <div className="flex flex-wrap gap-1 mt-2">
                            {method.tags.map((tag) => (
                              <span
                                key={tag}
                                className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className={`w-4 h-4 rounded-full border mt-1 flex items-center justify-center shrink-0 ${
                          isSelected ? 'border-[#00A3E0] bg-[#00A3E0] text-white' : 'border-slate-400'
                        }`}>
                          {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Payer Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Email para el Comprobante
                  </label>
                  <input
                    type="email"
                    value={payerEmail}
                    onChange={(e) => setPayerEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#00A3E0]"
                    placeholder="correo@ejemplo.cl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    RUT del Titular (Opcional)
                  </label>
                  <input
                    type="text"
                    value={payerRut}
                    onChange={(e) => setPayerRut(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#00A3E0]"
                    placeholder="12.345.678-9"
                  />
                </div>
              </div>

              {/* Support a Creator Section */}
              {renderCreatorCodeSection()}

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2.5">
                <button
                  type="button"
                  onClick={handleProcessFlowPayment}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#00A3E0] via-[#0082B4] to-[#0F265C] hover:from-[#0082B4] hover:to-[#0F265C] text-white font-black text-sm sm:text-base shadow-xl shadow-[#00A3E0]/25 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Lock className="w-5 h-5" />
                  <span>Continuar a Flow.cl ($3.490 CLP)</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <div className="flex items-center justify-center pt-1 text-xs">
                  <button
                    type="button"
                    onClick={handleModalClose}
                    className="text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors font-medium cursor-pointer"
                  >
                    Cancelar y Volver
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2 CONTENT: PAYPAL CHECKOUT (INTERNACIONAL - $3.99 USD) */}
          {/* ========================================================================= */}
          {paymentState === 'select' && activeGateway === 'paypal' && (
            <div className="space-y-5 animate-fadeIn">
              
              {/* PayPal Trust Banner */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 border border-blue-200 dark:border-blue-800/60 text-xs text-blue-950 dark:text-blue-200 flex items-start gap-3">
                <Globe className="w-5 h-5 text-[#003087] dark:text-cyan-400 shrink-0 mt-0.5" />
                <div className="text-[11px] leading-relaxed">
                  <strong>Facturación Global en USD con PayPal:</strong> Paga con tarjeta de débito o crédito internacional sin necesidad de registrarte (Guest Checkout), o mediante tu saldo de cuenta PayPal de manera 100% segura.
                </div>
              </div>

              {/* Supported Global Payment Features */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2.5">
                  Medios de Pago Internacionales Soportados
                </label>

                <div className="space-y-2.5">
                  {PAYPAL_PAYMENT_FEATURES.map((feat) => (
                    <div 
                      key={feat.id}
                      className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex items-start gap-3"
                    >
                      <div className="shrink-0 p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[#003087] dark:text-cyan-400">
                        <CreditCard className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-xs text-slate-900 dark:text-white">
                          {feat.name}
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {feat.desc}
                        </p>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {feat.tags.map((tag) => (
                            <span 
                              key={tag}
                              className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/40"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* International Payer Email Input */}
              <div className="pt-1">
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Correo Electrónico para la Cuenta y Recibo Internacional
                </label>
                <input
                  type="email"
                  value={payerEmail}
                  onChange={(e) => setPayerEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#0079C1]"
                  placeholder="name@example.com"
                />
              </div>

              {/* Support a Creator Section */}
              {renderCreatorCodeSection()}

              {/* Official PayPal Buttons Container or Fallback */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
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
                  <div className="space-y-3">
                    <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-200 text-xs">
                      <div className="font-bold flex items-center gap-1.5">
                        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>Modo Simulación de PayPal Activo</span>
                      </div>
                      <p className="text-[11px] text-amber-800 dark:text-amber-300 mt-1">
                        Configura <code>VITE_PAYPAL_CLIENT_ID</code> para desplegar los botones en vivo. Puedes simular el pago internacional con 1 clic para validar la activación del plan y la base de datos.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleSimulatePayPalPayment}
                      className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#FFC439] via-[#FFB700] to-[#E5A500] hover:from-[#FFB700] hover:to-[#E5A500] text-[#003087] font-black text-sm sm:text-base shadow-lg shadow-amber-500/20 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Lock className="w-5 h-5 text-[#003087]" />
                      <span>Pagar con PayPal ($3.99 USD/mes)</span>
                      <ArrowRight className="w-4 h-4 text-[#003087]" />
                    </button>
                  </div>
                )}

                <div className="flex items-center justify-center pt-1 text-xs">
                  <button
                    type="button"
                    onClick={handleModalClose}
                    className="text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors font-medium cursor-pointer"
                  >
                    Cancelar y Volver
                  </button>
                </div>
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
