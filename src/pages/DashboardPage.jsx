import React, { useState, useEffect, useRef } from 'react'
import { Link } from '../router/Router'
import { useProfileStore } from '../stores/profileStore'
import { saveProfileToSupabase, getCurrentUser } from '../lib/supabaseClient'
import QrModal from '../components/Common/QrModal'
import { compressImage, getApproximateDataUrlBytes, formatBytes } from '../utils/imageCompressor'
import {
  LayoutDashboard,
  User,
  Palette,
  Briefcase,
  GraduationCap,
  Wrench,
  FolderGit2,
  Languages,
  MessageSquare,
  BarChart3,
  Save,
  Eye,
  ExternalLink,
  RefreshCw,
  CheckCircle2,
  Smartphone,
  Monitor,
  Upload,
  Trash2,
  Plus,
  X,
  Check,
  Sparkles,
  Globe,
  Linkedin,
  Github,
  Mail,
  Phone,
  MapPin,
  Lock,
  Award,
  CreditCard,
  TrendingUp,
  Copy,
  MessageCircle,
  QrCode,
  Share2,
} from 'lucide-react'

// Available Themes Definition
const THEME_OPTIONS = [
  {
    id: 'minimalist',
    name: 'Minimalista',
    desc: 'Editorial sobrio blanco y negro tipo New York Times',
    category: 'Legal, Finanzas, Consultoría',
    accentColor: '#1C1917',
    bgColor: '#FAFAF9',
    tag: 'Clásico'
  },
  {
    id: 'creative',
    name: 'Creativo',
    desc: 'Glassmorphism dark mode con orbes violeta y neón',
    category: 'UX/UI, Diseño, Media, Arte',
    accentColor: '#8B5CF6',
    bgColor: '#0F0E17',
    tag: 'Bento Grid'
  },
  {
    id: 'tech',
    name: 'Técnico',
    desc: 'Terminal dark hacker con acentos verde esmeralda',
    category: 'Software, DevOps, Cloud, Ciberseguridad',
    accentColor: '#10B981',
    bgColor: '#0B0F19',
    tag: 'Terminal'
  },
  {
    id: 'warm',
    name: 'Cálido',
    desc: 'Tonos tierra orgánicos, beige y tipografía acogedora',
    category: 'Salud, Psicología, Bienestar, Coaching',
    accentColor: '#D97706',
    bgColor: '#FFFDF9',
    tag: 'Bienestar'
  },
  {
    id: 'executive',
    name: 'Ejecutivo',
    desc: 'Azul marino corporativo de alto impacto directivo',
    category: 'C-Level, Directores, Operaciones B2B',
    accentColor: '#1E3A8A',
    bgColor: '#F8FAFC',
    tag: 'Corporativo'
  }
]

