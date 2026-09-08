import React, { useEffect } from 'react'
import { useParams, Link } from '../router/Router'
import { useProfileStore } from '../stores/profileStore'
import ThemeRenderer from '../components/Themes/ThemeRenderer'
import { Sparkles } from 'lucide-react'

export default function PortfolioPage() {
  const { username } = useParams()
  const getProfileByUsername = useProfileStore((state) => state.getProfileByUsername)
  const fetchRemoteProfile = useProfileStore((state) => state.fetchRemoteProfile)
  const recordView = useProfileStore((state) => state.recordView)
  const recordClick = useProfileStore((state) => state.recordClick)

  const profile = getProfileByUsername(username)
  const [isLoadingRemote, setIsLoadingRemote] = React.useState(!profile)

  useEffect(() => {
    let isMounted = true
    if (!profile && username) {
      setIsLoadingRemote(true)
      fetchRemoteProfile(username).finally(() => {
        if (isMounted) setIsLoadingRemote(false)
      })
    } else {
      setIsLoadingRemote(false)
    }
    return () => { isMounted = false }
  }, [username, profile, fetchRemoteProfile])

  useEffect(() => {
    if (profile?.username) {
      recordView(profile.username)
    }
  }, [profile?.username, recordView])

  if (isLoadingRemote) {
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

