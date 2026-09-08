import React, { useState, useEffect } from 'react'
import { useProfileStore } from '../../stores/profileStore'
import { 
  X, ShieldCheck, CheckCircle2, AlertCircle, 
  Download, ArrowRight, RefreshCw, Lock, Sparkles,
  Check, Copy, CreditCard, Smartphone, Landmark, Building2
} from 'lucide-react'

// Chilean Payment Methods supported by Flow.cl
const PAYMENT_METHODS = [
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
 * FlowCheckoutModal - Simulation of Flow.cl Chilean Payment Gateway
 */
export default function FlowCheckoutModal({ isOpen, onClose, username, planName = 'Suscripción Mi Vitae ($3.490 CLP/mes)', amount = 3490 }) {
  const profiles = useProfileStore((state) => state.profiles)
  const activeUsername = useProfileStore((state) => state.activeUsername)
  const upgradeToPremium = useProfileStore((state) => state.upgradeToPremium)
  const closeFlowModal = useProfileStore((state) => state.closeFlowModal)

  const targetUsername = username || activeUsername
  const currentProfile = profiles[targetUsername] || Object.values(profiles)[0]

  // Flow payment states: 'select' | 'processing' | 'approved' | 'rejected'
  const [paymentState, setPaymentState] = useState('select')
  const [selectedMethodId, setSelectedMethodId] = useState('webpay')
  const [payerEmail, setPayerEmail] = useState(currentProfile?.personalInfo?.email || 'usuario@mivitae.cl')
  const [payerRut, setPayerRut] = useState('18.765.432-1')
  const [processingMessage, setProcessingMessage] = useState('')
  const [transactionVoucher, setTransactionVoucher] = useState(null)
  const [voucherCopied, setVoucherCopied] = useState(false)

  // Sync payer email if profile changes
  useEffect(() => {
    if (currentProfile?.personalInfo?.email) {
      setPayerEmail(currentProfile.personalInfo.email)
    }
  }, [currentProfile])

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

  if (!isOpen) return null

  const handleModalClose = () => {
    if (onClose) onClose()
    closeFlowModal()
    setTimeout(() => {
      setPaymentState('select')
      setTransactionVoucher(null)
    }, 200)
  }

  // Simulation: Successful Payment
  const handleSimulateSuccess = () => {
    setPaymentState('processing')
    setProcessingMessage('Conectando de forma segura con los servidores de Flow.cl y Transbank...')

    setTimeout(() => {
      setProcessingMessage('Validando autorización bancaria y generando token de seguridad...')
    }, 800)

    setTimeout(() => {
      const selectedMethod = PAYMENT_METHODS.find((m) => m.id === selectedMethodId)
      const randomFlwId = `FLW-${Math.floor(100000 + Math.random() * 900000)}`
      const randomAuthCode = String(Math.floor(100000 + Math.random() * 900000))
      const now = new Date()
      
      const formattedDate = now.toLocaleDateString('es-CL', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })

      const transactionData = {
        transactionId: randomFlwId,
        authorizationCode: randomAuthCode,
        amount,
        currency: 'CLP',
        paymentMethod: selectedMethod?.name || 'Webpay Plus',
        payerEmail,
        payerRut,
        dateFormatted: formattedDate,
        dateIso: now.toISOString(),
        orderNumber: `ORD-${Date.now().toString().slice(-6)}`,
        status: 'APROBADO',
        commerceName: 'Mi Vitae by We Are Samod'
      }

      // Upgrade in Zustand store
      upgradeToPremium(targetUsername, transactionData)

      setTransactionVoucher(transactionData)
      setPaymentState('approved')
    }, 1700)
  }

  // Simulation: Rejected Payment
  const handleSimulateRejected = () => {
    setPaymentState('processing')
    setProcessingMessage('Conectando con la entidad bancaria emisora...')

    setTimeout(() => {
      setPaymentState('rejected')
    }, 1200)
  }

  // Download printable text voucher
  const handleDownloadVoucher = () => {
    if (!transactionVoucher) return

    const voucherText = `
=====================================================
          COMPROBANTE OFICIAL DE PAGO FLOW.CL
                Mi Vitae by We Are Samod
=====================================================
Estado:              APROBADO
Orden de Compra:     ${transactionVoucher.orderNumber}
ID Transacción Flow: ${transactionVoucher.transactionId}
Código Autorización: ${transactionVoucher.authorizationCode}
Fecha y Hora:        ${transactionVoucher.dateFormatted}
Medio de Pago:       ${transactionVoucher.paymentMethod}
Monto Total:         $${transactionVoucher.amount.toLocaleString('es-CL')} CLP
Comercio:            ${transactionVoucher.commerceName}
Usuario / Perfil:    @${targetUsername}
Email Pagador:       ${transactionVoucher.payerEmail}
RUT Pagador:         ${transactionVoucher.payerRut}
Detalle:             Suscripción ${planName} (Activa)
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
    link.download = `comprobante-flow-${transactionVoucher.transactionId}.txt`
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md transition-all animate-fadeIn">
      
      {/* Modal Dialog Card */}
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Flow.cl Chilean Brand Header */}
        <div className="bg-[#0F265C] text-white p-5 sm:p-6 relative">
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Flow.cl Logo simulation badge */}
              <div className="h-9 px-3 rounded-xl bg-gradient-to-r from-[#00A3E0] to-[#27AE60] flex items-center justify-center font-black text-white text-base tracking-tight shadow-md">
                <span>flow</span>
                <span className="text-[10px] font-bold ml-1 opacity-90">.cl</span>
              </div>

              <div>
                <div className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Pasarela de Pago Segura</span>
                </div>
                <div className="text-sm font-semibold text-slate-200">
                  Mi Vitae <span className="text-xs text-slate-400 font-normal">by We Are Samod</span>
                </div>
              </div>
            </div>

            {paymentState !== 'processing' && (
              <button
                onClick={handleModalClose}
                className="p-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                title="Cerrar ventana de pago"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Amount and Order Banner */}
          <div className="mt-4 pt-3 border-t border-white/15 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-slate-300">Total a Pagar</span>
              <div className="text-2xl font-black text-white tracking-tight">
                ${amount.toLocaleString('es-CL')}{' '}
                <span className="text-xs font-bold text-cyan-300">CLP</span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[11px] text-slate-300">Usuario</span>
              <div className="text-xs font-mono font-bold text-white bg-white/10 px-2.5 py-1 rounded-lg">
                @{targetUsername}
              </div>
            </div>
          </div>

          {/* Sandbox Indicator Pill */}
          <div className="absolute top-2 right-12 hidden sm:flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-[10px] font-bold uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            <span>Sandbox Mode</span>
          </div>

        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
          
          {/* ========================================================================= */}
          {/* STATE: PAYMENT SELECTION */}
          {/* ========================================================================= */}
          {paymentState === 'select' && (
            <div className="space-y-6">
              
              {/* Sandbox Notice Banner */}
              <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="text-[11px] leading-relaxed">
                  <strong>Entorno de Pruebas Flow.cl:</strong> Esta es una simulación interactiva oficial. Puedes probar la pasarela sin ingresar tarjetas reales haciendo clic en el botón de simulación abajo.
                </div>
              </div>

              {/* Payment Method Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-3">
                  Selecciona tu Medio de Pago en Chile
                </label>

                <div className="space-y-2.5">
                  {PAYMENT_METHODS.map((method) => {
                    const isSelected = selectedMethodId === method.id
                    return (
                      <button
                        key={method.id}
                        type="button"
                        onClick={() => setSelectedMethodId(method.id)}
                        className={`w-full p-4 rounded-2xl border text-left transition-all flex items-start gap-3.5 cursor-pointer ${
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
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

              {/* Interactive Sandbox Action Buttons */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2.5">
                <button
                  type="button"
                  onClick={handleSimulateSuccess}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-600 to-emerald-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black text-sm sm:text-base shadow-xl shadow-emerald-500/25 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ShieldCheck className="w-5 h-5" />
                  <span>Simular Pago Exitoso ($3.490 CLP)</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <div className="flex items-center justify-between gap-3 text-xs pt-1">
                  <button
                    type="button"
                    onClick={handleSimulateRejected}
                    className="text-slate-500 hover:text-rose-500 dark:hover:text-rose-400 transition-colors font-medium cursor-pointer"
                  >
                    Simular Pago Rechazado
                  </button>

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
                  Procesando transacción con Flow.cl...
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
                  Comprobante de Pago Flow.cl
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Tu suscripción Mi Vitae ha sido activada correctamente.
                </p>
              </div>

              {/* Official Voucher Ticket */}
              <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden space-y-3 font-sans">
                
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Código Transacción</span>
                    <div className="text-sm font-mono font-black text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                      <span>{transactionVoucher.transactionId}</span>
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
                    <span className="font-bold text-slate-800 dark:text-slate-200">{transactionVoucher.paymentMethod}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 block">Fecha y Hora</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{transactionVoucher.dateFormatted}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 block">Orden de Compra</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{transactionVoucher.orderNumber}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 block">Código Autorización</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{transactionVoucher.authorizationCode}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Monto Total Cargado</span>
                  <span className="text-lg font-black text-slate-900 dark:text-white">
                    ${transactionVoucher.amount.toLocaleString('es-CL')} CLP
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
                  <Download className="w-4 h-4 text-[#00A3E0]" />
                  <span>Descargar Comprobante Oficial (TXT/Voucher)</span>
                </button>

                <button
                  type="button"
                  onClick={handleModalClose}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-extrabold text-sm shadow-xl shadow-indigo-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Continuar en el Dashboard Studio</span>
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
                  La entidad bancaria rechazó la solicitud (código de rechazo simulado #05). Puedes intentar nuevamente o seleccionar otro medio de pago.
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
