import React, { useState, useEffect } from 'react'
import { useProfileStore } from '../../stores/profileStore'
import { updateUserPasswordInSupabase, signOutFromSupabase } from '../../lib/supabaseClient'
import UserAvatar from '../Common/UserAvatar'
import {
  X,
  CreditCard,
  User,
  Lock,
  Check,
  Copy,
  ExternalLink,
  LogOut
} from 'lucide-react'

// ponytail: Simplified, 100% responsive account drawer. Auto-Blobatar by @username only, no photo/name clutter.
export default function UserAccountModal({ isOpen, onClose }) {
  const profiles = useProfileStore((state) => state.profiles)
  const activeUsername = useProfileStore((state) => state.activeUsername)
  const openFlowModal = useProfileStore((state) => state.openFlowModal)
  const cancelSubscription = useProfileStore((state) => state.cancelSubscription)
  const reactivateSubscription = useProfileStore((state) => state.reactivateSubscription)
  const changeUsername = useProfileStore((state) => state.changeUsername)
  const logout = useProfileStore((state) => state.logout)

  const currentProfile = (activeUsername && profiles[activeUsername]) || {}

  // Active section: 'username' | 'membership' | 'security'
  const [activeSection, setActiveSection] = useState('username')

  // Username form state
  const [newUsername, setNewUsername] = useState(currentProfile?.username || '')
  const [usernameStatus, setUsernameStatus] = useState({ state: 'idle', message: '' })
  const [isSavingUsername, setIsSavingUsername] = useState(false)
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('')

  // Password form state
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordStatus, setPasswordStatus] = useState({ state: 'idle', message: '' })
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)

  // Subscription feedback
  const [cancelFeedback, setCancelFeedback] = useState('')
  const [copiedLink, setCopiedLink] = useState(false)

  // Sync username input on profile change
  useEffect(() => {
    if (currentProfile?.username) {
      setNewUsername(currentProfile.username)
    }
  }, [currentProfile?.username])

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen || !activeUsername || !currentProfile?.username) return null

  // Membership Calculations
  const isPremium = currentProfile.plan === 'premium'
  const planStatus = currentProfile.planStatus || currentProfile.plan_status || 'active'
  const isCanceled = planStatus === 'canceled'

  const rawExpiresAt = currentProfile.planExpiresAt || currentProfile.plan_expires_at
  const rawTrialAt = currentProfile.trialActivatedAt || currentProfile.trial_activated_at

  let expirationDate = null
  if (rawExpiresAt) {
    expirationDate = new Date(rawExpiresAt)
  } else if (rawTrialAt) {
    expirationDate = new Date(new Date(rawTrialAt).getTime() + 30 * 24 * 60 * 60 * 1000)
  } else {
    expirationDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  }

  const now = new Date()
  const diffMs = expirationDate.getTime() - now.getTime()
  const daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)))
  const formattedExpiration = expirationDate.toLocaleDateString('es-CL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })

  // Handlers
  const handleCopyLink = () => {
    const fullUrl = typeof window !== 'undefined' && window.location?.origin && !window.location.origin.includes('localhost')
      ? `${window.location.origin}/${currentProfile.username}`
      : `https://mivitae.wearesamod.com/${currentProfile.username}`
    navigator.clipboard.writeText(fullUrl)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2000)
  }

  // ponytail: Only @username is managed here. Changing it automatically recalibrates Blobatar.
  const handleSaveUsername = async (e) => {
    e.preventDefault()
    setIsSavingUsername(true)
    setSaveSuccessMsg('')
    setUsernameStatus({ state: 'idle', message: '' })

    const clean = newUsername.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '')
    if (clean === currentProfile.username) {
      setIsSavingUsername(false)
      return
    }

    if (clean.length < 3) {
      setUsernameStatus({ state: 'error', message: 'El usuario debe tener al menos 3 caracteres.' })
      setIsSavingUsername(false)
      return
    }

    try {
      const res = await changeUsername(currentProfile.username, clean)
      if (res && res.success) {
        setSaveSuccessMsg('¡Nombre de usuario y Blobatar actualizados!')
        setTimeout(() => setSaveSuccessMsg(''), 3000)
      } else {
        setUsernameStatus({ state: 'error', message: res?.error || 'No se pudo actualizar el usuario.' })
      }
    } catch (err) {
      setUsernameStatus({ state: 'error', message: err.message || 'Error al guardar.' })
    } finally {
      setIsSavingUsername(false)
    }
  }

  const handlePasswordUpdate = async (e) => {
    e.preventDefault()
    if (newPassword.length < 6) {
      setPasswordStatus({ state: 'error', message: 'La contraseña debe tener al menos 6 caracteres.' })
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordStatus({ state: 'error', message: 'Las contraseñas no coinciden.' })
      return
    }

    setIsUpdatingPassword(true)
    setPasswordStatus({ state: 'idle', message: '' })

    try {
      const result = await updateUserPasswordInSupabase(newPassword)
      if (result.success) {
        setPasswordStatus({ state: 'success', message: '¡Contraseña actualizada con éxito!' })
        setNewPassword('')
        setConfirmPassword('')
      } else {
        setPasswordStatus({ state: 'error', message: result.error || 'No se pudo actualizar la contraseña.' })
      }
    } catch (err) {
      setPasswordStatus({ state: 'error', message: err.message || 'Error de conexión.' })
    } finally {
      setIsUpdatingPassword(false)
    }
  }

  const handleCancelMonthlySubscription = async () => {
    if (!window.confirm('¿Deseas cancelar la renovación mensual? Conservarás acceso hasta el fin de tu ciclo.')) {
      return
    }
    const res = await cancelSubscription(currentProfile.username)
    if (res.success) {
      setCancelFeedback('Suscripción cancelada. Tu portafolio seguirá activo hasta el fin de tu ciclo.')
      setTimeout(() => setCancelFeedback(''), 5000)
    }
  }

  const handleReactivate = async () => {
    const res = await reactivateSubscription(currentProfile.username)
    if (res.success) {
      setCancelFeedback('¡Suscripción reactivada con éxito!')
      setTimeout(() => setCancelFeedback(''), 5000)
    }
  }

  const handleSignOut = async () => {
    onClose()
    logout()
    try {
      await signOutFromSupabase()
    } catch {}
    window.location.replace('/')
  }

  const SECTIONS = [
    { id: 'username', label: '@Username', icon: User },
    { id: 'membership', label: 'Membresía', icon: CreditCard },
    { id: 'security', label: 'Seguridad', icon: Lock }
  ]

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Semi-transparent Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        aria-hidden="true"
      />

      {/* 100% Responsive Slide-over Sidebar Container: full width on mobile, 420px drawer on desktop */}
      <div className="fixed inset-y-0 right-0 max-w-full flex w-full sm:w-auto">
        <aside className="w-full sm:w-[420px] bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col z-50 h-full">
          
          {/* 1. TOP BAR */}
          <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-950/70">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-white">
                Mi Cuenta
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-palette-primary/10 text-palette-primary font-bold">
                Mi Vitae
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
              title="Cerrar panel"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 2. RESPONSIVE PROFILE HEADER */}
          <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
            <div className="flex items-center gap-3 sm:gap-4">
              {/* Auto Blobatar */}
              <div className="relative shrink-0">
                <UserAvatar
                  username={currentProfile.username}
                  size={58}
                  className="w-[58px] h-[58px] rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700"
                />
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900 shadow-sm" />
              </div>

              {/* User Details */}
              <div className="min-w-0 flex-1">
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white truncate leading-snug">
                  {currentProfile.personalInfo?.name || 'Mi Portafolio'}
                </h3>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="text-xs font-mono font-bold text-palette-primary truncate">
                    @{currentProfile.username}
                  </span>
                  <button
                    onClick={handleCopyLink}
                    title="Copiar enlace"
                    className="p-1 rounded text-slate-400 hover:text-palette-primary hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                  <a
                    href={`/${currentProfile.username}`}
                    target="_blank"
                    rel="noreferrer"
                    title="Ver portafolio público"
                    className="p-1 rounded text-slate-400 hover:text-palette-primary hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

                {/* Plan Badge */}
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 ${
                    isCanceled
                      ? 'bg-amber-100 text-amber-800 border border-amber-300'
                      : daysRemaining > 0
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-rose-100 text-rose-800 border border-rose-300'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      isCanceled ? 'bg-amber-500' : daysRemaining > 0 ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                    }`} />
                    <span>{isCanceled ? 'Cancelado' : isPremium ? 'Plan Pro' : '1er Mes Gratis'}</span>
                    <span className="font-mono font-normal">({daysRemaining}d)</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 3. NAVIGATION TABS */}
          <div className="px-3 py-2 bg-slate-100/70 dark:bg-slate-950/40 border-b border-slate-200 dark:border-slate-800 flex gap-1">
            {SECTIONS.map((sec) => {
              const Icon = sec.icon
              const isSelected = activeSection === sec.id
              return (
                <button
                  key={sec.id}
                  onClick={() => setActiveSection(sec.id)}
                  className={`flex-1 py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    isSelected
                      ? 'bg-white dark:bg-slate-800 text-palette-primary shadow-sm border border-slate-200 dark:border-slate-700'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{sec.label}</span>
                </button>
              )
            })}
          </div>

          {/* 4. CONTENT BODY */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            
            {/* TAB 1: @USERNAME & BLOBATAR */}
            {activeSection === 'username' && (
              <form onSubmit={handleSaveUsername} className="space-y-4">
                {saveSuccessMsg && (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium">
                    {saveSuccessMsg}
                  </div>
                )}
                {usernameStatus.state === 'error' && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium">
                    {usernameStatus.message}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Nombre de Usuario (@username)
                  </label>
                  <div className="flex items-center px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 focus-within:border-palette-primary focus-within:ring-2 focus-within:ring-palette-primary/30">
                    <span className="text-slate-400 font-mono text-xs select-none">@</span>
                    <input
                      type="text"
                      required
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                      className="w-full bg-transparent text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none ml-1"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">
                    Tu Blobatar oficial e hipervínculo público (<span className="font-mono text-slate-700 dark:text-slate-300">mivitae.wearesamod.com/@{newUsername || 'usuario'}</span>) se recalculan automáticamente.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isSavingUsername || newUsername === currentProfile.username}
                  className="w-full py-2.5 px-4 rounded-xl bg-palette-primary hover:bg-palette-accent text-white text-xs font-bold shadow transition-all disabled:opacity-40"
                >
                  {isSavingUsername ? 'Actualizando...' : 'Actualizar @username'}
                </button>
              </form>
            )}

            {/* TAB 2: MEMBRESÍA & PAGOS */}
            {activeSection === 'membership' && (
              <div className="space-y-4">
                {cancelFeedback && (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium">
                    {cancelFeedback}
                  </div>
                )}

                {/* Plan Status Card */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800/80 dark:to-slate-900/80 border border-slate-200 dark:border-slate-700 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Estado
                    </span>
                    <span className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full ${
                      isCanceled
                        ? 'bg-amber-100 text-amber-800'
                        : daysRemaining > 0
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}>
                      {isCanceled ? 'Cancelada' : daysRemaining > 0 ? 'Activo' : 'Vencido'}
                    </span>
                  </div>

                  <div>
                    <div className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                      {isPremium ? 'Plan Pro Mensual' : 'Mes de Bienvenida ($0 CLP)'}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Tarifa: <strong className="text-slate-700 dark:text-slate-200">$3.490 CLP / mes</strong>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
                    <span>Vencimiento:</span>
                    <strong className="font-mono">{formattedExpiration}</strong>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
                    <span>Días restantes:</span>
                    <strong className="font-mono text-emerald-600 dark:text-emerald-400">{daysRemaining} días</strong>
                  </div>
                </div>

                {/* Pay / Renew Action */}
                <button
                  type="button"
                  onClick={() => openFlowModal(currentProfile.username)}
                  className="w-full py-3 px-4 rounded-xl bg-palette-primary hover:bg-palette-accent text-white text-xs font-extrabold shadow-md shadow-palette-primary/20 transition-all flex items-center justify-center gap-2"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Renovar / Pagar con Flow.cl ($3.490 CLP)</span>
                </button>

                {/* Cancel / Reactivate Subscription */}
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 text-center">
                  {isCanceled ? (
                    <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 space-y-1.5">
                      <p className="text-xs text-amber-800 dark:text-amber-300 font-medium">
                        Tu portafolio seguirá activo hasta el término de tu periodo.
                      </p>
                      <button
                        type="button"
                        onClick={handleReactivate}
                        className="text-xs font-bold text-amber-900 dark:text-amber-200 underline hover:no-underline"
                      >
                        Reactivar renovación automática
                      </button>
                    </div>
                  ) : (
                    <div>
                      <button
                        type="button"
                        onClick={handleCancelMonthlySubscription}
                        className="text-xs text-slate-400 hover:text-rose-600 transition-colors"
                      >
                        Cancelar suscripción mensual
                      </button>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Conserva tu portafolio activo hasta el {formattedExpiration}.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: SEGURIDAD */}
            {activeSection === 'security' && (
              <form onSubmit={handlePasswordUpdate} className="space-y-4">
                {passwordStatus.state === 'success' && (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium">
                    {passwordStatus.message}
                  </div>
                )}
                {passwordStatus.state === 'error' && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium">
                    {passwordStatus.message}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Nueva Contraseña
                  </label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-palette-primary/30"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Confirmar Contraseña
                  </label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repite la contraseña"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-palette-primary/30"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isUpdatingPassword}
                  className="w-full py-2.5 px-4 rounded-xl bg-palette-primary hover:bg-palette-accent text-white text-xs font-bold shadow transition-all disabled:opacity-50"
                >
                  {isUpdatingPassword ? 'Actualizando...' : 'Cambiar Contraseña'}
                </button>
              </form>
            )}

          </div>

          {/* 5. FOOTER: CERRAR SESIÓN */}
          <div className="p-3.5 sm:p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/80 flex items-center justify-between">
            <button
              type="button"
              onClick={handleSignOut}
              className="px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors flex items-center gap-1.5"
            >
              <LogOut className="w-4 h-4" />
              <span>Cerrar Sesión</span>
            </button>
            <span className="text-[11px] text-slate-400 font-mono">
              Mi Vitae v1.0
            </span>
          </div>

        </aside>
      </div>
    </div>
  )
}
