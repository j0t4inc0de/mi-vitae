import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from '../../router/Router'
import { useProfileStore } from '../../stores/profileStore'
import { signUpWithSupabase, saveFeedbackToSupabase, saveProfileToSupabase } from '../../lib/supabaseClient'
import MiVitaeLogo from '../Common/MiVitaeLogo'
import { 
  X, Sparkles, CheckCircle2, AlertCircle, ArrowRight, 
  ArrowLeft, Check, ShieldCheck, HeartHandshake,
  Palette, User, Mail, AtSign, Code2, Scale, Heart,
  BarChart3, Rocket, GraduationCap, Building2, Zap,
  Smartphone, Users, Search, Ticket, Lock, Loader2
} from 'lucide-react'

// Options for Question 1: Professional Areas
const PROFESSIONAL_AREAS = [
  { id: 'tech', label: 'Desarrollo de Software & TI', icon: Code2 },
  { id: 'design', label: 'Diseño UX/UI & Creatividad', icon: Palette },
  { id: 'legal_finance', label: 'Legal, Finanzas & Consultoría', icon: Scale },
  { id: 'health_wellness', label: 'Psicología, Salud & Bienestar', icon: Heart },
  { id: 'business_ops', label: 'Negocios, Operaciones & C-Level', icon: BarChart3 },
  { id: 'marketing_sales', label: 'Marketing Digital & Ventas', icon: Rocket },
  { id: 'education', label: 'Educación & Capacitación', icon: GraduationCap },
  { id: 'engineering', label: 'Ingeniería & Construcción', icon: Building2 },
  { id: 'freelance', label: 'Freelancer / Consultor Independiente', icon: Zap }
]

// Options for Question 2: Biggest CV Obstacle
const CV_OBSTACLES = [
  { 
    id: 'static_pdf', 
    title: 'PDF estático no destaca',
    desc: 'Los currículums planos en PDF no reflejan mi personalidad, dinamismo ni proyectos reales.' 
  },
  { 
    id: 'hard_to_update', 
    title: 'Es difícil y tedioso actualizarlo',
    desc: 'Tengo que re-diseñar o re-exportar el documento cada vez que cambio de trabajo o aprendo algo nuevo.' 
  },
  { 
    id: 'no_own_link', 
    title: 'No tengo un enlace web propio',
    desc: 'No cuento con un link directo y memorable para incluir en mi biografía de LinkedIn, WhatsApp o Instagram.' 
  },
  { 
    id: 'bad_mobile', 
    title: 'Mala visualización en celulares',
    desc: 'Los reclutadores leen en móvil y el PDF se ve enano, difícil de leer o con zoom incómodo.' 
  },
  { 
    id: 'no_analytics', 
    title: 'No sé quién lo abre (sin métricas)',
    desc: 'Envío mi currículum a ofertas pero nunca sé cuántas personas lo revisaron o hicieron clic.' 
  }
]

// Options for Question 3: How did you hear about us?
const REFERRAL_SOURCES = [
  { id: 'social', label: 'Redes Sociales (LinkedIn, Instagram, TikTok)', icon: Smartphone },
  { id: 'friend', label: 'Recomendación de un colega o amigo', icon: Users },
  { id: 'google', label: 'Búsqueda en Google', icon: Search },
  { id: 'samod', label: 'We Are Samod (Sitio / Portafolio)', icon: Building2 },
  { id: 'community', label: 'Comunidades Tech / Eventos Profesionales', icon: Ticket }
]

// Theme choices for Step 1
const THEME_OPTIONS = [
  { id: 'tech', label: 'Técnico', color: 'bg-emerald-500 text-black', role: 'Tech & Code' },
  { id: 'creative', label: 'Creativo', color: 'bg-purple-500 text-white', role: 'Diseño & UX' },
  { id: 'minimalist', label: 'Minimalista', color: 'bg-stone-700 text-white', role: 'Legal & Finanzas' },
  { id: 'warm', label: 'Cálido', color: 'bg-amber-500 text-white', role: 'Salud & Coaching' },
  { id: 'executive', label: 'Ejecutivo', color: 'bg-blue-600 text-white', role: 'C-Level & Negocios' }
]

