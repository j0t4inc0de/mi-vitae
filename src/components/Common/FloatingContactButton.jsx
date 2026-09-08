import React from 'react'
import { MessageCircle, Linkedin, Mail, Phone, QrCode, ArrowUpRight } from 'lucide-react'
import { useProfileStore } from '../../stores/profileStore'

/**
 * FloatingContactButton - High-converting floating contact trigger with direct WhatsApp, LinkedIn, Email or Phone.
 * Connected to Zustand store to record user interaction analytics.
 * @param {object} profile - Complete profile object
 * @param {function} onOpenQr - Optional callback to trigger the QR Modal
 */
export default function FloatingContactButton({ profile, onOpenQr }) {
  // ponytail: direct Zustand selector & native Tailwind styling, zero superfluous states
  const recordClick = useProfileStore((state) => state.recordClick)

  if (!profile || profile.floatingButton?.enabled === false) {
    return null
  }


  const { type = 'whatsapp', customMessage = '' } = profile.floatingButton || {}
  const { personalInfo = {}, username } = profile

  const handleClick = (e) => {
    recordClick(username, 'contact')
  }

  let href = '#'
  let icon = <MessageCircle className="w-5 h-5 fill-current" />
  let label = 'WhatsApp Directo'
  let colorClasses = 'bg-[#25D366] hover:bg-[#20ba59] text-white shadow-emerald-500/40 ring-4 ring-[#25D366]/20'
  let target = '_blank'

  if (type === 'whatsapp') {
    const rawNumber = personalInfo.whatsapp || personalInfo.phone || ''
    const cleanNumber = rawNumber.replace(/\D/g, '')
    const defaultGreeting = `Hola ${personalInfo.name || ''}, vi tu portafolio en Mi Vitae y me gustaría conversar sobre un proyecto / consulta.`
    const encodedMsg = encodeURIComponent(customMessage || defaultGreeting)
    href = `https://wa.me/${cleanNumber}?text=${encodedMsg}`
    icon = <MessageCircle className="w-5 h-5 fill-current" />
    label = 'WhatsApp Directo'
    colorClasses = 'bg-[#25D366] hover:bg-[#20ba59] text-white shadow-emerald-500/40 ring-4 ring-[#25D366]/20'
    target = '_blank'
  } else if (type === 'linkedin') {
    href = personalInfo.linkedin || '#'
    icon = <Linkedin className="w-5 h-5 fill-current" />
    label = 'Conectar en LinkedIn'
    colorClasses = 'bg-[#0A66C2] hover:bg-[#084e96] text-white shadow-blue-500/40 ring-4 ring-[#0A66C2]/20'
    target = '_blank'
  } else if (type === 'email') {
    const email = personalInfo.email || ''
    const subject = encodeURIComponent(`Contacto desde Mi Vitae — ${personalInfo.name || ''}`)
    const body = encodeURIComponent(customMessage || `Hola ${personalInfo.name || ''},\n\nTe contacto luego de revisar tu portafolio en Mi Vitae.`)
    href = `mailto:${email}?subject=${subject}&body=${body}`
    icon = <Mail className="w-5 h-5" />
    label = 'Enviar Correo Directo'
    colorClasses = 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/40 ring-4 ring-indigo-600/20'
    target = '_self'
  } else if (type === 'phone') {
    const phone = personalInfo.phone || personalInfo.whatsapp || ''
    href = `tel:${phone}`
    icon = <Phone className="w-5 h-5" />
    label = 'Llamar por Teléfono'
    colorClasses = 'bg-slate-900 hover:bg-slate-800 text-white shadow-slate-900/40 ring-4 ring-slate-900/20'
    target = '_self'
  }

  return (
    <aside 
      aria-label="Contacto rápido" 
      className="fixed bottom-4 right-3 sm:bottom-6 sm:right-6 z-50 flex flex-col items-end gap-2 sm:gap-2.5 group"
      style={{ position: 'fixed', zIndex: 9999 }}
    >
      
      {/* Optional QR Code shortcut button on hover */}
      {onOpenQr && (
        <button
          onClick={onOpenQr}
          title="Ver código QR para tarjetas"
          className="p-2 sm:p-2.5 rounded-full bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-md hover:scale-110 hover:bg-indigo-50 dark:hover:bg-slate-700 transition-all duration-300 opacity-90 group-hover:opacity-100"
        >
          <QrCode className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-600 dark:text-indigo-400" />
        </button>
      )}

      {/* Main Floating Action Button */}
      <a
        href={href}
        target={target}
        rel={target === '_blank' ? 'noopener noreferrer' : undefined}
        onClick={handleClick}
        className={`flex items-center gap-1.5 sm:gap-2.5 px-3.5 py-2 sm:px-5 sm:py-3.5 rounded-full shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer select-none backdrop-blur-md ${colorClasses}`}
      >
        <span className="relative flex items-center justify-center">
          {icon}
          {/* Subtle live radar ping */}
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-white/80 animate-ping" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-white shadow-sm" />
        </span>

        <span className="text-xs sm:text-sm font-bold tracking-tight whitespace-nowrap pr-1">
          {label}
        </span>

        <ArrowUpRight className="w-3.5 h-3.5 opacity-80 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
      </a>

    </aside>
  )
}