export default function DashboardPage() {
  const profiles = useProfileStore((state) => state.profiles)
  const activeUsername = useProfileStore((state) => state.activeUsername)
  const setActiveUsername = useProfileStore((state) => state.setActiveUsername)
  const updateProfile = useProfileStore((state) => state.updateProfile)
  const fetchRemoteProfile = useProfileStore((state) => state.fetchRemoteProfile)
  const resetToDefaults = useProfileStore((state) => state.resetToDefaults)
  const openFlowModal = useProfileStore((state) => state.openFlowModal)

  // Current active profile from store
  const storeProfile = profiles[activeUsername] || Object.values(profiles)[0]

  // Deep clone helper to prevent direct store mutation
  const getInitialProfileState = (source) => {
    if (!source) return null
    return JSON.parse(JSON.stringify(source))
  }

  // Live editable state
  const [profileData, setProfileData] = useState(() => getInitialProfileState(storeProfile))
  const [authUser, setAuthUser] = useState(null)
  const [activeTab, setActiveTab] = useState('personal')
  const [savedAlert, setSavedAlert] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isCompressingAvatar, setIsCompressingAvatar] = useState(false)
  const [compressingProjectIdx, setCompressingProjectIdx] = useState(null)
  const [avatarDragOver, setAvatarDragOver] = useState(false)
  const [isQrOpen, setIsQrOpen] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)

  const avatarInputRef = useRef(null)

  const handleCopyLink = () => {
    const fullUrl = `https://mivitae.wearesamod.com/${profileData.username}`
    navigator.clipboard.writeText(fullUrl)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2500)
  }

  // Detect authenticated Supabase user and sync
  useEffect(() => {
    let isMounted = true
    getCurrentUser().then((user) => {
      if (user && isMounted) {
        setAuthUser(user)
        const authUsername = user.user_metadata?.username
        if (authUsername && profiles[authUsername] && !sessionStorage.getItem('manual_archetype_selected')) {
          setActiveUsername(authUsername)
        }
      }
    }).catch(() => {})
    return () => { isMounted = false }
  }, [])

  // Sync local state and hydrate from Supabase Cloud if available
  useEffect(() => {
    let isMounted = true
    if (activeUsername) {
      fetchRemoteProfile(activeUsername).then((remote) => {
        if (remote && isMounted) {
          setProfileData(getInitialProfileState(remote))
        }
      })
    }
    if (storeProfile && isMounted) {
      setProfileData(getInitialProfileState(storeProfile))
    }
    return () => { isMounted = false }
  }, [activeUsername])

  if (!profileData) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 bg-slate-50 dark:bg-slate-950">
        <div className="text-center space-y-4">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-indigo-600" />
          <p className="text-slate-600 dark:text-slate-400 font-medium">Cargando Live Studio...</p>
        </div>
      </div>
    )
  }

  // Switch profile in top bar
  const handleProfileSwitch = (newUname) => {
    sessionStorage.setItem('manual_archetype_selected', 'true')
    setActiveUsername(newUname)
  }

  // Save changes to Zustand Store AND sync directly with Supabase Cloud
  const handleSave = async (e) => {
    if (e) e.preventDefault()
    if (!profileData || !profileData.username) return

    setIsSaving(true)
    // 1. Guardar en store local para reactividad inmediata
    updateProfile(profileData.username, profileData)

    // 2. Guardar en la base de datos Supabase para que esté visible en todo el mundo
    try {
      await saveProfileToSupabase(profileData)
    } catch (err) {
      console.warn('[Dashboard] Error al sincronizar perfil con Supabase:', err)
    } finally {
      setIsSaving(false)
    }

    setSavedAlert(true)
    setTimeout(() => setSavedAlert(false), 3500)
  }

  // Reset to initial mock profiles with production safety checks
  const DEMO_ARCHETYPES = ['carlos_dev', 'antonia_ux', 'valeria_psico', 'rodrigo_ops', 'abogado_consultor']
  const isCustomProductionProfile = !DEMO_ARCHETYPES.includes(profileData.username)

  const handleResetDefaults = () => {
    const confirmMessage = isCustomProductionProfile
      ? `⚠️ ADVERTENCIA DE PRODUCCIÓN: Estás en tu perfil real (@${profileData.username}).\n\nRestablecer valores restaurará las 5 plantillas de demostración originales y NO eliminará tu perfil real en la base de datos de Supabase Cloud.\n\n¿Deseas continuar?`
      : '¿Deseas restablecer los arquetipos de demostración a sus valores por defecto? Se perderán las modificaciones no guardadas en estas plantillas.'

    if (window.confirm(confirmMessage)) {
      resetToDefaults()
      const defaultProf = profiles['carlos_dev'] || Object.values(profiles)[0]
      setProfileData(getInitialProfileState(defaultProf))
      setSavedAlert(false)
    }
  }

  // Personal Info Updaters
  const updatePersonalInfo = (field, value) => {
    setProfileData((prev) => ({
      ...prev,
      personalInfo: {
        ...prev.personalInfo,
        [field]: value
      }
    }))
  }

  // Avatar Compressor Handlers with immediate Supabase Cloud synchronization
  const handleAvatarFileUpload = async (file) => {
    if (!file || !file.type.startsWith('image/')) {
      alert('Por favor selecciona un archivo de imagen válido (JPG, PNG, WebP).')
      return
    }

    try {
      setIsCompressingAvatar(true)
      const compressedBase64 = await compressImage(file, {
        maxWidth: 600,
        maxHeight: 600,
        quality: 0.85,
        maxSizeBytes: 180 * 1024
      })

      updatePersonalInfo('avatar', compressedBase64)

      // Synchronize immediately to store and Supabase to guarantee persistence
      const updatedProfile = {
        ...profileData,
        personalInfo: {
          ...profileData.personalInfo,
          avatar: compressedBase64
        }
      }
      updateProfile(profileData.username, updatedProfile)
      saveProfileToSupabase(updatedProfile).catch((err) => {
        console.warn('[Dashboard] Avatar auto-sync to Supabase notice:', err)
      })
    } catch (err) {
      console.error('Error al comprimir avatar:', err)
      alert('Hubo un problema al procesar la imagen.')
    } finally {
      setIsCompressingAvatar(false)
    }
  }

  // Experience CRUD
  const handleAddExperience = () => {
    const newExp = {
      id: `exp-${Date.now()}`,
      role: 'Nuevo Cargo',
      company: 'Empresa / Organización',
      startDate: new Date().toISOString().slice(0, 7),
      endDate: null,
      current: true,
      description: 'Describe las responsabilidades principales y el impacto de tu labor...',
      achievements: ['Primer logro o hito clave alcanzado']
    }
    setProfileData((prev) => ({
      ...prev,
      experience: [newExp, ...(prev.experience || [])]
    }))
  }

  const handleUpdateExperience = (id, field, value) => {
    setProfileData((prev) => ({
      ...prev,
      experience: (prev.experience || []).map((exp) =>
        exp.id === id ? { ...exp, [field]: value } : exp
      )
    }))
  }

  const handleDeleteExperience = (id) => {
    setProfileData((prev) => ({
      ...prev,
      experience: (prev.experience || []).filter((exp) => exp.id !== id)
    }))
  }

  const handleAddAchievement = (expId) => {
    setProfileData((prev) => ({
      ...prev,
      experience: (prev.experience || []).map((exp) => {
        if (exp.id === expId) {
          return {
            ...exp,
            achievements: [...(exp.achievements || []), 'Nuevo hito o logro']
          }
        }
        return exp
      })
    }))
  }

  const handleUpdateAchievement = (expId, index, value) => {
    setProfileData((prev) => ({
      ...prev,
      experience: (prev.experience || []).map((exp) => {
        if (exp.id === expId) {
          const updatedAchievements = [...(exp.achievements || [])]
          updatedAchievements[index] = value
          return { ...exp, achievements: updatedAchievements }
        }
        return exp
      })
    }))
  }

  const handleDeleteAchievement = (expId, index) => {
    setProfileData((prev) => ({
      ...prev,
      experience: (prev.experience || []).map((exp) => {
        if (exp.id === expId) {
          const updatedAchievements = (exp.achievements || []).filter((_, i) => i !== index)
          return { ...exp, achievements: updatedAchievements }
        }
        return exp
      })
    }))
  }

  // Education CRUD
  const handleAddEducation = () => {
    const newEdu = {
      id: `edu-${Date.now()}`,
      degree: 'Título o Grado Académico',
      institution: 'Universidad o Instituto',
      year: new Date().getFullYear().toString(),
      details: 'Mención de honor, proyectos de investigación o especialidad...'
    }
    setProfileData((prev) => ({
      ...prev,
      education: [newEdu, ...(prev.education || [])]
    }))
  }

  const handleUpdateEducation = (id, field, value) => {
    setProfileData((prev) => ({
      ...prev,
      education: (prev.education || []).map((edu) =>
        edu.id === id ? { ...edu, [field]: value } : edu
      )
    }))
  }

  const handleDeleteEducation = (id) => {
    setProfileData((prev) => ({
      ...prev,
      education: (prev.education || []).filter((edu) => edu.id !== id)
    }))
  }

  // Skills CRUD
  const handleAddSkill = () => {
    const newSkill = {
      id: `sk-${Date.now()}`,
      name: 'Nueva Habilidad',
      level: 90,
      category: 'Especialidad'
    }
    setProfileData((prev) => ({
      ...prev,
      skills: [...(prev.skills || []), newSkill]
    }))
  }

  const handleUpdateSkill = (id, field, value) => {
    setProfileData((prev) => ({
      ...prev,
      skills: (prev.skills || []).map((sk) =>
        sk.id === id ? { ...sk, [field]: value } : sk
      )
    }))
  }

  const handleDeleteSkill = (id) => {
    setProfileData((prev) => ({
      ...prev,
      skills: (prev.skills || []).filter((sk) => sk.id !== id)
    }))
  }

  // Projects CRUD
  const handleAddProject = () => {
    const newProj = {
      id: `proj-${Date.now()}`,
      title: 'Nuevo Proyecto / Caso de Éxito',
      description: 'Breve explicación del problema, solución implementada y resultados medibles.',
      image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=600&q=80',
      tags: ['Innovación', 'Estrategia'],
      liveUrl: 'https://ejemplo.com',
      repoUrl: ''
    }
    setProfileData((prev) => ({
      ...prev,
      projects: [newProj, ...(prev.projects || [])]
    }))
  }

  const handleUpdateProject = (id, field, value) => {
    setProfileData((prev) => ({
      ...prev,
      projects: (prev.projects || []).map((proj) =>
        proj.id === id ? { ...proj, [field]: value } : proj
      )
    }))
  }

  const handleDeleteProject = (id) => {
    setProfileData((prev) => ({
      ...prev,
      projects: (prev.projects || []).filter((proj) => proj.id !== id)
    }))
  }

  const handleProjectImageUpload = async (projId, file) => {
    if (!file || !file.type.startsWith('image/')) {
      alert('Por favor selecciona una imagen válida.')
      return
    }

    try {
      setCompressingProjectIdx(projId)
      const compressedBase64 = await compressImage(file, {
        maxWidth: 800,
        maxHeight: 600,
        quality: 0.82,
        maxSizeBytes: 200 * 1024
      })
      handleUpdateProject(projId, 'image', compressedBase64)
    } catch (err) {
      console.error('Error al comprimir foto de proyecto:', err)
      alert('No se pudo procesar la imagen del proyecto.')
    } finally {
      setCompressingProjectIdx(null)
    }
  }

  // Languages CRUD
  const handleAddLanguage = () => {
    const newLang = {
      id: `lang-${Date.now()}`,
      name: 'Idioma',
      level: 'Avanzado Profesional (C1)'
    }
    setProfileData((prev) => ({
      ...prev,
      languages: [...(prev.languages || []), newLang]
    }))
  }

  const handleUpdateLanguage = (id, field, value) => {
    setProfileData((prev) => ({
      ...prev,
      languages: (prev.languages || []).map((lang) =>
        lang.id === id ? { ...lang, [field]: value } : lang
      )
    }))
  }

  const handleDeleteLanguage = (id) => {
    setProfileData((prev) => ({
      ...prev,
      languages: (prev.languages || []).filter((lang) => lang.id !== id)
    }))
  }

  // Floating Button Updaters
  const updateFloatingButton = (field, value) => {
    setProfileData((prev) => ({
      ...prev,
      floatingButton: {
        ...(prev.floatingButton || {}),
        [field]: value
      }
    }))
  }

  // Tab Navigation Items
  const tabs = [
    { id: 'personal', label: 'Personal & Bio', icon: User, count: null },
    { id: 'theme', label: 'Tema & Estilo', icon: Palette, count: null },
    { id: 'experience', label: 'Experiencia', icon: Briefcase, count: profileData.experience?.length || 0 },
    { id: 'education', label: 'Educación', icon: GraduationCap, count: profileData.education?.length || 0 },
    { id: 'skills', label: 'Habilidades', icon: Wrench, count: profileData.skills?.length || 0 },
    { id: 'projects', label: 'Proyectos', icon: FolderGit2, count: profileData.projects?.length || 0 },
    { id: 'languages', label: 'Idiomas', icon: Languages, count: profileData.languages?.length || 0 },
    { id: 'floatingButton', label: 'Botón Flotante', icon: MessageSquare, count: null }
  ]

  const avatarSize = getApproximateDataUrlBytes(profileData.personalInfo?.avatar)

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased">
      
      {/* Studio Top Navigation Bar */}
      <header className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-4 sm:px-6 py-3 shadow-md">
        <div className="max-w-[1720px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* Studio Brand & Title */}
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-palette-gradient text-white shadow-md shadow-palette-glow">
              <LayoutDashboard className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-extrabold tracking-tight text-white flex items-center gap-2">
                  <span>Mi Vitae</span>
                  <span className="text-palette-primary font-mono font-normal text-xs px-2 py-0.5 rounded-md bg-palette-primary/10 border border-palette-primary/30">
                    Studio & Control Center
                  </span>
                </h1>
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Editor polimórfico en tiempo real con compresión nativa de imágenes
              </p>
            </div>
          </div>

          {/* Archetype Selector & Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            
            {/* Profile Selector */}
            <div className="flex items-center gap-2 bg-slate-800/80 border border-slate-700/80 rounded-xl px-2.5 py-1">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider hidden lg:inline">
                {authUser ? 'Cuenta:' : 'Arquetipo:'}
              </span>
              <select
                value={activeUsername}
                onChange={(e) => handleProfileSwitch(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-200 focus:outline-none cursor-pointer py-1"
              >
                {/* User's authenticated / custom accounts */}
                {Object.keys(profiles).some((u) => !DEMO_ARCHETYPES.includes(u)) && (
                  <optgroup label="👤 Mis Perfiles (Producción)" className="bg-slate-900 text-indigo-400 font-bold">
                    {Object.keys(profiles)
                      .filter((uname) => !DEMO_ARCHETYPES.includes(uname))
                      .map((uname) => (
                        <option key={uname} value={uname} className="bg-slate-900 text-emerald-300 font-bold">
                          ⭐ @{uname} ({profiles[uname]?.personalInfo?.name || 'Mi Perfil'})
                        </option>
                      ))}
                  </optgroup>
                )}

                {/* Demo archetypes */}
                <optgroup label="🎨 Arquetipos Demo" className="bg-slate-900 text-slate-400 font-semibold">
                  {Object.keys(profiles)
                    .filter((uname) => DEMO_ARCHETYPES.includes(uname))
                    .map((uname) => (
                      <option key={uname} value={uname} className="bg-slate-900 text-slate-200">
                        @{uname} ({profiles[uname]?.personalInfo?.name?.split(' ')[0]})
                      </option>
                    ))}
                </optgroup>
              </select>
            </div>

            {/* Reset to Defaults */}
            <button
              type="button"
              onClick={handleResetDefaults}
              title="Restablecer valores iniciales de prueba"
              className="p-2 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-1.5 text-xs font-medium cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="hidden xl:inline">Restablecer</span>
            </button>

            {/* View Live Link */}
            <Link
              to={`/${profileData.username}`}
              target="_blank"
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Eye className="w-3.5 h-3.5 text-indigo-400" />
              <span>Ver en Vivo</span>
              <ExternalLink className="w-3 h-3 text-slate-400 opacity-80" />
            </Link>

            {/* Subscription Status / Flow.cl Trigger */}
            {storeProfile?.plan === 'premium' ? (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-bold shadow-sm">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Suscripción Activa</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => openFlowModal({ username: profileData.username, planName: 'Suscripción Mi Vitae ($3.490 CLP/mes)', amount: 3490 })}
                className="px-3.5 py-2 rounded-xl bg-[#0F265C] hover:bg-[#163884] text-white border border-cyan-500/40 text-xs font-bold shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                title="Suscripción Flow.cl ($3.490 CLP/mes)"
              >
                <CreditCard className="w-3.5 h-3.5 text-cyan-300" />
                <span>Flow.cl ($3.490)</span>
              </button>
            )}

            {/* Save Changes Button */}
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 rounded-xl bg-palette-gradient hover:opacity-95 text-white text-xs font-bold shadow-lg shadow-palette-glow transition-all flex items-center gap-2 active:scale-95 cursor-pointer disabled:opacity-75"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Sincronizando...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Guardar Cambios</span>
                </>
              )}
            </button>

          </div>

        </div>
      </header>

      {/* Notification Toast */}
      {savedAlert && (
        <div className="fixed top-18 right-6 z-50 p-4 rounded-2xl bg-emerald-950/90 border border-emerald-500/50 text-emerald-200 text-xs font-bold flex items-center gap-3 shadow-2xl backdrop-blur-xl animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <div>
            <div className="text-white font-extrabold text-sm">¡Portafolio Actualizado!</div>
            <div className="text-emerald-300/90 font-normal text-[11px]">
              Los cambios se han sincronizado en el almacenamiento local y la vista pública @{profileData.username}.
            </div>
          </div>
          <button onClick={() => setSavedAlert(false)} className="text-emerald-400 hover:text-white ml-2">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Split-Screen Workspace */}
      <main className="flex-1 max-w-[1720px] w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ========================================================================= */}
        {/* LEFT COLUMN: MODULAR ACCORDION / TABBED EDITOR (Span 7) */}
        {/* ========================================================================= */}
        <section aria-label="Editor Modular" className="lg:col-span-7 xl:col-span-7 bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col gap-6">
          
          {/* Subscription Status Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 border border-indigo-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-inner">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-indigo-600/30 border border-indigo-400/30 text-indigo-300">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold text-white">
                    {storeProfile?.plan === 'premium' ? 'Suscripción Mi Vitae' : '1er Mes Gratis Activo ($0 CLP)'}
                  </span>
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-700/50">
                    {storeProfile?.plan === 'premium' ? 'Suscripción Activa' : 'Bonificado'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {storeProfile?.plan === 'premium'
                    ? `Transacción Flow: ${storeProfile.lastTransaction?.transactionId || 'FLW-000000'} (${storeProfile.lastTransaction?.paymentMethod || 'Webpay Plus'})`
                    : '1er Mes bonificado por completar feedback. Suscripción de $3.490 CLP/mes después.'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => openFlowModal({ username: profileData.username, planName: 'Suscripción Mi Vitae ($3.490 CLP/mes)', amount: 3490 })}
              className="px-3.5 py-2 rounded-xl bg-[#0F265C] hover:bg-[#163884] text-white text-xs font-bold border border-cyan-500/40 shadow-md transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <CreditCard className="w-3.5 h-3.5 text-cyan-300" />
              <span>{storeProfile?.plan === 'premium' ? 'Gestionar Suscripción' : 'Pagar Suscripción ($3.490)'}</span>
            </button>
          </div>

          {/* Editor Header & Tab Switcher */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <span>Editor de Contenido</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
                    @{profileData.username}
                  </span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Edita cada sección modularmente con actualización inmediata en el Live Preview.
                </p>
              </div>

              <span className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-indigo-950/70 border border-indigo-500/30 text-indigo-300">
                {profileData.theme}
              </span>
            </div>

            {/* Scrollable Horizontal Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-slate-800/80 no-scrollbar">
              {tabs.map((tab) => {
                const IconComponent = tab.icon
                const isActive = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                        : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-700/50'
                    }`}
                  >
                    <IconComponent className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                    {tab.count !== null && (
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                        isActive ? 'bg-indigo-700 text-white' : 'bg-slate-700 text-slate-300'
                      }`}>
                        {tab.count}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* TAB 1: PERSONAL & BIO */}
          {/* ========================================================================= */}
          {activeTab === 'personal' && (
            <div className="space-y-6 animate-fadeIn">
              
              {/* Avatar Dropzone with Auto-Compression */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/90 space-y-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                  Foto de Perfil / Avatar (Compresión Nativa &lt; 200 KB)
                </label>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                  
                  {/* Current Avatar Preview */}
                  <div className="relative group shrink-0">
                    <img
                      src={profileData.personalInfo?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80'}
                      alt="Avatar Preview"
                      className="w-20 h-20 rounded-2xl object-cover border-2 border-indigo-500/40 shadow-md"
                    />
                    {isCompressingAvatar && (
                      <div className="absolute inset-0 bg-slate-950/80 rounded-2xl flex items-center justify-center">
                        <RefreshCw className="w-5 h-5 text-indigo-400 animate-spin" />
                      </div>
                    )}
                  </div>

                  {/* Dropzone Container */}
                  <div
                    onDragOver={(e) => { e.preventDefault(); setAvatarDragOver(true) }}
                    onDragLeave={() => setAvatarDragOver(false)}
                    onDrop={(e) => {
                      e.preventDefault()
                      setAvatarDragOver(false)
                      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                        handleAvatarFileUpload(e.dataTransfer.files[0])
                      }
                    }}
                    onClick={() => avatarInputRef.current?.click()}
                    className={`flex-1 w-full p-4 rounded-xl border-2 border-dashed transition-all text-center cursor-pointer flex flex-col items-center justify-center gap-1 ${
                      avatarDragOver
                        ? 'border-indigo-500 bg-indigo-950/40'
                        : 'border-slate-700/80 hover:border-indigo-500/60 bg-slate-900/50 hover:bg-slate-900'
                    }`}
                  >
                    <input
                      ref={avatarInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleAvatarFileUpload(e.target.files[0])
                        }
                      }}
                    />
                    <Upload className="w-5 h-5 text-indigo-400" />
                    <div className="text-xs font-bold text-slate-200">
                      Arrastra tu foto o haz clic para subir
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Escalado y compresión automática mediante Canvas nativo ({formatBytes(avatarSize)})
                    </div>
                  </div>

                </div>

                {/* Manual Avatar URL Input as fallback */}
                <div className="pt-2">
                  <label className="text-[11px] text-slate-500 font-medium mb-1 block">
                    O ingresa una URL de imagen directa:
                  </label>
                  <input
                    type="url"
                    value={profileData.personalInfo?.avatar || ''}
                    onChange={(e) => updatePersonalInfo('avatar', e.target.value)}
                    placeholder="https://..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700/70 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>

              </div>

              {/* Available for Work Toggle */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
                <div className="space-y-0.5">
                  <label htmlFor="availableForWorkToggle" className="text-xs font-bold text-slate-200 flex items-center gap-1.5 cursor-pointer">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>Badge "Disponible para Trabajar / Consultorías"</span>
                  </label>
                  <p className="text-[11px] text-slate-400">
                    Muestra el indicador de disponibilidad activa en la cabecera del portafolio.
                  </p>
                </div>
                <input
                  id="availableForWorkToggle"
                  type="checkbox"
                  checked={profileData.personalInfo?.availableForWork ?? true}
                  onChange={(e) => updatePersonalInfo('availableForWork', e.target.checked)}
                  className="w-5 h-5 text-indigo-600 rounded bg-slate-800 border-slate-700 focus:ring-indigo-500 cursor-pointer"
                />
              </div>

              {/* Full Name & Title */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Nombre Completo
                  </label>
                  <input
                    type="text"
                    value={profileData.personalInfo?.name || ''}
                    onChange={(e) => updatePersonalInfo('name', e.target.value)}
                    placeholder="Ej. Antonia Morales"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Título / Especialidad
                  </label>
                  <input
                    type="text"
                    value={profileData.personalInfo?.title || ''}
                    onChange={(e) => updatePersonalInfo('title', e.target.value)}
                    placeholder="Ej. Lead Product Designer & UX"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  />
                </div>
              </div>

              {/* Professional Bio */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Biografía Profesional
                </label>
                <textarea
                  rows={4}
                  value={profileData.personalInfo?.bio || ''}
                  onChange={(e) => updatePersonalInfo('bio', e.target.value)}
                  placeholder="Redacta un resumen ejecutivo de tu trayectoria, habilidades clave y logros..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-normal leading-relaxed"
                />
              </div>

              {/* Contact Information & Channels */}
              <div className="space-y-3 pt-2 border-t border-slate-800">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Canales de Contacto & Redes
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      Ubicación
                    </label>
                    <div className="relative">
                      <MapPin className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-500" />
                      <input
                        type="text"
                        value={profileData.personalInfo?.location || ''}
                        onChange={(e) => updatePersonalInfo('location', e.target.value)}
                        placeholder="Santiago, Chile / Remoto"
                        className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      Correo Electrónico
                    </label>
                    <div className="relative">
                      <Mail className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-500" />
                      <input
                        type="email"
                        value={profileData.personalInfo?.email || ''}
                        onChange={(e) => updatePersonalInfo('email', e.target.value)}
                        placeholder="tu.correo@ejemplo.com"
                        className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      Teléfono
                    </label>
                    <div className="relative">
                      <Phone className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-500" />
                      <input
                        type="text"
                        value={profileData.personalInfo?.phone || ''}
                        onChange={(e) => updatePersonalInfo('phone', e.target.value)}
                        placeholder="+56 9 1234 5678"
                        className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      WhatsApp (con código de país)
                    </label>
                    <div className="relative">
                      <MessageSquare className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-500" />
                      <input
                        type="text"
                        value={profileData.personalInfo?.whatsapp || ''}
                        onChange={(e) => updatePersonalInfo('whatsapp', e.target.value)}
                        placeholder="+56912345678"
                        className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      LinkedIn URL
                    </label>
                    <div className="relative">
                      <Linkedin className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-500" />
                      <input
                        type="url"
                        value={profileData.personalInfo?.linkedin || ''}
                        onChange={(e) => updatePersonalInfo('linkedin', e.target.value)}
                        placeholder="https://linkedin.com/in/usuario"
                        className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      GitHub URL
                    </label>
                    <div className="relative">
                      <Github className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-500" />
                      <input
                        type="url"
                        value={profileData.personalInfo?.github || ''}
                        onChange={(e) => updatePersonalInfo('github', e.target.value)}
                        placeholder="https://github.com/usuario"
                        className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                </div>


              </div>

            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: TEMA & ESTILO */}
          {/* ========================================================================= */}
          {activeTab === 'theme' && (
            <div className="space-y-5 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">Selector de Tema Polimórfico</h3>
                  <p className="text-xs text-slate-400">
                    Cambia la arquitectura visual completa con un solo clic.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3.5">
                {THEME_OPTIONS.map((theme) => {
                  const isSelected = profileData.theme === theme.id
                  return (
                    <div
                      key={theme.id}
                      onClick={() => setProfileData((prev) => ({ ...prev, theme: theme.id }))}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                        isSelected
                          ? 'border-indigo-500 bg-indigo-950/30 ring-2 ring-indigo-500/30'
                          : 'border-slate-800 hover:border-slate-700 bg-slate-950/60'
                      }`}
                    >
                      <div className="flex items-center gap-3.5">
                        {/* Theme Swatch Pill */}
                        <div
                          className="w-12 h-12 rounded-xl border flex items-center justify-center shadow-inner shrink-0"
                          style={{ backgroundColor: theme.bgColor, borderColor: theme.accentColor }}
                        >
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: theme.accentColor }}
                          />
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-white">{theme.name}</span>
                            <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                              {theme.tag}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">{theme.desc}</p>
                          <span className="text-[10px] text-slate-500 font-semibold">{theme.category}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {isSelected ? (
                          <span className="px-3 py-1 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" />
                            <span>Activo</span>
                          </span>
                        ) : (
                          <button
                            type="button"
                            className="px-3 py-1 rounded-full bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold"
                          >
                            Seleccionar
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: EXPERIENCIA LABORAL */}
          {/* ========================================================================= */}
          {activeTab === 'experience' && (
            <div className="space-y-5 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">Historial de Experiencia</h3>
                  <p className="text-xs text-slate-400">
                    Agrega, edita y organiza tus roles profesionales y logros clave.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddExperience}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Agregar Experiencia</span>
                </button>
              </div>

              {(!profileData.experience || profileData.experience.length === 0) ? (
                <div className="p-8 text-center rounded-2xl bg-slate-950 border border-slate-800 text-slate-400 text-xs">
                  No hay registros de experiencia. Haz clic en "+ Agregar Experiencia" para comenzar.
                </div>
              ) : (
                <div className="space-y-4">
                  {profileData.experience.map((exp, idx) => (
                    <div key={exp.id || idx} className="p-4 sm:p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3.5">
                      <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
                        <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                          Puesto #{idx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDeleteExperience(exp.id)}
                          className="text-rose-400 hover:text-rose-300 p-1 rounded-lg hover:bg-rose-950/50 transition-colors cursor-pointer"
                          title="Eliminar este puesto"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                            Rol / Cargo
                          </label>
                          <input
                            type="text"
                            value={exp.role || ''}
                            onChange={(e) => handleUpdateExperience(exp.id, 'role', e.target.value)}
                            placeholder="Ej. Senior Software Architect"
                            className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700/70 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                            Empresa / Organización
                          </label>
                          <input
                            type="text"
                            value={exp.company || ''}
                            onChange={(e) => handleUpdateExperience(exp.id, 'company', e.target.value)}
                            placeholder="Ej. Mercado Libre"
                            className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700/70 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                            Fecha Inicio (YYYY-MM)
                          </label>
                          <input
                            type="text"
                            value={exp.startDate || ''}
                            onChange={(e) => handleUpdateExperience(exp.id, 'startDate', e.target.value)}
                            placeholder="2021-03"
                            className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700/70 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                            Fecha Fin (o deja vacío si es actual)
                          </label>
                          <input
                            type="text"
                            disabled={exp.current}
                            value={exp.current ? 'Presente' : (exp.endDate || '')}
                            onChange={(e) => handleUpdateExperience(exp.id, 'endDate', e.target.value)}
                            placeholder="2023-12"
                            className={`w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700/70 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono ${
                              exp.current ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          id={`currentWork-${exp.id}`}
                          type="checkbox"
                          checked={exp.current || false}
                          onChange={(e) => {
                            handleUpdateExperience(exp.id, 'current', e.target.checked)
                            if (e.target.checked) handleUpdateExperience(exp.id, 'endDate', null)
                          }}
                          className="w-4 h-4 text-indigo-600 rounded bg-slate-800 border-slate-700 focus:ring-indigo-500 cursor-pointer"
                        />
                        <label htmlFor={`currentWork-${exp.id}`} className="text-xs font-semibold text-slate-300 cursor-pointer select-none">
                          Trabajo actual / En curso
                        </label>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                          Descripción de Funciones
                        </label>
                        <textarea
                          rows={2}
                          value={exp.description || ''}
                          onChange={(e) => handleUpdateExperience(exp.id, 'description', e.target.value)}
                          placeholder="Liderazgo de equipo, diseño de arquitectura..."
                          className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700/70 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>

                      {/* Achievements Sub-List */}
                      <div className="space-y-2 pt-2 border-t border-slate-800/80">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                            Logros & Hitos
                          </label>
                          <button
                            type="button"
                            onClick={() => handleAddAchievement(exp.id)}
                            className="text-[11px] text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                            <span>+ Agregar logro</span>
                          </button>
                        </div>

                        {exp.achievements?.map((ach, achIdx) => (
                          <div key={achIdx} className="flex items-center gap-2">
                            <input
                              type="text"
                              value={ach}
                              onChange={(e) => handleUpdateAchievement(exp.id, achIdx, e.target.value)}
                              placeholder="Ej. Reducción de costos de infraestructura en un 40%..."
                              className="flex-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700/70 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                            <button
                              type="button"
                              onClick={() => handleDeleteAchievement(exp.id, achIdx)}
                              className="text-slate-500 hover:text-rose-400 p-1"
                              title="Eliminar logro"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>

                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 4: EDUCACIÓN & TÍTULOS */}
          {/* ========================================================================= */}
          {activeTab === 'education' && (
            <div className="space-y-5 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">Educación & Certificaciones</h3>
                  <p className="text-xs text-slate-400">
                    Grados académicos, másters y certificaciones profesionales.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddEducation}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Agregar Educación</span>
                </button>
              </div>

              {(!profileData.education || profileData.education.length === 0) ? (
                <div className="p-8 text-center rounded-2xl bg-slate-950 border border-slate-800 text-slate-400 text-xs">
                  No hay registros de educación. Haz clic en "+ Agregar Educación".
                </div>
              ) : (
                <div className="space-y-3.5">
                  {profileData.education.map((edu, idx) => (
                    <div key={edu.id || idx} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                        <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                          Título #{idx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDeleteEducation(edu.id)}
                          className="text-rose-400 hover:text-rose-300 p-1 rounded-lg hover:bg-rose-950/50 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                            Grado / Título
                          </label>
                          <input
                            type="text"
                            value={edu.degree || ''}
                            onChange={(e) => handleUpdateEducation(edu.id, 'degree', e.target.value)}
                            placeholder="Ej. Master of Laws (LL.M.)"
                            className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700/70 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                            Institución Educativa
                          </label>
                          <input
                            type="text"
                            value={edu.institution || ''}
                            onChange={(e) => handleUpdateEducation(edu.id, 'institution', e.target.value)}
                            placeholder="Ej. New York University (NYU)"
                            className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700/70 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                            Año / Periodo
                          </label>
                          <input
                            type="text"
                            value={edu.year || ''}
                            onChange={(e) => handleUpdateEducation(edu.id, 'year', e.target.value)}
                            placeholder="Ej. 2018 o 2014 - 2018"
                            className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700/70 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                            Detalles / Honores Académicos
                          </label>
                          <input
                            type="text"
                            value={edu.details || ''}
                            onChange={(e) => handleUpdateEducation(edu.id, 'details', e.target.value)}
                            placeholder="Graduado con Distinción Máxima..."
                            className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700/70 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                      </div>

                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 5: HABILIDADES & STACK */}
          {/* ========================================================================= */}
          {activeTab === 'skills' && (
            <div className="space-y-5 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">Stack & Habilidades Técnicas</h3>
                  <p className="text-xs text-slate-400">
                    Define tus competencias con nivel porcentual (1-100%) y categoría.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddSkill}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Agregar Habilidad</span>
                </button>
              </div>

              {(!profileData.skills || profileData.skills.length === 0) ? (
                <div className="p-8 text-center rounded-2xl bg-slate-950 border border-slate-800 text-slate-400 text-xs">
                  No hay habilidades agregadas. Haz clic en "+ Agregar Habilidad".
                </div>
              ) : (
                <div className="space-y-3">
                  {profileData.skills.map((skill, idx) => (
                    <div key={skill.id || idx} className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center gap-3">
                      
                      <div className="flex-1 w-full sm:w-auto">
                        <label className="block text-[10px] font-semibold text-slate-400 mb-0.5">
                          Habilidad / Tecnología
                        </label>
                        <input
                          type="text"
                          value={skill.name || ''}
                          onChange={(e) => handleUpdateSkill(skill.id, 'name', e.target.value)}
                          placeholder="Ej. React 19 / Go / M&A"
                          className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700/70 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                        />
                      </div>

                      <div className="w-full sm:w-36">
                        <label className="block text-[10px] font-semibold text-slate-400 mb-0.5">
                          Categoría
                        </label>
                        <input
                          type="text"
                          value={skill.category || ''}
                          onChange={(e) => handleUpdateSkill(skill.id, 'category', e.target.value)}
                          placeholder="Ej. Frontend"
                          className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700/70 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>

                      <div className="w-full sm:w-36 flex flex-col justify-center">
                        <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                          <span>Nivel</span>
                          <span className="font-mono font-bold text-indigo-400">{skill.level}%</span>
                        </div>
                        <input
                          type="range"
                          min={1}
                          max={100}
                          value={skill.level || 80}
                          onChange={(e) => handleUpdateSkill(skill.id, 'level', Number(e.target.value))}
                          className="w-full accent-indigo-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteSkill(skill.id)}
                        className="text-rose-400 hover:text-rose-300 p-2 rounded-lg hover:bg-rose-950/50 transition-colors self-end sm:self-center cursor-pointer"
                        title="Eliminar habilidad"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 6: PROYECTOS & PORTAFOLIO */}
          {/* ========================================================================= */}
          {activeTab === 'projects' && (
            <div className="space-y-5 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">Proyectos & Casos de Estudio</h3>
                  <p className="text-xs text-slate-400">
                    Muestra tus mejores trabajos con imágenes optimizadas y enlaces en vivo.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddProject}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Agregar Proyecto</span>
                </button>
              </div>

              {(!profileData.projects || profileData.projects.length === 0) ? (
                <div className="p-8 text-center rounded-2xl bg-slate-950 border border-slate-800 text-slate-400 text-xs">
                  No hay proyectos registrados. Haz clic en "+ Agregar Proyecto".
                </div>
              ) : (
                <div className="space-y-4">
                  {profileData.projects.map((proj, idx) => (
                    <div key={proj.id || idx} className="p-4 sm:p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3.5">
                      <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                        <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                          Proyecto #{idx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDeleteProject(proj.id)}
                          className="text-rose-400 hover:text-rose-300 p-1 rounded-lg hover:bg-rose-950/50 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Image Upload & Preview */}
                      <div className="flex flex-col sm:flex-row items-center gap-3.5 p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                        {proj.image && (
                          <div className="relative group shrink-0">
                            <img
                              src={proj.image}
                              alt={proj.title}
                              className="w-24 h-16 rounded-xl object-cover border border-slate-700"
                            />
                            {compressingProjectIdx === proj.id && (
                              <div className="absolute inset-0 bg-slate-950/80 rounded-xl flex items-center justify-center">
                                <RefreshCw className="w-4 h-4 text-indigo-400 animate-spin" />
                              </div>
                            )}
                          </div>
                        )}

                        <div className="flex-1 w-full space-y-1.5">
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            Foto de Portafolio (Compresión Automática)
                          </label>
                          <div className="flex items-center gap-2">
                            <label className="px-3 py-1.5 rounded-lg bg-indigo-600/80 hover:bg-indigo-600 text-white text-[11px] font-semibold cursor-pointer flex items-center gap-1.5 transition-colors">
                              <Upload className="w-3.5 h-3.5" />
                              <span>Subir Imagen</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  if (e.target.files && e.target.files[0]) {
                                    handleProjectImageUpload(proj.id, e.target.files[0])
                                  }
                                }}
                              />
                            </label>
                            <input
                              type="url"
                              value={proj.image || ''}
                              onChange={(e) => handleUpdateProject(proj.id, 'image', e.target.value)}
                              placeholder="O pega URL de imagen..."
                              className="flex-1 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700/70 text-xs text-slate-200 focus:outline-none"
                            />
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                          Título del Proyecto
                        </label>
                        <input
                          type="text"
                          value={proj.title || ''}
                          onChange={(e) => handleUpdateProject(proj.id, 'title', e.target.value)}
                          placeholder="Ej. Aurora Design System"
                          className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700/70 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                          Descripción
                        </label>
                        <textarea
                          rows={2}
                          value={proj.description || ''}
                          onChange={(e) => handleUpdateProject(proj.id, 'description', e.target.value)}
                          placeholder="Breve reseña del proyecto..."
                          className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700/70 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                          Etiquetas / Tags (separados por coma)
                        </label>
                        <input
                          type="text"
                          value={(proj.tags || []).join(', ')}
                          onChange={(e) => {
                            const tagsArray = e.target.value.split(',').map((t) => t.trim()).filter(Boolean)
                            handleUpdateProject(proj.id, 'tags', tagsArray)
                          }}
                          placeholder="React, Tailwind, AWS, Figma"
                          className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700/70 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                            URL en Vivo / Demo
                          </label>
                          <input
                            type="url"
                            value={proj.liveUrl || ''}
                            onChange={(e) => handleUpdateProject(proj.id, 'liveUrl', e.target.value)}
                            placeholder="https://..."
                            className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700/70 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                            URL de Repositorio / Código
                          </label>
                          <input
                            type="url"
                            value={proj.repoUrl || ''}
                            onChange={(e) => handleUpdateProject(proj.id, 'repoUrl', e.target.value)}
                            placeholder="https://github.com/..."
                            className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700/70 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                      </div>

                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 7: IDIOMAS */}
          {/* ========================================================================= */}
          {activeTab === 'languages' && (
            <div className="space-y-5 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">Idiomas & Dominio</h3>
                  <p className="text-xs text-slate-400">
                    Idiomas que manejas y nivel de suficiencia comunicativa.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddLanguage}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Agregar Idioma</span>
                </button>
              </div>

              {(!profileData.languages || profileData.languages.length === 0) ? (
                <div className="p-8 text-center rounded-2xl bg-slate-950 border border-slate-800 text-slate-400 text-xs">
                  No hay idiomas registrados. Haz clic en "+ Agregar Idioma".
                </div>
              ) : (
                <div className="space-y-3">
                  {profileData.languages.map((lang, idx) => (
                    <div key={lang.id || idx} className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center gap-3">
                      <div className="flex-1">
                        <label className="block text-[10px] font-semibold text-slate-400 mb-0.5">
                          Idioma
                        </label>
                        <input
                          type="text"
                          value={lang.name || ''}
                          onChange={(e) => handleUpdateLanguage(lang.id, 'name', e.target.value)}
                          placeholder="Ej. Español / Inglés"
                          className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700/70 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                        />
                      </div>

                      <div className="flex-1">
                        <label className="block text-[10px] font-semibold text-slate-400 mb-0.5">
                          Nivel de Dominio
                        </label>
                        <input
                          type="text"
                          value={lang.level || ''}
                          onChange={(e) => handleUpdateLanguage(lang.id, 'level', e.target.value)}
                          placeholder="Nativo / Bilingüe (C2) / Avanzado (C1)"
                          className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700/70 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteLanguage(lang.id)}
                        className="text-rose-400 hover:text-rose-300 p-2 rounded-lg hover:bg-rose-950/50 transition-colors self-end cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 8: BOTÓN FLOTANTE */}
          {/* ========================================================================= */}
          {activeTab === 'floatingButton' && (
            <div className="space-y-5 animate-fadeIn">
              <div>
                <h3 className="text-sm font-bold text-white">Botón de Contacto Flotante</h3>
                <p className="text-xs text-slate-400">
                  Gatillo de alta conversión fijo en la esquina inferior del portafolio.
                </p>
              </div>

              {/* Activation Switch */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-950 border border-slate-800">
                <div>
                  <div className="text-xs font-bold text-slate-200">
                    Activar Botón Flotante
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Permite a los visitantes contactarte directamente con 1 solo clic.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={profileData.floatingButton?.enabled ?? true}
                  onChange={(e) => updateFloatingButton('enabled', e.target.checked)}
                  className="w-5 h-5 text-indigo-600 rounded bg-slate-800 border-slate-700 focus:ring-indigo-500 cursor-pointer"
                />
              </div>

              {/* Channel Selector */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                  Tipo de Acción / Canal
                </label>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {[
                    { id: 'whatsapp', label: 'WhatsApp', color: '#25D366', icon: MessageSquare },
                    { id: 'linkedin', label: 'LinkedIn', color: '#0A66C2', icon: Linkedin },
                    { id: 'email', label: 'Email', color: '#6366F1', icon: Mail },
                    { id: 'phone', label: 'Teléfono', color: '#0F172A', icon: Phone }
                  ].map((btnType) => {
                    const isSelected = (profileData.floatingButton?.type || 'whatsapp') === btnType.id
                    const IconComp = btnType.icon
                    return (
                      <button
                        key={btnType.id}
                        type="button"
                        onClick={() => updateFloatingButton('type', btnType.id)}
                        className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-1.5 cursor-pointer ${
                          isSelected
                            ? 'border-indigo-500 bg-indigo-950/40 ring-2 ring-indigo-500/20 text-white'
                            : 'border-slate-800 bg-slate-950 hover:border-slate-700 text-slate-400'
                        }`}
                      >
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
                          style={{ backgroundColor: btnType.color }}
                        >
                          <IconComp className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-bold">{btnType.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Custom Message Template */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Mensaje Predeterminado al Abrir
                </label>
                <textarea
                  rows={3}
                  value={profileData.floatingButton?.customMessage || ''}
                  onChange={(e) => updateFloatingButton('customMessage', e.target.value)}
                  placeholder="Hola, vi tu portafolio en Mi Vitae y me gustaría conversar sobre una oportunidad..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Este texto se precargará automáticamente cuando un reclutador o cliente haga clic en el botón.
                </p>
              </div>

            </div>
          )}


          {/* Bottom Save Trigger inside Editor */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
            <span className="text-[11px] text-slate-500">
              * Cambios visibles en tiempo real a la derecha.
            </span>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Guardar en Almacenamiento Local</span>
            </button>
          </div>

        </section>

        {/* ========================================================================= */}
        {/* RIGHT COLUMN: LIVE ANALYTICS & PORTFOLIO CONTROL CENTER (Span 5) */}
        {/* ========================================================================= */}
        <section aria-label="Control Center y Métricas" className="lg:col-span-5 xl:col-span-5 sticky top-20 flex flex-col gap-5">
          
          {/* Quick Portfolio Action Card */}
          <div className="bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
            
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-400">
                  Portafolio en Línea
                </span>
              </div>
              <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-indigo-950/80 border border-indigo-500/30 text-indigo-300 capitalize">
                Tema: {profileData.theme}
              </span>
            </div>

            {/* User Overview */}
            <div className="flex items-center gap-4 mb-5">
              <img
                src={profileData.personalInfo?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80'}
                alt={profileData.personalInfo?.name}
                className="w-16 h-16 rounded-2xl object-cover border-2 border-indigo-500/40 shadow-md shrink-0"
              />
              <div className="min-w-0">
                <h3 className="font-extrabold text-base sm:text-lg text-white truncate">
                  {profileData.personalInfo?.name || 'Tu Nombre'}
                </h3>
                <p className="text-xs text-indigo-300 font-medium truncate">
                  {profileData.personalInfo?.title || 'Tu Cargo Profesional'}
                </p>
                <div className="text-[11px] text-slate-400 font-mono mt-1">
                  @{profileData.username}
                </div>
              </div>
            </div>

            {/* Custom Link Box */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3 flex items-center justify-between gap-2 mb-4">
              <div className="flex items-center gap-2 min-w-0 text-xs font-mono text-slate-300">
                <Globe className="w-4 h-4 text-indigo-400 shrink-0" />
                <span className="truncate">mi-vitae.wearesamod.com/<strong className="text-white">{profileData.username}</strong></span>
              </div>
              <button
                type="button"
                onClick={handleCopyLink}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-indigo-600 text-slate-200 hover:text-white text-xs font-bold transition-colors shrink-0 flex items-center gap-1 cursor-pointer"
                title="Copiar enlace directo"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Copiado' : 'Copiar'}</span>
              </button>
            </div>

            {/* Action Buttons Grid */}
            <div className="grid grid-cols-2 gap-2.5">
              <Link
                to={`/${profileData.username}`}
                target="_blank"
                className="px-4 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <Eye className="w-4 h-4" />
                <span>Ver en Vivo ↗</span>
              </Link>

              <button
                type="button"
                onClick={() => setIsQrOpen(true)}
                className="px-4 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <QrCode className="w-4 h-4 text-cyan-400" />
                <span>Código QR</span>
              </button>
            </div>

          </div>

          {/* Real-time Analytics Dashboard Cards */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
            
            <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emerald-400" />
                <h4 className="text-xs font-extrabold text-white uppercase tracking-wider">
                  Métricas de Rendimiento
                </h4>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-500/30">
                Tiempo Real
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              
              {/* Metric 1: Views */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-medium text-slate-400">Visitas Totales</span>
                  <Eye className="w-4 h-4 text-indigo-400" />
                </div>
                <div className="text-2xl font-black text-white">
                  {(profileData.analytics?.views || 1240).toLocaleString('es-CL')}
                </div>
                <div className="text-[10px] text-emerald-400 font-semibold mt-1 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  <span>+18% esta semana</span>
                </div>
              </div>

              {/* Metric 2: WhatsApp Clicks */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-medium text-slate-400">Clics WhatsApp</span>
                  <MessageCircle className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-2xl font-black text-white">
                  {(profileData.analytics?.contactClicks || 380).toLocaleString('es-CL')}
                </div>
                <div className="text-[10px] text-emerald-400 font-semibold mt-1 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  <span>Contacto directo</span>
                </div>
              </div>

              {/* Metric 3: QR Scans */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-medium text-slate-400">Escaneos QR</span>
                  <QrCode className="w-4 h-4 text-cyan-400" />
                </div>
                <div className="text-2xl font-black text-white">
                  {(profileData.analytics?.cvDownloads || 195).toLocaleString('es-CL')}
                </div>
                <div className="text-[10px] text-cyan-400 font-semibold mt-1">
                  Tarjetas & networking
                </div>
              </div>

              {/* Metric 4: Conversion Rate */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-medium text-slate-400">Tasa de Conversión</span>
                  <Sparkles className="w-4 h-4 text-purple-400" />
                </div>
                <div className="text-2xl font-black text-purple-300">
                  {(((profileData.analytics?.contactClicks || 380) / Math.max(profileData.analytics?.views || 1240, 1)) * 100).toFixed(1)}%
                </div>
                <div className="text-[10px] text-purple-400 font-semibold mt-1">
                  x15 vs CV en PDF
                </div>
              </div>

            </div>

            {/* Profile Content Summary */}
            <div className="pt-2 border-t border-slate-800 text-xs text-slate-400 space-y-2">
              <div className="flex items-center justify-between">
                <span>Experiencias registradas:</span>
                <strong className="text-white">{profileData.experience?.length || 0}</strong>
              </div>
              <div className="flex items-center justify-between">
                <span>Proyectos destacados:</span>
                <strong className="text-white">{profileData.projects?.length || 0}</strong>
              </div>
              <div className="flex items-center justify-between">
                <span>Competencias / Stack:</span>
                <strong className="text-white">{profileData.skills?.length || 0}</strong>
              </div>
            </div>

          </div>

          {/* Plan & Subscription Card */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-4 sm:p-5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white font-bold shadow">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-extrabold text-white">1er Mes Gratis Activo</div>
                <div className="text-[11px] text-slate-400">Suscripción $3.490 CLP/mes</div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => openFlowModal({ username: profileData.username, planName: 'Suscripción Mi Vitae ($3.490 CLP/mes)', amount: 3490 })}
              className="px-3 py-1.5 rounded-xl bg-[#0F265C] hover:bg-[#163884] text-white text-xs font-bold transition-colors cursor-pointer border border-cyan-500/30 shrink-0"
            >
              Pagar Flow.cl
            </button>
          </div>

        </section>

      </main>

      {/* QR Code Generator Modal */}
      <QrModal
        isOpen={isQrOpen}
        onClose={() => setIsQrOpen(false)}
        profile={profileData}
        username={profileData?.username}
        theme={profileData?.theme}
      />

    </div>
  )
}
