import React, { useState, useEffect } from 'react'
import { useProfileStore } from '../../stores/profileStore'
import { updateUserPasswordInSupabase, signOutFromSupabase } from '../../lib/supabaseClient'
import { compressImage } from '../../utils/imageCompressor'
import UserAvatar from '../Common/UserAvatar'
import {
  X,
  CreditCard,
  User,
  Lock,
  Check,
  Copy,
  ExternalLink,
  LogOut,
  Upload,
  Trash2
} from 'lucide-react'

// ponytail: Clean standard sidebar drawer with automatic @username blobatar and reliable logout
export default function UserAccountModal({ isOpen, onClose }) {
  const profiles = useProfileStore((state) => state.profiles)
  const activeUsername = useProfileStore((state) => state.activeUsername)
  const updateProfile = useProfileStore((state) => state.updateProfile)
  const openFlowModal = useProfileStore((state) => state.openFlowModal)
  const cancelSubscription = useProfileStore((state) => state.cancelSubscription)
  const reactivateSubscription = useProfileStore((state) => state.reactivateSubscription)
  const changeUsername = useProfileStore((state) => state.changeUsername)
  const isUsernameAvailable = useProfileStore((state) => state.isUsernameAvailable)
  const logout = useProfileStore((state) => state.logout)

  // ponytail: Only show the authenticated user's real profile, never mock data
  const currentProfile = (activeUsername && profiles[activeUsername]) || {}

  // Active section: 'profile' | 'membership' | 'security'
  const [activeSection, setActiveSection] = useState('profile')

  // Edit Name & Username state
  const [nameInput, setNameInput] = useState(currentProfile?.personalInfo?.name || '')
  const [newUsernameInput, setNewUsernameInput] = useState(currentProfile?.username || '')
  const [usernameStatus, setUsernameStatus] = useState({ state: 'idle', message: '' })
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('')

  // Password state
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordStatus, setPasswordStatus] = useState({ state: 'idle', message: '' })
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)

  // Subscription feedback
  const [cancelFeedback, setCancelFeedback] = useState('')
  const [copiedLink, setCopiedLink] = useState(false)

  // Photo upload state
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false)

  // Sync state on profile change
  useEffect(() => {
    if (currentProfile?.username) {
      setNewUsernameInput(currentProfile.username)
      setNameInput(currentProfile.personalInfo?.name || '')
    }
  }, [currentProfile?.username, currentProfile?.personalInfo?.name])

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
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

  // ponytail: Changing @username automatically regenerates the blobatar
  const handleSaveProfileData = async (e) => {
    e.preventDefault()
    setIsSavingProfile(true)
    setSaveSuccessMsg('')
    setUsernameStatus({ state: 'idle', message: '' })

    try {
      const cleanNewUser = newUsernameInput.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '')
      
      // If username changed
      if (cleanNewUser !== currentProfile.username) {
        if (cleanNewUser.length < 3) {
          setUsernameStatus({ state: 'error', message: 'El usuario debe tener al menos 3 caracteres.' })
          setIsSavingProfile(false)
          return
        }

        const available = await isUsernameAvailable(cleanNewUser)
        if (!available) {
          setUsernameStatus({ state: 'error', message: `El usuario @${cleanNewUser} ya está ocupado.` })
          setIsSavingProfile(false)
          return
        }

        const success = await changeUsername(currentProfile.username, cleanNewUser)
        if (!success) {
          setUsernameStatus({ state: 'error', message: 'No se pudo migrar el usuario.' })
          setIsSavingProfile(false)
          return
        }
      }

      // Update name if changed
      if (nameInput.trim() !== (currentProfile.personalInfo?.name || '')) {
        updateProfile(newUsernameInput || currentProfile.username, {
          personalInfo: {
            ...currentProfile.personalInfo,
            name: nameInput.trim()
          }
        })
      }

      setSaveSuccessMsg('¡Datos actualizados exitosamente!')
      setTimeout(() => setSaveSuccessMsg(''), 3000)
    } catch (err) {
      setUsernameStatus({ state: 'error', message: err.message || 'Error al guardar cambios.' })
    } finally {
      setIsSavingProfile(false)
    }
  }

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploadingPhoto(true)
    try {
      const compressed = await compressImage(file, {
        maxWidth: 600,
        maxHeight: 600,
        quality: 0.85,
        maxSizeBytes: 180 * 1024
      })

      updateProfile(currentProfile.username, {
        personalInfo: {
          ...currentProfile.personalInfo,
          avatar: compressed
        }
      })
      setSaveSuccessMsg('Foto personalizada guardada.')
      setTimeout(() => setSaveSuccessMsg(''), 3000)
    } catch (err) {
      alert('Error al procesar la foto: ' + err.message)
    } finally {
      setIsUploadingPhoto(false)
    }
  }

  const handleRemovePhoto = () => {
    // Setting avatar to 'blobatar' automatically reverts to user's @username blobatar
    updateProfile(currentProfile.username, {
      personalInfo: {
        ...currentProfile.personalInfo,
        avatar: 'blobatar'
      }
    })
    setSaveSuccessMsg('Volviste a tu Blobatar automático.')
    setTimeout(() => setSaveSuccessMsg(''), 3000)
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
    if (!window.confirm('¿Seguro que deseas cancelar la renovación mensual? Conservarás acceso a tu portafolio hasta el fin del periodo facturado.')) {
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

  // ponytail: Surgical and foolproof logout that clears store, supabase, storage and navigates to '/'
  const handleSignOut = async () => {
    onClose()
    logout()
    try {
      await signOutFromSupabase()
    } catch {}
    window.location.replace('/')
  }

  const SECTIONS = [
    { id: 'profile', label: 'Datos & @Username', icon: User },
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

      {/* Slide-over Sidebar Container */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <aside className="w-screen max-w-md bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col z-50">
          
          {/* 1. TOP BAR */}
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-950/70">
            <div className="flex items-center gap-2">
              <span className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-white">
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

          {/* 2. PROMINENT PROFILE HEADER (El usuario ve claramente su perfil y su Blobatar) */}
          <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
            <div className="flex items-center gap-4">
              {/* Blobatar / User Avatar */}
              <div className="relative group shrink-0">
                <UserAvatar
                  username={currentProfile.username}
                  avatarUrl={currentProfile.personalInfo?.avatar}
                  size={68}
                  className="w-[68px] h-[68px] rounded-2xl shadow-md border-2 border-palette-primary/30"
                />
                <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900 shadow-sm" />
              </div>

              {/* Identity & Link */}
              <div className="min-w-0 flex-1">
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white truncate leading-tight">
                  {currentProfile.personalInfo?.name || 'Usuario Mi Vitae'}
                </h3>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-xs font-mono font-bold text-palette-primary">
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
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                  {currentProfile.personalInfo?.email || 'Cuenta conectada'}
                </p>

                {/* Plan Badge */}
                <div className="mt-2 flex items-center gap-2">
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
                    <span>{isCanceled ? 'Cancelado' : isPremium ? 'Plan Pro' : '1er Mes Gratis ($0)'}</span>
                    <span className="font-mono font-normal">({daysRemaining}d restantes)</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 3. SIDEBAR NAVIGATION */}
          <div className="px-4 py-2 bg-slate-100/70 dark:bg-slate-950/40 border-b border-slate-200 dark:border-slate-800 flex gap-1">
            {SECTIONS.map((sec) => {
              const Icon = sec.icon
              const isSelected = activeSection === sec.id
              return (
                <button
                  key={sec.id}
                  onClick={() => setActiveSection(sec.id)}
                  className={`flex-1 px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    isSelected
                      ? 'bg-white dark:bg-slate-800 text-palette-primary shadow-sm border border-slate-200 dark:border-slate-700'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{sec.label}</span>
                </button>
              )
            })}
          </div>

          {/* 4. ACTIVE SECTION CONTENT */}
          <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">
            
            {/* ============================================================== */}
            {/* OPCIÓN 1: DATOS PERSONALES & @USERNAME */}
            {/* ============================================================== */}
            {activeSection === 'profile' && (
              <form onSubmit={handleSaveProfileData} className="space-y-4">
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

                {/* Full Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Nombre Completo
                  </label>
                  <input
                    type="text"
                    required
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-palette-primary/30"
                  />
                </div>

                {/* @Username */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Nombre de Usuario (@username)
                  </label>
                  <div className="flex items-center px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 focus-within:border-palette-primary focus-within:ring-2 focus-within:ring-palette-primary/30">
                    <span className="text-slate-400 font-mono text-xs select-none">@</span>
                    <input
                      type="text"
                      required
                      value={newUsernameInput}
                      onChange={(e) => setNewUsernameInput(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                      className="w-full bg-transparent text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none ml-1"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Tu Blobatar se recalcula automáticamente si cambias tu @username.
                  </p>
                </div>

                {/* Optional Custom Photo Upload */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Foto personalizada (opcional)
                  </label>
                  <p className="text-[10px] text-slate-500 mb-2">
                    Si no subes una foto, tu perfil usa tu Blobatar oficial generado automáticamente.
                  </p>

                  <div className="flex items-center gap-2">
                    <label className="cursor-pointer py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors flex items-center gap-1.5">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{isUploadingPhoto ? 'Procesando...' : 'Subir foto'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handlePhotoUpload}
                      />
                    </label>

                    {currentProfile.personalInfo?.avatar && currentProfile.personalInfo.avatar !== 'blobatar' && (
                      <button
                        type="button"
                        onClick={handleRemovePhoto}
                        className="py-2 px-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-600 text-xs font-bold hover:bg-rose-100 transition-colors flex items-center gap-1.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Volver a Blobatar</span>
                      </button>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="w-full py-2.5 px-4 rounded-xl bg-palette-primary hover:bg-palette-accent text-white text-xs font-bold shadow transition-all disabled:opacity-50 mt-2"
                >
                  {isSavingProfile ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </form>
            )}

            {/* ============================================================== */}
            {/* OPCIÓN 2: MEMBRESÍA & PAGOS */}
            {/* ============================================================== */}
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
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Estado de Membresía
                    </span>
                    <span className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full ${
                      isCanceled
                        ? 'bg-amber-100 text-amber-800'
                        : daysRemaining > 0
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}>
                      {isCanceled ? 'Renovación Cancelada' : daysRemaining > 0 ? 'Activo' : 'Vencido'}
                    </span>
                  </div>

                  <div>
                    <div className="text-base font-black text-slate-900 dark:text-white">
                      {isPremium ? 'Plan Pro Mensual' : 'Mes de Bienvenida Bonificado'}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Tarifa: <strong className="text-slate-700 dark:text-slate-200">$3.490 CLP / mes</strong>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
                    <span>Vencimiento del ciclo:</span>
                    <strong className="font-mono">{formattedExpiration}</strong>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
                    <span>Tiempo de acceso:</span>
                    <strong className="font-mono text-emerald-600 dark:text-emerald-400">{daysRemaining} días restantes</strong>
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
                <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
                  {isCanceled ? (
                    <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 space-y-2">
                      <p className="text-xs text-amber-800 dark:text-amber-300 font-medium">
                        Tu suscripción no se renovará automáticamente al finalizar los {daysRemaining} días.
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
                    <div className="text-center">
                      <button
                        type="button"
                        onClick={handleCancelMonthlySubscription}
                        className="text-xs text-slate-400 hover:text-rose-600 transition-colors"
                      >
                        Cancelar suscripción mensual
                      </button>
                      <p className="text-[10px] text-slate-400 mt-1">
                        Conserva tu portafolio activo hasta el {formattedExpiration} sin cobros posteriores.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* OPCIÓN 3: SEGURIDAD (CONTRASEÑA) */}
            {/* ============================================================== */}
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

          {/* 5. SIDEBAR FOOTER: CERRAR SESIÓN */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/80 flex items-center justify-between">
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
