import React, { useState, useEffect } from 'react'
import { useParams, Link } from '../router/Router'
import { useProfileStore } from '../stores/profileStore'
import { fetchProfileFromSupabase } from '../lib/supabaseClient'
import ThemeRenderer from '../components/Themes/ThemeRenderer'
import { Sparkles, Clock, ShieldAlert } from 'lucide-react'

// System archetypes that can display demo templates if not customized in cloud
const DEMO_ARCHETYPES = ['carlos_dev', 'antonia_ux', 'matias_dev', 'valeria_psico', 'rodrigo_exec']

export default function PortfolioPage() {
  const { username } = useParams()
  const cleanUsername = (username || '').toLowerCase().trim()
  const getProfileByUsername = useProfileStore((state) => state.getProfileByUsername)
  const recordView = useProfileStore((state) => state.recordView)
  const recordClick = useProfileStore((state) => state.recordClick)

  const [profile, setProfile] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true
    if (!cleanUsername) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)

    // 1. Direct fetch from Supabase Cloud PostgreSQL (The single source of truth for live web CVs)
    fetchProfileFromSupabase(cleanUsername)
      .then((remote) => {
        if (!isMounted) return
        if (remote) {
          setProfile(remote)
        } else if (DEMO_ARCHETYPES.includes(cleanUsername)) {
          // Fallback to archetype template only for the 5 demo archetypes
          const demoProfile = getProfileByUsername(cleanUsername)
          setProfile(demoProfile)
        } else {
          // If not in Supabase and not a demo archetype, profile does not exist
          setProfile(null)
        }
      })
      .catch((err) => {
        if (!isMounted) return
        console.warn('[PortfolioPage] Error fetching profile from cloud:', err)
        if (DEMO_ARCHETYPES.includes(cleanUsername)) {
          setProfile(getProfileByUsername(cleanUsername))
        } else {
          setProfile(null)
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false)
      })

    return () => { isMounted = false }
  }, [cleanUsername, getProfileByUsername])

  useEffect(() => {
    if (profile?.username) {
      recordView(profile.username)
    }
  }, [profile?.username, recordView])

  if (isLoading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center px-4">
        <div className="w-16 h-16 border-4 border-transparent text-palette-primary text-4xl animate-spin flex items-center justify-center border-t-palette-primary rounded-full">
          <div className="w-12 h-12 border-4 border-transparent text-palette-accent text-2xl animate-spin flex items-center justify-center border-t-palette-accent rounded-full" />
        </div>
        <p className="mt-4 text-sm font-medium text-slate-500 dark:text-slate-400 animate-pulse">
          Cargando portafolio...
        </p>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4">
          <Sparkles className="w-8 h-8" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-2">
          Portafolio no encontrado
        </h1>
        <p className="text-slate-600 dark:text-slate-400 max-w-md mb-6">
          El usuario <code className="text-indigo-600 dark:text-indigo-400 font-semibold">@{username}</code> aún no ha creado su perfil en Mi Vitae o el enlace está incorrecto.
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          <Link
            to="/"
            className="px-5 py-2.5 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-medium text-sm hover:opacity-90 transition-opacity"
          >
            Ir al Inicio
          </Link>
          <Link
            to="/dashboard"
            className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-medium text-sm hover:bg-indigo-700 transition-colors"
          >
            Crear este Portafolio
          </Link>
        </div>
      </div>
    )
  }

  // Verificación de expiración de plan único
  const isPlanExpired = Boolean(
    profile.planStatus === 'expired' ||
    profile.plan_status === 'expired' ||
    (profile.planExpiresAt && new Date(profile.planExpiresAt).getTime() < Date.now()) ||
    (profile.plan_expires_at && new Date(profile.plan_expires_at).getTime() < Date.now())
  )

  if (isPlanExpired) {
    return (
      <div className="min-h-[85vh] flex flex-col items-center justify-center px-4 text-center">
        <div className="w-20 h-20 rounded-3xl bg-amber-500/10 border border-amber-500/30 text-amber-500 flex items-center justify-center mb-5 shadow-lg shadow-amber-500/10">
          <Clock className="w-10 h-10" />
        </div>
        <span className="text-xs font-bold uppercase tracking-wider px-3.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 mb-3">
          Portafolio Temporalmente Pausado
        </span>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mb-3">
          El enlace @{username} está inactivo
        </h1>
        <p className="text-slate-600 dark:text-slate-400 max-w-md mb-8 text-sm sm:text-base leading-relaxed">
          El periodo de suscripción de este portafolio digital ha concluido. Si eres el propietario de este CV, reactiva tu plan para mantener tu enlace visible para clientes y reclutadores.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center w-full max-w-sm">
          <Link
            to="/login"
            className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-extrabold text-sm shadow-xl shadow-indigo-500/25 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] cursor-pointer"
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Reactivar mi Portafolio</span>
          </Link>
          <Link
            to="/"
            className="w-full py-3.5 px-6 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-sm transition-colors flex items-center justify-center"
          >
            Ir al Inicio
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative">
      {/* Polymorphic Dynamic Theme Renderer */}
      {/* ponytail: clean delegation to polymorphic ThemeRenderer with smooth 60fps live transition */}
      <ThemeRenderer
        profile={profile}
        themeOverride={profile.theme}
        onRecordClick={recordClick}
      />
    </div>
  )
}

