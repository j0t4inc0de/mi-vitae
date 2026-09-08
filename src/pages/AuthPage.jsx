import React, { useState, useEffect } from 'react'
import { Link, useRouter, useParams } from '../router/Router'
import { useProfileStore } from '../stores/profileStore'
import { MiVitaeLogo } from '../components/Navbar'
import { 
  signUpWithSupabase, 
  signInWithSupabase, 
  isSupabaseConfigured 
} from '../lib/supabaseClient'
import { 
  LogIn, UserPlus, Mail, Lock, User, AtSign, ArrowRight, 
  Sparkles, CheckCircle2, AlertCircle, Eye, EyeOff, Loader2, Database
} from 'lucide-react'

export default function AuthPage() {
  const { navigate } = useRouter()
  const { initialMode } = useParams()
  
  const [mode, setMode] = useState(initialMode === 'register' ? 'register' : 'login')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  // Form Fields
  const [fullName, setFullName] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  // Store hooks
  const isUsernameAvailable = useProfileStore((state) => state.isUsernameAvailable)
  const addProfile = useProfileStore((state) => state.addProfile)
  const setActiveUsername = useProfileStore((state) => state.setActiveUsername)
  const profiles = useProfileStore((state) => state.profiles)

  useEffect(() => {
    if (initialMode === 'register' || initialMode === 'login') {
      setMode(initialMode)
    }
  }, [initialMode])

  const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '')
  const isHandleAvailable = cleanUsername.length >= 3 ? isUsernameAvailable(cleanUsername) : null

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMessage('')
    setSuccessMessage('')
    setLoading(true)

    try {
      if (mode === 'register') {
        if (!fullName.trim() || !cleanUsername || !email.trim() || !password) {
          throw new Error('Por favor completa todos los campos requeridos.')
        }

        if (cleanUsername.length < 3) {
          throw new Error('El nombre de usuario debe tener al menos 3 caracteres.')
        }

        if (!isHandleAvailable) {
          throw new Error(`El enlace @${cleanUsername} ya está ocupado. Elige otro.`)
        }

        if (password.length < 6) {
          throw new Error('La contraseña debe tener al menos 6 caracteres.')
        }

        // Registrar usuario en Supabase Cloud
        const supabaseResult = await signUpWithSupabase({
          email: email.trim(),
          password,
          username: cleanUsername,
          fullName: fullName.trim()
        })

        if (!supabaseResult.success && !supabaseResult.isMock) {
          throw new Error(supabaseResult.error || 'Error al registrar usuario en Supabase.')
        }

        // Crear perfil en el store para acceso inmediato al Editor Studio
        const newProfile = {
          username: cleanUsername,
          personalInfo: {
            name: fullName.trim(),
            title: 'Profesional en Mi Vitae',
            email: email.trim(),
            bio: 'Bienvenido a mi portafolio profesional en línea.',
            availableForWork: true
          },
          theme: 'tech',
          plan: 'free_trial',
          planName: '1er Mes Gratis ($0 CLP)',
          analytics: { views: 0, contactClicks: 0, cvDownloads: 0 }
        }

        addProfile(newProfile)
        setActiveUsername(cleanUsername)
        setSuccessMessage('¡Cuenta creada exitosamente! Redirigiendo a tu Editor Studio...')
        
        setTimeout(() => {
          navigate('/dashboard')
        }, 1200)

      } else {
        // Sign In Flow
        if (!email.trim() || !password) {
          throw new Error('Por favor ingresa tu correo o usuario y contraseña.')
        }

        let authenticatedUsername = null

        // Autenticar contra Supabase
        const supabaseResult = await signInWithSupabase({
          email: email.trim(),
          password
        })

        if (!supabaseResult.success && !supabaseResult.isMock) {
          throw new Error(supabaseResult.error || 'Credenciales inválidas.')
        }

        if (supabaseResult.success) {
          authenticatedUsername = supabaseResult.profile?.username || supabaseResult.user?.user_metadata?.username
        }

        const inputIdentifier = email.trim().toLowerCase()
        const matchedProfile = Object.values(profiles).find(
          (p) => (p.personalInfo?.email?.toLowerCase() === inputIdentifier || p.username?.toLowerCase() === inputIdentifier)
        )

        // Validar existencia de la cuenta en modo local
        if (!isSupabaseConfigured && !matchedProfile && !profiles[inputIdentifier]) {
          throw new Error('No encontramos una cuenta con ese correo o usuario. Si eres nuevo, selecciona "Crea tu cuenta gratis", o prueba con una cuenta demo (ej: carlos_dev).')
        }

        const activeUser = authenticatedUsername || (matchedProfile ? matchedProfile.username : (profiles[inputIdentifier] ? inputIdentifier : 'carlos_dev'))
        
        setActiveUsername(activeUser)
        setSuccessMessage('¡Inicio de sesión exitoso! Ingresando a tu panel...')
        
        setTimeout(() => {
          navigate('/dashboard')
        }, 1000)
      }
    } catch (err) {
      setErrorMessage(err.message || 'Ocurrió un error al procesar la solicitud.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 relative overflow-hidden bg-slate-50 dark:bg-slate-950">
      
      {/* Dynamic background ambient glow */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] blur-3xl rounded-full pointer-events-none -z-10 opacity-30 transition-all duration-700"
        style={{
          background: 'radial-gradient(circle, var(--primary, #4f46e5) 0%, var(--accent, #06b6d4) 50%, transparent 70%)'
        }}
      />

      <div className="w-full max-w-md">
        
        {/* Header with Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5 mb-4 group">
            <div className="group-hover:scale-105 transition-transform">
              <MiVitaeLogo className="w-10 h-10" />
            </div>
            <span className="font-black text-2xl tracking-tight bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 dark:from-white dark:via-slate-200 dark:to-white bg-clip-text text-transparent">
              Mi Vitae
            </span>
          </Link>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {mode === 'login' ? 'Iniciar Sesión' : <>Crea tu Cuenta <span className="text-palette-gradient">Gratis</span></>}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2">
            {mode === 'login' 
              ? 'Accede a tu Editor Studio para administrar tu portafolio' 
              : 'Empieza con 1 mes gratis y crea tu portafolio en 5 minutos'}
          </p>
        </div>

        {/* Card Container */}
        <div 
          className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border shadow-2xl backdrop-blur-xl transition-all"
          style={{
            borderColor: 'rgb(var(--primary-rgb, 77 94 179) / 0.3)',
            boxShadow: '0 25px 60px -15px var(--glow, rgba(79, 70, 229, 0.2))'
          }}
        >
          
          {/* Mode Switcher Tabs */}
          <div className="flex rounded-2xl bg-slate-100 dark:bg-slate-800/80 p-1 mb-6 border border-slate-200/60 dark:border-slate-700/60">
            <button
              type="button"
              onClick={() => { setMode('login'); setErrorMessage(''); setSuccessMessage('') }}
              className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                mode === 'login'
                  ? 'bg-white dark:bg-slate-900 text-palette-primary shadow-sm border border-palette-primary/30'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <LogIn className="w-4 h-4 text-palette-primary" />
              <span>Iniciar Sesión</span>
            </button>

            <button
              type="button"
              onClick={() => { setMode('register'); setErrorMessage(''); setSuccessMessage('') }}
              className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                mode === 'register'
                  ? 'bg-white dark:bg-slate-900 text-palette-primary shadow-sm border border-palette-primary/30'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <UserPlus className="w-4 h-4 text-palette-primary" />
              <span>Registrarse</span>
            </button>
          </div>

          {/* Feedback Alerts */}
          {errorMessage && (
            <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-5 p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {mode === 'register' && (
              <>
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Nombre Completo
                  </label>
                  <div className="flex items-center px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus-within:border-palette-primary focus-within:ring-2 focus-within:ring-palette-primary/20 transition-all">
                    <User className="w-4 h-4 text-slate-400 shrink-0 mr-2.5" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Ej. Camila Valenzuela"
                      className="w-full bg-transparent text-slate-900 dark:text-white text-sm focus:outline-none placeholder:text-slate-400 dark:placeholder:text-slate-600"
                    />
                  </div>
                </div>

                {/* Handle / Username */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Enlace Personal Deseado
                  </label>
                  <div className={`flex items-center px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border transition-all ${
                    cleanUsername.length >= 3
                      ? isHandleAvailable
                        ? 'border-emerald-500 ring-2 ring-emerald-500/20'
                        : 'border-rose-500 ring-2 ring-rose-500/20'
                      : 'border-slate-200 dark:border-slate-800 focus-within:border-palette-primary focus-within:ring-2 focus-within:ring-palette-primary/20'
                  }`}>
                    <AtSign className="w-4 h-4 text-slate-400 shrink-0 mr-1" />
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="tu_nombre_profesional"
                      className="w-full bg-transparent text-slate-900 dark:text-white text-sm font-semibold focus:outline-none placeholder:text-slate-400 dark:placeholder:text-slate-600"
                    />
                  </div>
                  {cleanUsername.length >= 3 && (
                    <p className={`text-[11px] font-semibold mt-1 flex items-center gap-1 ${
                      isHandleAvailable ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                    }`}>
                      {isHandleAvailable 
                        ? `✓ mi-vitae.wearesamod.com/${cleanUsername} disponible` 
                        : `✕ @${cleanUsername} ya está en uso`}
                    </p>
                  )}
                </div>
              </>
            )}

            {/* Email */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {mode === 'login' ? 'Correo Electrónico o Usuario' : 'Correo Electrónico'}
              </label>
              <div className="flex items-center px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus-within:border-palette-primary focus-within:ring-2 focus-within:ring-palette-primary/20 transition-all">
                <Mail className="w-4 h-4 text-slate-400 shrink-0 mr-2.5" />
                <input
                  type={mode === 'login' ? 'text' : 'email'}
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={mode === 'login' ? 'carlos_dev o tu@correo.com' : 'tu@correo.com'}
                  className="w-full bg-transparent text-slate-900 dark:text-white text-sm focus:outline-none placeholder:text-slate-400 dark:placeholder:text-slate-600"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Contraseña
                </label>
                {mode === 'login' && (
                  <span className="text-[11px] text-palette-primary hover:underline cursor-pointer">
                    ¿Olvidaste tu contraseña?
                  </span>
                )}
              </div>
              <div className="flex items-center px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus-within:border-palette-primary focus-within:ring-2 focus-within:ring-palette-primary/20 transition-all">
                <Lock className="w-4 h-4 text-slate-400 shrink-0 mr-2.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-transparent text-slate-900 dark:text-white text-sm focus:outline-none placeholder:text-slate-400 dark:placeholder:text-slate-600"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer ml-2"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit CTA Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-2xl bg-palette-gradient hover:opacity-95 text-white font-extrabold text-sm shadow-lg shadow-palette-glow hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer mt-6 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : mode === 'login' ? (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Ingresar a mi Cuenta</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Crear Portafolio con 1er Mes Gratis</span>
                </>
              )}
            </button>

          </form>

          {/* Bottom Switcher text */}
          <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400">
            {mode === 'login' ? (
              <span>
                ¿Aún no tienes tu portafolio?{' '}
                <button
                  type="button"
                  onClick={() => { setMode('register'); setErrorMessage(''); setSuccessMessage('') }}
                  className="font-bold text-palette-primary hover:underline cursor-pointer"
                >
                  Regístrate gratis
                </button>
              </span>
            ) : (
              <span>
                ¿Ya tienes una cuenta creada?{' '}
                <button
                  type="button"
                  onClick={() => { setMode('login'); setErrorMessage(''); setSuccessMessage('') }}
                  className="font-bold text-palette-primary hover:underline cursor-pointer"
                >
                  Inicia sesión aquí
                </button>
              </span>
            )}
          </div>

        </div>

        {/* Backend Status Indicator */}
        <div className="mt-5 flex items-center justify-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
          <Database className="w-3.5 h-3.5 text-indigo-500" />
          <span>Backend:</span>
          {isSupabaseConfigured ? (
            <span className="inline-flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Supabase Cloud Conectado
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-400 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              Supabase Ready (Configura .env)
            </span>
          )}
        </div>

      </div>
    </div>
  )
}