/**
 * 60fps Canvas Confetti Launcher for celebration
 */
function runConfetti(canvas) {
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  const width = (canvas.width = canvas.parentElement.clientWidth)
  const height = (canvas.height = canvas.parentElement.clientHeight)

  const colors = ['#6366F1', '#EC4899', '#10B981', '#F59E0B', '#3B82F6', '#8B5CF6', '#14B8A6']
  const pieces = Array.from({ length: 90 }).map(() => ({
    x: width * 0.5 + (Math.random() - 0.5) * 60,
    y: height * 0.35 + (Math.random() - 0.5) * 40,
    w: Math.random() * 10 + 6,
    h: Math.random() * 8 + 4,
    vx: (Math.random() - 0.5) * 16,
    vy: Math.random() * -14 - 4,
    gravity: 0.35,
    rotation: Math.random() * 360,
    vRotation: (Math.random() - 0.5) * 12,
    color: colors[Math.floor(Math.random() * colors.length)],
    opacity: 1,
    scale: 1,
    wobble: Math.random() * 10
  }))

  let animationFrameId
  let startTime = Date.now()

  const frame = () => {
    const elapsed = Date.now() - startTime
    if (elapsed > 4500) {
      ctx.clearRect(0, 0, width, height)
      return
    }

    ctx.clearRect(0, 0, width, height)

    pieces.forEach((p) => {
      p.x += p.vx
      p.vy += p.gravity
      p.y += p.vy
      p.rotation += p.vRotation
      p.wobble += 0.1

      // Wobble drag
      p.vx *= 0.98

      // Fade out smoothly after 2.5 seconds
      if (elapsed > 2500) {
        p.opacity = Math.max(0, 1 - (elapsed - 2500) / 2000)
      }

      ctx.save()
      ctx.translate(p.x, p.y)
      ctx.rotate((p.rotation * Math.PI) / 180)
      ctx.globalAlpha = p.opacity
      ctx.fillStyle = p.color
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h)
      ctx.restore()
    })

    animationFrameId = requestAnimationFrame(frame)
  }

  animationFrameId = requestAnimationFrame(frame)
  return () => cancelAnimationFrame(animationFrameId)
}

/**
 * RegisterFeedbackModal - High converting registration & feedback modal with 1st month free activation
 */
