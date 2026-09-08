import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from '../router/Router'
import { useProfileStore } from '../stores/profileStore'
import MiVitaeLogo from '../components/Common/MiVitaeLogo'
import { 
  Sparkles, CheckCircle2, ArrowRight, ShieldCheck, Zap, 
  Smartphone, QrCode, FileText, Palette, Users, Layers, Star,
  Check, X, ChevronDown, ChevronUp, Globe, ExternalLink, 
  MessageCircle, Eye, Download, HelpCircle, CreditCard, Lock,
  TrendingUp, Send, Terminal, Briefcase, Code2, HeartHandshake,
  Award, AlertCircle, Clock, Share2, Shield, BarChart3
} from 'lucide-react'

export default function LandingPage() {
  const navigate = useNavigate()
  const profiles = useProfileStore((state) => state.profiles)
  const isUsernameAvailable = useProfileStore((state) => state.isUsernameAvailable)
  const addProfile = useProfileStore((state) => state.addProfile)
  const setActiveUsername = useProfileStore((state) => state.setActiveUsername)
  const openRegisterModal = useProfileStore((state) => state.openRegisterModal)
  const openFlowModal = useProfileStore((state) => state.openFlowModal)

  // Simulator Theme Selection
  const [selectedThemeKey, setSelectedThemeKey] = useState('tech')
  
  // Real-time username input & debounce
  const [inputUsername, setInputUsername] = useState('')
  const [debouncedUsername, setDebouncedUsername] = useState('')
  const [isChecking, setIsChecking] = useState(false)

  // FAQ open index state
  const [openFaqIndex, setOpenFaqIndex] = useState(0)

  // Debounce handling for username validator
  useEffect(() => {
    if (!inputUsername) {
      setDebouncedUsername('')
      setIsChecking(false)
      return
    }

    setIsChecking(true)
    const handler = setTimeout(() => {
      setDebouncedUsername(inputUsername.trim().toLowerCase().replace(/[^a-z0-9_-]/g, ''))
      setIsChecking(false)
    }, 300)

    return () => clearTimeout(handler)
  }, [inputUsername])

  const cleanInput = debouncedUsername
  const isAvailable = cleanInput.length >= 3 ? isUsernameAvailable(cleanInput) : null

  // Username claim submission handler
  const handleClaimUsername = (e) => {
    if (e) e.preventDefault()
    if (!cleanInput || cleanInput.length < 3) {
      openRegisterModal({ theme: selectedThemeKey })
      return
    }

    if (isAvailable) {
      openRegisterModal({ username: cleanInput, theme: selectedThemeKey })
    } else {
      setActiveUsername(cleanInput)
      navigate('/dashboard')
    }
  }

  const handleSuggestionClick = (suggested) => {
    setInputUsername(suggested)
  }

  const scrollToSection = (id) => {
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' })
    }
  }

  // FAQ data (Anti-Objeciones)
  const faqs = [
    {
      q: '¿Necesito conocimientos técnicos de programación o diseño?',
      a: 'Ninguno. La plataforma es 100% intuitiva y sin código. Puedes completar tus datos, agregar proyectos y cambiar de diseño en 5 minutos directamente desde tu celular o computador.'
    },
    {
      q: '¿Cómo funciona la promoción del 1er mes gratis con el formulario de feedback?',
      a: 'Al crear tu cuenta, respondes un breve formulario de 3 preguntas sobre tu experiencia. Al completarlo, tu primer mes queda 100% bonificado ($0 CLP) sin cobros automáticos sorpresivos.'
    },
    {
      q: '¿Por qué un portafolio web es mucho más efectivo que un currículum tradicional en PDF?',
      a: 'Un portafolio web interactivo permite mostrar proyectos reales con enlaces, imágenes en alta resolución, testimonios y botones de WhatsApp directo con 1 toque. No se vuelve obsoleto como un PDF y destaca de inmediato ante clientes y reclutadores.'
    },
    {
      q: '¿Puedo usar mi propio enlace personalizado o conectar un dominio corporativo?',
      a: '¡Totalmente! Al registrarte obtienes tu enlace único e intransferible mi-vitae.wearesamod.com/[tu-usuario]. Además, puedes conectar un dominio propio (.cl o .com) con certificado SSL gratuito.'
    },
    {
      q: '¿Qué garantía tengo y cómo puedo cancelar si no deseo continuar?',
      a: 'Tienes total libertad: no existen contratos forzosos ni plazos mínimos. Puedes cancelar tu suscripción con 1 solo clic desde tu panel o escribiéndonos a soporte de We Are Samod.'
    }
  ]

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 selection:bg-palette-primary selection:text-white font-sans">
      
      {/* ========================================================================= */}
      {/* 1. HERO SECTION & LIVE INTERACTIVE SIMULATOR */}
      {/* ========================================================================= */}
      <section className="relative overflow-hidden pt-10 pb-16 sm:pt-14 sm:pb-24 border-b border-slate-200 dark:border-slate-800/80">
        
        {/* Ambient Gradient Glow Background */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[550px] bg-gradient-to-b from-palette-primary/10 via-palette-accent/10 to-transparent blur-3xl pointer-events-none -z-10" />
        <div className="absolute top-1/4 right-10 w-72 h-72 bg-palette-highlight/10 blur-3xl rounded-full pointer-events-none -z-10" />
        <div className="absolute top-1/3 left-10 w-72 h-72 bg-palette-accent/10 blur-3xl rounded-full pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Main Title & Value Proposition */}
          <div className="text-center max-w-4xl mx-auto mb-8">
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.15] sm:leading-[1.12] mb-6">
              Tu CV es solo el comienzo.{' '}
              <span className="text-palette-gradient">
                Crea tu Portafolio Web Profesional
              </span>.
            </h1>

            <p className="text-base sm:text-lg lg:text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto leading-relaxed font-normal">
              Crea, comparte y convierte oportunidades laborales con la plataforma interactiva que deja atrás al PDF tradicional que nadie abre.
            </p>
          </div>

          {/* CTA Buttons — Adapted from Uiverse.io (shivam_7937) */}
          <div className="flex items-center justify-center mb-12 sm:mb-16">
            <div className="relative inline-flex items-center justify-center gap-4 group">
              <div
                className="absolute inset-0 duration-1000 opacity-60 transition-all rounded-xl blur-lg filter group-hover:opacity-100 group-hover:duration-200"
                style={{
                  background: 'linear-gradient(90deg, var(--gradient-from), var(--gradient-via), var(--gradient-to))'
                }}
              />
              <button
                type="button"
                onClick={() => openRegisterModal({ theme: selectedThemeKey })}
                className="group relative inline-flex items-center justify-center text-base sm:text-lg rounded-xl bg-gray-900 dark:bg-slate-900 px-8 sm:px-10 py-3.5 sm:py-4 font-semibold text-white transition-all duration-200 hover:bg-gray-800 dark:hover:bg-slate-800 hover:shadow-lg hover:-translate-y-0.5 hover:shadow-gray-600/30 cursor-pointer"
              >
                <span>Get Started For Free</span>
                <svg
                  aria-hidden="true"
                  viewBox="0 0 10 10"
                  height="12"
                  width="12"
                  fill="none"
                  className="mt-0.5 ml-2.5 -mr-1 stroke-white stroke-2"
                >
                  <path
                    d="M0 5h7"
                    className="transition opacity-0 group-hover:opacity-100"
                  />
                  <path
                    d="M1 1l4 4-4 4"
                    className="transition group-hover:translate-x-[3px]"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Feature Highlights (3 Cards) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 max-w-5xl mx-auto mb-4">
            
            {/* Card 1: Creación & Diseño */}
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl p-6 sm:p-7 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-xl hover:shadow-palette-glow hover:border-palette-primary/40 hover:-translate-y-1.5 transition-all duration-300 group flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-palette-primary/10 border border-palette-primary/20 text-palette-primary flex items-center justify-center mb-5 shadow-sm group-hover:scale-110 group-hover:shadow-palette-glow group-hover:shadow-md transition-all duration-300">
                  <Palette className="w-6 h-6" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold mb-2.5 text-slate-900 dark:text-white group-hover:text-palette-primary transition-colors">
                  Diseño Profesional en Minutos
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Elige entre 5 plantillas modernas adaptadas a tu perfil. Personaliza tu biografía, experiencia y proyectos sin escribir una sola línea de código.
                </p>
              </div>
              <div className="mt-5 pt-3.5 border-t border-slate-100 dark:border-slate-800/80 text-[11px] sm:text-xs font-semibold text-palette-primary flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Listo en 5 minutos</span>
              </div>
            </div>

            {/* Card 2: Link Personal & WhatsApp */}
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl p-6 sm:p-7 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-xl hover:shadow-emerald-500/10 hover:border-emerald-500/40 hover:-translate-y-1.5 transition-all duration-300 group flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-100 dark:border-emerald-800/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-5 shadow-sm group-hover:scale-110 group-hover:shadow-emerald-500/20 group-hover:shadow-md transition-all duration-300">
                  <Smartphone className="w-6 h-6" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold mb-2.5 text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  Link Personal & WhatsApp Directo
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Comparte tu URL exclusiva en LinkedIn e Instagram o usa tu código QR. Clientes y reclutadores te contactan con un solo clic directo a WhatsApp.
                </p>
              </div>
              <div className="mt-5 pt-3.5 border-t border-slate-100 dark:border-slate-800/80 text-[11px] sm:text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <MessageCircle className="w-3.5 h-3.5" />
                <span>Contacto directo en 1 toque</span>
              </div>
            </div>

            {/* Card 3: Destacar & Conseguir Trabajo */}
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl p-6 sm:p-7 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-xl hover:shadow-purple-500/10 hover:border-purple-500/40 hover:-translate-y-1.5 transition-all duration-300 group flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/70 border border-purple-100 dark:border-purple-800/60 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-5 shadow-sm group-hover:scale-110 group-hover:shadow-purple-500/20 group-hover:shadow-md transition-all duration-300">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold mb-2.5 text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                  Multiplica tus Oportunidades
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Sustituye los currículums estáticos en PDF que nadie lee por un portafolio interactivo de alto impacto que convence en los primeros 5 segundos.
                </p>
              </div>
              <div className="mt-5 pt-3.5 border-t border-slate-100 dark:border-slate-800/80 text-[11px] sm:text-xs font-semibold text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Mayor tasa de respuesta</span>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. ¿QUÉ ES MI VITAE? (INSPIRADO EN SNIPLY - DISEÑO PLANO) */}
      {/* ========================================================================= */}
      <section id="que-es-mi-vitae" className="py-20 sm:py-28 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          
          {/* Header / Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-palette-primary/10 border border-palette-primary/20 text-black text-xs font-extrabold uppercase tracking-wider mb-6">
            <span>¿Qué es Mi Vitae?</span>
          </div>

          {/* Título grande */}
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-6 leading-tight">
            La forma más simple de convertir cada visita en una oportunidad de trabajo
          </h2>

          {/* Párrafo explicativo estilo Sniply */}
          <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-300 leading-relaxed max-w-3xl mx-auto mb-10">
            Mi Vitae es una herramienta intuitiva que transforma tu currículum tradicional en un portafolio web interactivo con tu propio enlace personalizado. Te permite integrar botones de acción directa a WhatsApp, código QR para tarjetas de presentación y 5 diseños profesionales, creando una oportunidad real para conectar con reclutadores y clientes en cada enlace que compartes.
          </p>

          {/* Enlace elegante a Preguntas Frecuentes */}
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm font-semibold">
            <button
              type="button"
              onClick={() => scrollToSection('faq')}
              className="inline-flex items-center gap-2 text-palette-primary hover:opacity-80 transition-opacity group cursor-pointer"
            >
              <HelpCircle className="w-4 h-4 text-palette-primary group-hover:scale-110 transition-transform shrink-0" />
              <span>Preguntas Frecuentes</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform shrink-0" />
            </button>
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. SOCIAL PROOF SECTION (TESTIMONIALS WITH REAL RESULTS) */}
      {/* ========================================================================= */}
      <section className="py-16 sm:py-24 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-14">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mt-3 mb-4">
              Resultados Reales de Profesionales que ya Destacan
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base">
              Descubre cómo Mi Vitae transformó la forma en que consiguen clientes y entrevistas de trabajo.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            
            {/* Testimonial 1 */}
            <div className="bg-slate-50 dark:bg-slate-900 p-7 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-1 text-amber-400 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} fill="currentColor" className="w-4 h-4" />
                  ))}
                </div>
                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed italic mb-6">
                  "Pasé de enviar currículums en PDF que nadie abría a recibir 4 ofertas laborales por WhatsApp en mis primeras 2 semanas. El botón directo lo cambió todo."
                </p>
              </div>

              <div className="flex items-center gap-3.5 pt-4 border-t border-slate-200/80 dark:border-slate-800">
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"
                  alt="Macarena R."
                  className="w-11 h-11 rounded-full object-cover shadow"
                />
                <div>
                  <div className="font-bold text-sm text-slate-900 dark:text-white">Macarena R.</div>
                  <div className="text-[11px] text-purple-600 dark:text-purple-400 font-medium">Lead UX/UI Designer</div>
                </div>
              </div>
            </div>

            {/* Testimonial 2 */}
            <div className="bg-slate-50 dark:bg-slate-900 p-7 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-1 text-amber-400 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} fill="currentColor" className="w-4 h-4" />
                  ))}
                </div>
                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed italic mb-6">
                  "Poner mi link personal en mi biografía de LinkedIn triplicó las visitas de reclutadores tech. La estética técnica del tema terminal causó un impacto brutal."
                </p>
              </div>

              <div className="flex items-center gap-3.5 pt-4 border-t border-slate-200/80 dark:border-slate-800">
                <img
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80"
                  alt="Carlos M."
                  className="w-11 h-11 rounded-full object-cover shadow"
                />
                <div>
                  <div className="font-bold text-sm text-slate-900 dark:text-white">Carlos M.</div>
                  <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">Senior DevOps & Cloud Architect</div>
                </div>
              </div>
            </div>

            {/* Testimonial 3 */}
            <div className="bg-slate-50 dark:bg-slate-900 p-7 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-1 text-amber-400 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} fill="currentColor" className="w-4 h-4" />
                  ))}
                </div>
                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed italic mb-6">
                  "En eventos de networking imprimo mi código QR en mis tarjetas. Mis clientes escanean el código y ven mis credenciales y casos corporativos en segundos."
                </p>
              </div>

              <div className="flex items-center gap-3.5 pt-4 border-t border-slate-200/80 dark:border-slate-800">
                <img
                  src="https://images.unsplash.com/photo-1556157382-97eda2d62296?auto=format&fit=crop&w=150&q=80"
                  alt="Ignacio V."
                  className="w-11 h-11 rounded-full object-cover shadow"
                />
                <div>
                  <div className="font-bold text-sm text-slate-900 dark:text-white">Lic. Ignacio V.</div>
                  <div className="text-[11px] text-stone-600 dark:text-stone-400 font-medium">Consultor Legal & Tributario</div>
                </div>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. TRANSPARENT PRICING SECTION & FAQ ANTI-OBJECIONES */}
      {/* ========================================================================= */}
      <section id="pricing" className="py-16 sm:py-24 bg-slate-900 text-white relative overflow-hidden border-b border-slate-800 scroll-mt-16">
        
        {/* Glow behind pricing */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-indigo-600/15 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight mt-3 mb-4">
              Una inversión accesible para impulsar tu carrera
            </h2>
            <p className="text-slate-400 text-sm sm:text-base max-w-xl mx-auto">
              Sin contratos anuales forzosos, cancela en cualquier momento con 1 clic
            </p>
          </div>

          {/* Pricing Highlight Card — Adapted from Uiverse.io (themrsami) Reactive to Global Palette */}
          <div className="group relative w-full max-w-md mx-auto mb-16">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-slate-950 to-slate-900 p-[1px] shadow-2xl transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_var(--glow)]">
              
              {/* Reactive ambient gradient layer */}
              <div
                className="absolute inset-0 opacity-25"
                style={{
                  background: 'linear-gradient(180deg, var(--primary), var(--accent))'
                }}
              />

              <div className="relative rounded-3xl bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 p-6 sm:p-8">
                
                {/* Reactive decorative blur orbs */}
                <div
                  className="absolute -left-16 -top-16 h-36 w-36 rounded-full blur-2xl transition-all duration-500 group-hover:scale-150 group-hover:opacity-75 pointer-events-none"
                  style={{
                    background: 'radial-gradient(circle, var(--primary) 0%, transparent 70%)',
                    opacity: 0.3
                  }}
                />
                <div
                  className="absolute -bottom-16 -right-16 h-36 w-36 rounded-full blur-2xl transition-all duration-500 group-hover:scale-150 group-hover:opacity-75 pointer-events-none"
                  style={{
                    background: 'radial-gradient(circle, var(--accent) 0%, transparent 70%)',
                    opacity: 0.3
                  }}
                />

                {/* Plan Header */}
                <div className="relative text-left">
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl sm:text-5xl font-black tracking-tight text-white">
                      $3.490
                    </span>
                    <span className="text-sm font-semibold text-slate-400">CLP / mes</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-400">
                    Comienza hoy con <strong>1er mes 100% gratis </strong> al completar una encuesta de Mi Vitae.
                  </p>
                </div>

                {/* Features List */}
                <div className="relative mt-6 space-y-3.5 text-left">
                  <div className="flex items-start gap-3">
                    <div
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
                      style={{
                        background: 'rgba(var(--primary-rgb, 77, 94, 179), 0.2)',
                        color: 'var(--highlight, #cf7d30)'
                      }}
                    >
                      <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">Link Permanente Propio</p>
                      <p className="text-xs text-slate-400">mi-vitae.wearesamod.com/[tu_usuario]</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
                      style={{
                        background: 'rgba(var(--primary-rgb, 77, 94, 179), 0.2)',
                        color: 'var(--highlight, #cf7d30)'
                      }}
                    >
                      <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">Acceso a los 5 Diseños Profesionales</p>
                      <p className="text-xs text-slate-400">Minimalista, Creativo, Técnico, Cálido y Ejecutivo</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
                      style={{
                        background: 'rgba(var(--primary-rgb, 77, 94, 179), 0.2)',
                        color: 'var(--highlight, #cf7d30)'
                      }}
                    >
                      <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">Botón Flotante de WhatsApp Directo</p>
                      <p className="text-xs text-slate-400">Llamada a la acción con mensaje predeterminado</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
                      style={{
                        background: 'rgba(var(--primary-rgb, 77, 94, 179), 0.2)',
                        color: 'var(--highlight, #cf7d30)'
                      }}
                    >
                      <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">Código QR en Alta Definición</p>
                      <p className="text-xs text-slate-400">Listo para descargar e imprimir en tarjetas físicas</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
                      style={{
                        background: 'rgba(var(--primary-rgb, 77, 94, 179), 0.2)',
                        color: 'var(--highlight, #cf7d30)'
                      }}
                    >
                      <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">Métricas y Analíticas en Tiempo Real</p>
                      <p className="text-xs text-slate-400">Monitoreo de visitas, clics y descargas de CV</p>
                    </div>
                  </div>
                </div>

                {/* Action CTA Buttons */}
                <div className="relative mt-8">
                  <button
                    type="button"
                    onClick={() => openRegisterModal({ theme: selectedThemeKey })}
                    className="group/btn relative w-full overflow-hidden rounded-xl p-[1.5px] font-semibold text-white shadow-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                    style={{
                      background: 'linear-gradient(90deg, var(--primary), var(--accent), var(--highlight))'
                    }}
                  >
                    <div className="relative rounded-xl bg-slate-950/60 px-4 py-3.5 transition-colors group-hover/btn:bg-transparent">
                      <span className="relative flex items-center justify-center gap-2 font-bold text-sm sm:text-base text-white">
                        <Sparkles className="w-4 h-4 text-white" />
                        <span>Comenzar Mi mes Gratis</span>
                        <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover/btn:translate-x-1" />
                      </span>
                    </div>
                  </button>
                </div>

              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. SECCIÓN DEDICADA DE PREGUNTAS FRECUENTES (FAQ) */}
      {/* ========================================================================= */}
      <section id="faq" className="py-20 sm:py-28 bg-[#f3f7fa] dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 scroll-mt-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center mb-12">
            <span 
              className="text-xs font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-full border transition-all"
              style={{
                backgroundColor: 'rgba(var(--primary-rgb, 79, 70, 229), 0.1)',
                borderColor: 'rgba(var(--primary-rgb, 79, 70, 229), 0.3)',
                color: 'var(--primary, #4f46e5)'
              }}
            >
              Preguntas Frecuentes
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mt-3 mb-3 text-slate-900 dark:text-white">
              ¿Tienes dudas sobre Mi Vitae?
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base max-w-xl mx-auto">
              Respuestas directas para que empieces hoy mismo con total confianza.
            </p>
          </div>

          <div className="space-y-3.5">
            {faqs.map((faq, idx) => {
              const isOpen = openFaqIndex === idx
              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm overflow-hidden transition-all"
                >
                  <button
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="w-full px-6 py-4 sm:py-5 text-left flex items-center justify-between gap-4 font-bold text-sm sm:text-base text-slate-900 dark:text-white hover:text-palette-primary transition-colors cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    <div className="w-7 h-7 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                      {isOpen ? (
                        <ChevronUp className="w-4 h-4 text-palette-primary" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-500" />
                      )}
                    </div>
                  </button>

                  {isOpen && (
                    <div className="px-6 pb-5 pt-1 text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800/80">
                      {faq.a}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. REAL-TIME USERNAME VALIDATOR (FINAL CALL TO ACTION) */}
      {/* ========================================================================= */}
      <section className="py-20 sm:py-28 relative overflow-hidden bg-slate-950 border-b border-slate-800">
        
        {/* Ambient Palette Radial Glow Background */}
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[450px] blur-[120px] rounded-full pointer-events-none opacity-30 transition-colors duration-700"
          style={{
            background: 'radial-gradient(circle, var(--primary, #4f46e5) 0%, var(--accent, #06b6d4) 60%, transparent 100%)'
          }}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight mt-3 mb-3 text-white">
              Reserva tu enlace exclusivo <span className="text-palette-gradient">antes de que alguien más lo tome</span>
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm">
              Verifica disponibilidad en tiempo real y comienza con tu primer mes gratis ($0 CLP).
            </p>
          </div>

          <div id="username-validator" className="max-w-2xl mx-auto scroll-mt-24">
            <div 
              className="rounded-3xl p-6 sm:p-8 backdrop-blur-xl border relative transition-all duration-500 shadow-2xl"
              style={{
                backgroundColor: 'rgba(15, 23, 42, 0.85)',
                borderColor: 'rgba(var(--primary-rgb, 79, 70, 229), 0.35)',
                boxShadow: '0 25px 60px -15px var(--glow, rgba(79, 70, 229, 0.3))'
              }}
            >
              
              {/* Card Header */}
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                <div className="flex items-center gap-2">
                  <div
                    className="w-2.5 h-2.5 rounded-full animate-ping"
                    style={{ backgroundColor: 'var(--accent, #10b981)' }}
                  />
                  <span
                    className="text-xs font-bold uppercase tracking-wider"
                    style={{ color: 'var(--highlight, #818cf8)' }}
                  >
                    Validador de Disponibilidad en Tiempo Real
                  </span>
                </div>
                <span className="text-[11px] text-slate-400">
                  Tu link exclusivo para compartir
                </span>
              </div>

              {/* Search / Claim Bar Form */}
              <form onSubmit={handleClaimUsername} className="flex flex-col sm:flex-row gap-2.5">
                <div 
                  className={`flex-1 flex items-center px-4 py-3.5 rounded-2xl bg-slate-950/80 border transition-all ${
                    cleanInput.length >= 3
                      ? isAvailable
                        ? 'border-emerald-500 ring-2 ring-emerald-500/25 bg-emerald-950/20'
                        : 'border-rose-500 ring-2 ring-rose-500/25 bg-rose-950/20'
                      : 'border-slate-700/80 focus-within:border-slate-500'
                  }`}
                  style={
                    cleanInput.length < 3
                      ? {
                          borderColor: 'rgba(var(--primary-rgb, 79, 70, 229), 0.3)'
                        }
                      : undefined
                  }
                >
                  <span className="text-slate-500 text-xs sm:text-sm font-semibold select-none shrink-0">
                    mi-vitae.wearesamod.com/
                  </span>
                  <input
                    type="text"
                    value={inputUsername}
                    onChange={(e) => setInputUsername(e.target.value)}
                    placeholder="tu_nombre_o_marca"
                    className="w-full bg-transparent text-white font-bold text-sm sm:text-base focus:outline-none placeholder:text-slate-500 ml-0.5"
                  />
                  {isChecking && (
                    <div 
                      className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin shrink-0"
                      style={{
                        borderColor: 'var(--primary, #4f46e5)',
                        borderTopColor: 'transparent'
                      }}
                    />
                  )}
                </div>

                <button
                  type="submit"
                  disabled={!cleanInput || cleanInput.length < 3 || isAvailable === false}
                  className={`px-6 py-3.5 rounded-2xl font-extrabold text-sm sm:text-base transition-all flex items-center justify-center gap-2 shrink-0 ${
                    cleanInput.length >= 3 && isAvailable
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/25 cursor-pointer scale-100 hover:scale-[1.02]'
                      : cleanInput.length >= 3 && !isAvailable
                        ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        : 'text-white shadow-md cursor-pointer hover:opacity-95 hover:scale-[1.02]'
                  }`}
                  style={
                    cleanInput.length >= 3 && isAvailable
                      ? undefined
                      : cleanInput.length >= 3 && !isAvailable
                        ? undefined
                        : {
                            background: 'linear-gradient(135deg, var(--gradient-from, #4f46e5), var(--gradient-to, #7c3aed))',
                            boxShadow: '0 10px 25px -5px var(--glow, rgba(79, 70, 229, 0.4))'
                          }
                  }
                >
                  <span>Reclamar mi Link</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              {/* Dynamic Feedback Message */}
              <div className="mt-3.5">
                {inputUsername.length === 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-400">
                    <span>Sugerencias rápidas:</span>
                    {['carlos_dev', 'antonia_ux', 'abogado_consultor', 'valeria_psico', 'rodrigo_ops'].map((sug) => (
                      <button
                        key={sug}
                        type="button"
                        onClick={() => handleSuggestionClick(sug)}
                        className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 font-mono text-[11px] border transition-all cursor-pointer"
                        style={{
                          borderColor: 'rgba(var(--primary-rgb, 79, 70, 229), 0.25)'
                        }}
                      >
                        @{sug}
                      </button>
                    ))}
                  </div>
                )}

                {inputUsername.length > 0 && cleanInput.length < 3 && (
                  <div className="flex items-center gap-1.5 text-xs text-amber-400 font-medium">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>Ingresa al menos 3 caracteres alfanuméricos (ej: camila-diseno, juan_dev).</span>
                  </div>
                )}

                {cleanInput.length >= 3 && isAvailable === true && (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-800 text-xs font-semibold text-emerald-200">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>
                        ¡Enlace disponible! Tu URL será <code className="font-bold underline text-emerald-300">mi-vitae.wearesamod.com/{cleanInput}</code>
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleClaimUsername}
                      className="text-xs text-emerald-300 hover:underline font-bold text-left sm:text-right cursor-pointer"
                    >
                      Continuar al Editor →
                    </button>
                  </div>
                )}

                {cleanInput.length >= 3 && isAvailable === false && (
                  <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800 text-xs text-rose-200">
                    <div className="flex items-center gap-1.5 font-bold mb-1.5">
                      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                      <span>El usuario @{cleanInput} ya se encuentra registrado.</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-400">
                      <span>Prueba con estas alternativas disponibles:</span>
                      {[`${cleanInput}_pro`, `${cleanInput}_cl`, `${cleanInput}_dev`, `${cleanInput}2026`].map((alt) => (
                        <button
                          key={alt}
                          type="button"
                          onClick={() => handleSuggestionClick(alt)}
                          className="px-2.5 py-1 rounded bg-slate-900 border text-xs font-mono font-semibold transition-colors cursor-pointer hover:brightness-110"
                          style={{
                            borderColor: 'rgba(var(--primary-rgb, 79, 70, 229), 0.4)',
                            color: 'var(--highlight, #818cf8)'
                          }}
                        >
                          {alt}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. CORPORATE FOOTER (WE ARE SAMOD) */}
      {/* ========================================================================= */}
      <footer className="py-12 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-xs sm:text-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-slate-200 dark:border-slate-800">
            
            {/* Brand column */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-2.5 mb-3">
                <MiVitaeLogo className="w-8 h-8" />
                <span className="font-extrabold text-lg tracking-tight text-slate-900 dark:text-white">
                  Mi Vitae
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  v1.0
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm leading-relaxed mb-3">
                Plataforma de portafolios web profesionales de alta conversión. Creado para sustituir los currículums tradicionales en PDF por una experiencia digital interactiva.
              </p>
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Una solución desarrollada por <span className="text-indigo-600 dark:text-indigo-400 font-bold">We Are Samod</span>.
              </p>
            </div>

            {/* Navigation links */}
            <div>
              <h5 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider mb-3">
                Plataforma
              </h5>
              <ul className="space-y-2 text-xs">
                <li>
                  <Link to="/" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                    Inicio
                  </Link>
                </li>
                <li>
                  <Link to="/dashboard" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                    Editor Studio
                  </Link>
                </li>
                <li>
                  <Link to="/admin" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                    Super Admin Portal
                  </Link>
                </li>
                <li>
                  <button onClick={() => scrollToSection('username-validator')} className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-left cursor-pointer">
                    Reclamar Enlace
                  </button>
                </li>
                <li>
                  <button onClick={() => scrollToSection('pricing')} className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-left cursor-pointer">
                    Precios & Suscripción
                  </button>
                </li>
                <li>
                  <button onClick={() => scrollToSection('faq')} className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-left cursor-pointer">
                    Preguntas Frecuentes
                  </button>
                </li>
              </ul>
            </div>

            {/* Demo archetypes */}
            <div>
              <h5 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider mb-3">
                Demos en Vivo
              </h5>
              <ul className="space-y-2 text-xs">
                <li>
                  <Link to="/abogado_consultor" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                    /abogado_consultor (Minimalista)
                  </Link>
                </li>
                <li>
                  <Link to="/antonia_ux" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                    /antonia_ux (Creativo)
                  </Link>
                </li>
                <li>
                  <Link to="/carlos_dev" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                    /carlos_dev (Técnico)
                  </Link>
                </li>
                <li>
                  <Link to="/valeria_psico" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                    /valeria_psico (Cálido)
                  </Link>
                </li>
                <li>
                  <Link to="/rodrigo_ops" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                    /rodrigo_ops (Ejecutivo)
                  </Link>
                </li>
              </ul>
            </div>

          </div>

          {/* Copyright bar */}
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
            <p>© 2026 Mi Vitae. Todos los derechos reservados. Desarrollado por We Are Samod.</p>
            <div className="flex items-center gap-4">
              <span className="hover:underline cursor-pointer">Términos del Servicio</span>
              <span>·</span>
              <span className="hover:underline cursor-pointer">Política de Privacidad</span>
              <span>·</span>
              <span className="hover:underline cursor-pointer">Soporte Flow / Webpay</span>
            </div>
          </div>

        </div>
      </footer>

    </div>
  )
}