export default function RegisterFeedbackModal({ isOpen, onClose, initialUsername = '' }) {
  const navigate = useNavigate()
  const isUsernameAvailable = useProfileStore((state) => state.isUsernameAvailable)
  const addProfile = useProfileStore((state) => state.addProfile)
  const activateFreeTrial = useProfileStore((state) => state.activateFreeTrial)
  const setActiveUsername = useProfileStore((state) => state.setActiveUsername)
  const closeRegisterModal = useProfileStore((state) => state.closeRegisterModal)

  const [step, setStep] = useState(1) // 1: Datos Básicos, 2: Feedback 3 preguntas, 3: Éxito & Activación
  const confettiCanvasRef = useRef(null)

  // Step 1 State
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState(initialUsername || '')
  const [selectedTheme, setSelectedTheme] = useState('tech')
  const [usernameStatus, setUsernameStatus] = useState({ checked: false, available: null, message: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  // Step 2 Feedback State
  const [selectedAreas, setSelectedAreas] = useState([])
  const [selectedObstacle, setSelectedObstacle] = useState('')
  const [selectedReferral, setSelectedReferral] = useState('')

  // Sync initial username prop
  useEffect(() => {
    if (initialUsername) {
      const clean = initialUsername.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '')
      setUsername(clean)
    }
  }, [initialUsername])

  // Live real-time username verification debounce
  useEffect(() => {
    if (!username || username.trim() === '') {
      setUsernameStatus({ checked: false, available: null, message: '' })
      return
    }

    const clean = username.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '')
    if (clean.length < 3) {
      setUsernameStatus({
        checked: true,
        available: false,
        message: 'Mínimo 3 caracteres alfanuméricos'
      })
      return
    }

    const timer = setTimeout(() => {
      const available = isUsernameAvailable(clean)
      setUsernameStatus({
        checked: true,
        available,
        message: available
          ? `¡Disponible! Tu link será mi-vitae.wearesamod.com/${clean}`
          : `El usuario @${clean} ya está en uso. Prueba con otro nombre.`
      })
    }, 180)

    return () => clearTimeout(timer)
  }, [username, isUsernameAvailable])

  // Trigger confetti when entering Step 3
  useEffect(() => {
    if (step === 3 && confettiCanvasRef.current) {
      const cleanup = runConfetti(confettiCanvasRef.current)
      return cleanup
    }
  }, [step])

  // Escape key handler
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        handleModalClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  if (!isOpen) return null

  const handleModalClose = () => {
    if (onClose) onClose()
    closeRegisterModal()
    // Reset state after close
    setTimeout(() => {
      setStep(1)
      setName('')
      setEmail('')
      setUsername('')
      setSelectedAreas([])
      setSelectedObstacle('')
      setSelectedReferral('')
    }, 200)
  }

  // Toggle professional area tag
  const handleToggleArea = (areaId) => {
    setSelectedAreas((prev) => 
      prev.includes(areaId)
        ? prev.filter((id) => id !== areaId)
        : [...prev, areaId]
    )
  }

  // Validation for Step 1
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  const isStep1Valid = name.trim().length >= 3 && isEmailValid && usernameStatus.available === true && password.length >= 6

  // Validation for Step 2
  const isStep2Valid = selectedAreas.length > 0 && selectedObstacle && selectedReferral

  // Step 1 to Step 2
  const handleGoToStep2 = (e) => {
    e.preventDefault()
    if (!isStep1Valid) return
    setStep(2)
  }

  // Step 2 Submission & Profile Creation
  const handleCompleteRegistration = async (e) => {
    e.preventDefault()
    if (!isStep2Valid || isSubmitting) return

    setIsSubmitting(true)
    setSubmitError('')

    const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '')
    
    try {
      // 1. Sign up user in Supabase Auth & PostgreSQL
      const supabaseResult = await signUpWithSupabase({
        email: email.trim(),
        password,
        username: cleanUsername,
        fullName: name.trim()
      })

      if (!supabaseResult.success && !supabaseResult.isMock) {
        setSubmitError(supabaseResult.error || 'Error al conectar con Supabase.')
        setIsSubmitting(false)
        return
      }

      // 2. Save qualitative feedback in Supabase feedbacks table
      await saveFeedbackToSupabase({
        username: cleanUsername,
        professionalArea: selectedAreas.map(id => PROFESSIONAL_AREAS.find(a => a.id === id)?.label).join(', '),
        cvObstacle: selectedObstacle,
        referralSource: selectedReferral
      })

      // 3. Create new profile structure in store
      const newProfileData = {
        username: cleanUsername,
        theme: selectedTheme,
        plan: 'free_trial',
        planName: '1er Mes Gratis ($0 CLP)',
        planStatus: 'active',
        trialActivatedAt: new Date().toISOString(),
        personalInfo: {
          name: name.trim(),
          title: selectedAreas.map(id => PROFESSIONAL_AREAS.find(a => a.id === id)?.label).join(' / ') || 'Profesional en Mi Vitae',
          bio: 'Bienvenido a mi portafolio online en Mi Vitae. Especialista enfocado en soluciones de alto impacto y resultados profesionales.',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
          location: 'Chile / Remoto',
          email: email.trim(),
          whatsapp: '+56912345678',
          availableForWork: true
        },
        feedback: {
          professionalAreas: selectedAreas,
          biggestObstacle: selectedObstacle,
          referralSource: selectedReferral,
          submittedAt: new Date().toISOString()
        },
        experience: [
          {
            id: 'exp-1',
            role: 'Especialista Principal',
            company: 'Empresa / Proyecto Destacado',
            startDate: '2023-01',
            endDate: null,
            current: true,
            description: 'Liderazgo técnico y estratégico de iniciativas de alto rendimiento y valor comercial.',
            achievements: [
              'Optimización de resultados operativos en un 35%.',
              'Gestión y ejecución integral de proyectos clave.'
            ]
          }
        ],
        education: [
          {
            id: 'edu-1',
            degree: 'Título Profesional / Especialización',
            institution: 'Universidad / Instituto Profesional',
            year: '2022',
            details: 'Graduado con distinción.'
          }
        ],
        skills: [
          { id: 'sk-1', name: 'Gestión de Proyectos', level: 95, category: 'General' },
          { id: 'sk-2', name: 'Resolución de Problemas', level: 92, category: 'General' },
          { id: 'sk-3', name: 'Trabajo en Equipo', level: 90, category: 'General' }
        ],
        projects: [
          {
            id: 'proj-1',
            title: 'Proyecto Profesional Destacado',
            description: 'Implementación y desarrollo de solución innovadora de alto impacto.',
            image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=600&q=80',
            tags: ['Estrategia', 'Innovación'],
            liveUrl: '',
            repoUrl: ''
          }
        ],
        languages: [
          { id: 'lang-1', name: 'Español', level: 'Nativo' },
          { id: 'lang-2', name: 'Inglés', level: 'Intermedio / Avanzado' }
        ],
        floatingButton: {
          type: 'whatsapp',
          customMessage: `Hola ${name.trim()}, vi tu portafolio en Mi Vitae y me gustaría conversar contigo sobre una oportunidad laboral / proyecto.`,
          enabled: true
        },
        analytics: {
          views: 1,
          contactClicks: 0,
          cvDownloads: 0
        }
      }

      addProfile(newProfileData)
      activateFreeTrial(cleanUsername, newProfileData.feedback)
      setActiveUsername(cleanUsername)

      // Guardar perfil completo directamente en la tabla profiles de Supabase
      await saveProfileToSupabase(newProfileData)

      // Move to step 3 (Celebration screen)
      setStep(3)
    } catch (err) {
      setSubmitError(err.message || 'Error inesperado al registrar cuenta.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleGoToDashboard = () => {
    handleModalClose()
    navigate('/dashboard')
  }

  const handleGoToLivePortfolio = () => {
    const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '')
    handleModalClose()
    navigate(`/${cleanUsername}`)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-md transition-all animate-fadeIn">
      
      {/* Modal Dialog Card */}
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Confetti canvas overlay for Step 3 */}
        {step === 3 && (
          <canvas
            ref={confettiCanvasRef}
            className="absolute inset-0 pointer-events-none z-30 w-full h-full"
          />
        )}

        {/* Modal Header & Progress Steps */}
        <div className="px-6 pt-6 pb-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 shrink-0">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div 
                className="w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-md transition-all"
                style={{
                  background: 'linear-gradient(135deg, var(--gradient-from), var(--gradient-to))',
                  boxShadow: '0 4px 12px -2px var(--glow)'
                }}
              >
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight">
                  Activa tu 1er Mes Gratis en Mi Vitae
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Bonificación 100% gratuita ($0 CLP) con formulario de feedback
                </p>
              </div>
            </div>

            <button
              onClick={handleModalClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Cerrar modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Stepper Navigation */}
          <div className="grid grid-cols-3 gap-2">
            <div 
              className={`flex items-center gap-2 p-2 rounded-xl border text-xs font-semibold transition-all ${
                step === 1 
                  ? 'border-indigo-300 dark:border-indigo-700 shadow-sm'
                  : step > 1
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                    : 'bg-slate-100 dark:bg-slate-800/40 border-transparent text-slate-400'
              }`}
              style={step === 1 ? { backgroundColor: 'rgba(77, 94, 179, 0.08)', color: 'var(--primary, #4d5eb3)', borderColor: 'rgba(77, 94, 179, 0.4)' } : {}}
            >
              <div 
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  step > 1 ? 'bg-emerald-500 text-white' : step === 1 ? 'text-white' : 'bg-slate-300 dark:bg-slate-700 text-slate-600'
                }`}
                style={step === 1 ? { backgroundColor: 'var(--primary, #4d5eb3)' } : {}}
              >
                {step > 1 ? <Check className="w-3 h-3" /> : '1'}
              </div>
              <span className="truncate hidden sm:inline">1. Registro</span>
            </div>

            <div 
              className={`flex items-center gap-2 p-2 rounded-xl border text-xs font-semibold transition-all ${
                step === 2
                  ? 'border-indigo-300 dark:border-indigo-700 shadow-sm'
                  : step > 2
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                    : 'bg-slate-100 dark:bg-slate-800/40 border-transparent text-slate-400'
              }`}
              style={step === 2 ? { backgroundColor: 'rgba(77, 94, 179, 0.08)', color: 'var(--primary, #4d5eb3)', borderColor: 'rgba(77, 94, 179, 0.4)' } : {}}
            >
              <div 
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  step > 2 ? 'bg-emerald-500 text-white' : step === 2 ? 'text-white' : 'bg-slate-300 dark:bg-slate-700 text-slate-600'
                }`}
                style={step === 2 ? { backgroundColor: 'var(--primary, #4d5eb3)' } : {}}
              >
                {step > 2 ? <Check className="w-3 h-3" /> : '2'}
              </div>
              <span className="truncate hidden sm:inline">2. Feedback</span>
            </div>

            <div className={`flex items-center gap-2 p-2 rounded-xl border text-xs font-semibold transition-all ${
              step === 3
                ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800/40 border-transparent text-slate-400'
            }`}>
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                step === 3 ? 'bg-emerald-500 text-white' : 'bg-slate-300 dark:bg-slate-700 text-slate-600'
              }`}>
                {step === 3 ? <Sparkles className="w-3 h-3" /> : '3'}
              </div>
              <span className="truncate hidden sm:inline">3. Activación $0</span>
            </div>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
          
          {/* ========================================================================= */}
          {/* PASO 1: REGISTRO BÁSICO */}
          {/* ========================================================================= */}
          {step === 1 && (
            <form onSubmit={handleGoToStep2} className="space-y-5">
              <div className="text-center sm:text-left">
                <h4 className="text-lg font-bold text-slate-900 dark:text-white">
                  Paso 1: Reserva tu Enlace Profesional
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Ingresa tus datos para generar tu URL pública y configurar tu perfil inicial.
                </p>
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-palette-primary" />
                  <span>Nombre Completo *</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej. Francisca Silva González"
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-palette-primary/40 focus:border-palette-primary text-slate-900 dark:text-white transition-all"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-palette-primary" />
                  <span>Correo Electrónico *</span>
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu-correo@ejemplo.com"
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-palette-primary/40 focus:border-palette-primary text-slate-900 dark:text-white transition-all"
                />
                {email && !isEmailValid && (
                  <p className="text-[11px] text-rose-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    <span>Ingresa un correo electrónico válido</span>
                  </p>
                )}
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-palette-primary" />
                  <span>Crea una Contraseña (mínimo 6 caracteres) *</span>
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-palette-primary/40 focus:border-palette-primary text-slate-900 dark:text-white transition-all"
                />
                {password && password.length < 6 && (
                  <p className="text-[11px] text-rose-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    <span>La contraseña debe tener al menos 6 caracteres</span>
                  </p>
                )}
              </div>

              {/* Username with Live Real-time Verification */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <AtSign className="w-3.5 h-3.5 text-palette-primary" />
                  <span>Nombre de Usuario Deseado (Tu Link Único) *</span>
                </label>

                <div className={`flex items-center px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border transition-all ${
                  usernameStatus.checked
                    ? usernameStatus.available
                      ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/30 dark:bg-emerald-950/20'
                      : 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/30 dark:bg-rose-950/20'
                    : 'border-slate-300 dark:border-slate-700 focus-within:border-palette-primary focus-within:ring-2 focus-within:ring-palette-primary/20'
                }`}>
                  <span className="text-slate-400 dark:text-slate-500 text-xs sm:text-sm font-semibold select-none shrink-0">
                    mi-vitae.wearesamod.com/
                  </span>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                    placeholder="tu_usuario"
                    className="w-full bg-transparent text-slate-900 dark:text-white font-bold text-sm sm:text-base focus:outline-none placeholder:text-slate-400 dark:placeholder:text-slate-600 ml-0.5"
                  />
                  {usernameStatus.checked && (
                    <div className="shrink-0 ml-2">
                      {usernameStatus.available ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-rose-500" />
                      )}
                    </div>
                  )}
                </div>

                {/* Feedback message */}
                {usernameStatus.message && (
                  <div className={`text-xs mt-1.5 flex items-center gap-1 font-medium ${
                    usernameStatus.available ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'
                  }`}>
                    <span>{usernameStatus.message}</span>
                  </div>
                )}
              </div>

              {/* Initial Theme Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5" style={{ color: 'var(--primary, #4d5eb3)' }} />
                  <span>Selecciona tu Tema Visual de Partida</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {THEME_OPTIONS.map((th) => {
                    const isSelected = selectedTheme === th.id
                    return (
                      <button
                        key={th.id}
                        type="button"
                        onClick={() => setSelectedTheme(th.id)}
                        style={
                          isSelected
                            ? {
                                borderColor: 'var(--primary, #4d5eb3)',
                                backgroundColor: 'rgba(77, 94, 179, 0.1)',
                                boxShadow: '0 0 0 2px rgba(77, 94, 179, 0.3)'
                              }
                            : {}
                        }
                        className={`p-2.5 rounded-2xl border text-center transition-all cursor-pointer ${
                          isSelected
                            ? 'scale-105'
                            : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 hover:border-slate-300'
                        }`}
                      >
                        <div 
                          className="font-bold text-xs"
                          style={isSelected ? { color: 'var(--primary, #4d5eb3)' } : {}}
                        >
                          <span className={isSelected ? '' : 'text-slate-900 dark:text-white'}>{th.label}</span>
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{th.role}</div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Step 1 Footer CTA */}
              <div className="pt-3 flex justify-end">
                <button
                  type="submit"
                  disabled={!isStep1Valid}
                  style={
                    isStep1Valid
                      ? {
                          backgroundColor: 'var(--primary, #4d5eb3)',
                          boxShadow: '0 8px 20px -4px rgba(77, 94, 179, 0.4)'
                        }
                      : {}
                  }
                  className={`w-full sm:w-auto px-8 py-3.5 rounded-2xl font-extrabold text-sm flex items-center justify-center gap-2 transition-all ${
                    isStep1Valid
                      ? 'hover:opacity-95 text-white cursor-pointer scale-100 hover:scale-[1.02]'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <span>Continuar al Feedback (Paso 2/3)</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}

          {/* ========================================================================= */}
          {/* PASO 2: FORMULARIO DE FEEDBACK INICIAL (3 PREGUNTAS CLAVE) */}
          {/* ========================================================================= */}
          {step === 2 && (
            <form onSubmit={handleCompleteRegistration} className="space-y-6">
              <div 
                className="p-4 rounded-2xl border flex items-center gap-3.5 bg-slate-50 dark:bg-slate-950/70 border-slate-200 dark:border-slate-800 shadow-sm"
                style={{ borderColor: 'rgba(77, 94, 179, 0.3)' }}
              >
                <div className="shrink-0 drop-shadow-sm">
                  <MiVitaeLogo className="w-10 h-10" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                    Tu opinión nos ayuda a mejorar Mi Vitae
                  </h4>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                    Responde estas 3 breves preguntas para bonificar tu 1er mes (<span className="line-through text-slate-400">$3.490 CLP</span> → <strong className="text-emerald-600 dark:text-emerald-400 font-bold">$0 CLP</strong>) sin ningún compromiso.
                  </p>
                </div>
              </div>

              {/* Pregunta 1: ¿A qué área profesional te dedicas? */}
              <div>
                <label className="block text-xs font-bold text-slate-900 dark:text-white mb-2 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <span 
                      className="w-4 h-4 rounded-full text-white text-[10px] font-bold flex items-center justify-center shrink-0"
                      style={{ backgroundColor: 'var(--primary, #4d5eb3)' }}
                    >
                      1
                    </span>
                    <span>¿A qué área profesional te dedicas? *</span>
                  </span>
                  <span className="text-[10px] text-slate-500 font-normal">Selecciona 1 o más</span>
                </label>

                <div className="flex flex-wrap gap-2">
                  {PROFESSIONAL_AREAS.map((area) => {
                    const isSelected = selectedAreas.includes(area.id)
                    return (
                      <button
                        key={area.id}
                        type="button"
                        onClick={() => handleToggleArea(area.id)}
                        style={
                          isSelected
                            ? {
                                backgroundColor: 'var(--primary, #4d5eb3)',
                                borderColor: 'var(--primary, #4d5eb3)',
                                color: '#ffffff',
                                boxShadow: '0 4px 14px -2px rgba(77, 94, 179, 0.45)'
                              }
                            : {}
                        }
                        className={`px-3.5 py-2.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 cursor-pointer ${
                          isSelected
                            ? 'text-white scale-[1.02]'
                            : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                        }`}
                      >
                        <area.icon className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-white' : 'text-slate-500'}`} />
                        <span>{area.label}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 ml-0.5 text-white stroke-[2.5]" />}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Pregunta 2: ¿Cuál es el mayor obstáculo que tienes con tu CV actual? */}
              <div>
                <label className="block text-xs font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-1.5">
                  <span 
                    className="w-4 h-4 rounded-full text-white text-[10px] font-bold flex items-center justify-center shrink-0"
                    style={{ backgroundColor: 'var(--primary, #4d5eb3)' }}
                  >
                    2
                  </span>
                  <span>¿Cuál es el mayor obstáculo que tienes con tu CV actual? *</span>
                </label>

                <div className="space-y-2">
                  {CV_OBSTACLES.map((obs) => {
                    const isSelected = selectedObstacle === obs.id
                    return (
                      <button
                        key={obs.id}
                        type="button"
                        onClick={() => setSelectedObstacle(obs.id)}
                        style={
                          isSelected
                            ? {
                                borderColor: 'var(--primary, #4d5eb3)',
                                backgroundColor: 'rgba(77, 94, 179, 0.08)',
                                boxShadow: '0 0 0 1px var(--primary, #4d5eb3)'
                              }
                            : {}
                        }
                        className={`w-full p-3.5 rounded-2xl border text-left transition-all flex items-start gap-3 cursor-pointer ${
                          isSelected
                            ? 'shadow-sm'
                            : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                        }`}
                      >
                        <div 
                          className="w-5 h-5 rounded-full border mt-0.5 flex items-center justify-center shrink-0 transition-colors"
                          style={
                            isSelected
                              ? {
                                  backgroundColor: 'var(--primary, #4d5eb3)',
                                  borderColor: 'var(--primary, #4d5eb3)',
                                  color: '#ffffff'
                                }
                              : {
                                  borderColor: '#94a3b8'
                                }
                          }
                        >
                          {isSelected ? (
                            <Check className="w-3 h-3 text-white stroke-[3]" />
                          ) : null}
                        </div>
                        <div className="flex-1">
                          <div 
                            className="font-bold text-xs"
                            style={isSelected ? { color: 'var(--primary, #4d5eb3)' } : {}}
                          >
                            <span className={isSelected ? '' : 'text-slate-900 dark:text-white'}>
                              {obs.title}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">
                            {obs.desc}
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Pregunta 3: ¿Cómo te enteraste de Mi Vitae? */}
              <div>
                <label className="block text-xs font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-1.5">
                  <span 
                    className="w-4 h-4 rounded-full text-white text-[10px] font-bold flex items-center justify-center shrink-0"
                    style={{ backgroundColor: 'var(--primary, #4d5eb3)' }}
                  >
                    3
                  </span>
                  <span>¿Cómo te enteraste de Mi Vitae? *</span>
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {REFERRAL_SOURCES.map((ref) => {
                    const isSelected = selectedReferral === ref.id
                    return (
                      <button
                        key={ref.id}
                        type="button"
                        onClick={() => setSelectedReferral(ref.id)}
                        style={
                          isSelected
                            ? {
                                backgroundColor: 'var(--primary, #4d5eb3)',
                                borderColor: 'var(--primary, #4d5eb3)',
                                color: '#ffffff',
                                boxShadow: '0 4px 14px -2px rgba(77, 94, 179, 0.45)'
                              }
                            : {}
                        }
                        className={`p-3 rounded-xl border text-left text-xs font-semibold transition-all flex items-center justify-between gap-2 cursor-pointer ${
                          isSelected
                            ? 'text-white scale-[1.01]'
                            : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <ref.icon className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-white' : 'text-slate-500'}`} />
                          <span className="truncate">{ref.label}</span>
                        </div>
                        {isSelected && <Check className="w-3.5 h-3.5 shrink-0 text-white stroke-[2.5]" />}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Submit Error Banner */}
              {submitError && (
                <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{submitError}</span>
                </div>
              )}

              {/* Step 2 Buttons */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  disabled={isSubmitting}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Volver al Paso 1</span>
                </button>

                <button
                  type="submit"
                  disabled={!isStep2Valid || isSubmitting}
                  className={`w-full sm:w-auto px-8 py-3.5 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all ${
                    isStep2Valid && !isSubmitting
                      ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-600 hover:to-teal-600 text-white shadow-xl shadow-emerald-500/25 cursor-pointer scale-100 hover:scale-[1.02]'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Conectando con Supabase...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Activar mi 1er Mes Gratis ($0 CLP)</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* ========================================================================= */}
          {/* PASO 3: ACTIVACIÓN INMEDIATA DEL 1ER MES GRATIS ($0 CLP) */}
          {/* ========================================================================= */}
          {step === 3 && (
            <div className="text-center py-4 space-y-6 relative z-40">
              
              {/* Animated Success Badge */}
              <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-emerald-400 to-teal-500 flex items-center justify-center text-white shadow-2xl shadow-emerald-500/30 animate-bounce">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div>
                <span className="text-xs font-black uppercase tracking-wider px-3.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  ¡1er Mes 100% Bonificado Activado!
                </span>
                <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white mt-3">
                  ¡Felicitaciones, {name}!
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-md mx-auto mt-2">
                  Tu perfil ha sido creado exitosamente y tu enlace exclusivo ya se encuentra publicado y listo para compartir.
                </p>
              </div>

              {/* Summary Voucher Card */}
              <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-left max-w-md mx-auto shadow-inner space-y-3">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Suscripción</span>
                    <div className="text-sm font-extrabold text-slate-900 dark:text-white">Mi Vitae (1er Mes Bonificado)</div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-emerald-500">Monto Facturado</span>
                    <div className="text-base font-black text-emerald-600 dark:text-emerald-400">$0 CLP</div>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Tu Enlace Público Oficial</span>
                  <div className="font-mono text-xs sm:text-sm font-bold text-palette-primary bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 mt-1 break-all">
                    mi-vitae.wearesamod.com/{username}
                  </div>
                </div>

                <div className="pt-2 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Sin cobros automáticos sorpresivos. Cancela cuando desees.</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleGoToDashboard}
                  className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-palette-gradient hover:opacity-95 text-white font-black text-sm sm:text-base shadow-xl shadow-palette-glow hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-5 h-5" />
                  <span>Ir a mi Dashboard Studio</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={handleGoToLivePortfolio}
                  className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-sm border border-slate-300 dark:border-slate-700 transition-colors"
                >
                  <span>Ver mi Portafolio en Vivo</span>
                </button>
              </div>

            </div>
          )}

        </div>

      </div>

    </div>
  )
}
