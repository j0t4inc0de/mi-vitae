import React, { useState, useEffect, useRef } from 'react'
import { Link } from '../router/Router'
import { useProfileStore } from '../stores/profileStore'
import { saveProfileToSupabase, fetchProfileFromSupabase, getCurrentUser } from '../lib/supabaseClient'
import QrModal from '../components/Common/QrModal'
import ThemeRenderer from '../components/Themes/ThemeRenderer'
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
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Maximize2
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
  const dashboardSaveTrigger = useProfileStore((state) => state.dashboardSaveTrigger)
  const dashboardResetTrigger = useProfileStore((state) => state.dashboardResetTrigger)
  const setIsDashboardSaving = useProfileStore((state) => state.setIsDashboardSaving)

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

  // Collapsible Accordion States for items
  const [collapsedExp, setCollapsedExp] = useState({})
  const [collapsedEdu, setCollapsedEdu] = useState({})
  const [collapsedProj, setCollapsedProj] = useState({})

  const avatarInputRef = useRef(null)
  const tabsContainerRef = useRef(null)

  const getLiveProfileUrl = () => {
    if (typeof window !== 'undefined' && window.location?.origin && !window.location.origin.includes('localhost') && !window.location.origin.includes('127.0.0.1')) {
      return `${window.location.origin}/${profileData.username}`
    }
    return `/${profileData.username}`
  }

  const handleCopyLink = () => {
    const fullUrl = typeof window !== 'undefined' && window.location?.origin && !window.location.origin.includes('localhost')
      ? `${window.location.origin}/${profileData.username}`
      : `https://${window.location.host || 'mivitae.wearesamod.com'}/${profileData.username}`
    navigator.clipboard.writeText(fullUrl)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2500)
  }

  const scrollTabs = (direction) => {
    if (tabsContainerRef.current) {
      const scrollAmount = direction === 'left' ? -220 : 220
      tabsContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' })
    }
  }

  // Calculate plan expiration date and days remaining
  const calculatePlanStatus = () => {
    const isPremium = storeProfile?.plan === 'premium' || profileData?.plan === 'premium'
    const planStatus = profileData?.planStatus || storeProfile?.planStatus || 'active'
    
    // Resolve expiration timestamp
    let expirationDate = null
    if (profileData?.planExpiresAt || storeProfile?.planExpiresAt) {
      expirationDate = new Date(profileData?.planExpiresAt || storeProfile?.planExpiresAt)
    } else if (profileData?.trialActivatedAt || storeProfile?.trialActivatedAt) {
      const activated = new Date(profileData?.trialActivatedAt || storeProfile?.trialActivatedAt)
      expirationDate = new Date(activated.getTime() + 30 * 24 * 60 * 60 * 1000)
    } else {
      // Default 30 days trial from current local time
      const now = new Date()
      expirationDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    }

    const now = new Date()
    const diffMs = expirationDate.getTime() - now.getTime()
    const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
    const isExpired = daysRemaining <= 0 || planStatus === 'expired'

    const formattedDate = expirationDate.toLocaleDateString('es-CL', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })

    return {
      isPremium,
      isExpired,
      daysRemaining: Math.max(0, daysRemaining),
      formattedDate,
      planStatus
    }
  }

  const planInfo = calculatePlanStatus()

  // Detect authenticated Supabase user and sync
  useEffect(() => {
    let isMounted = true
    getCurrentUser().then((user) => {
      if (user && isMounted) {
        setAuthUser(user)
        const authUsername = user.user_metadata?.username
        if (authUsername && !sessionStorage.getItem('manual_archetype_selected')) {
          setActiveUsername(authUsername)
          fetchProfileFromSupabase(authUsername).then((remote) => {
            if (remote && isMounted) {
              setProfileData(getInitialProfileState(remote))
            }
          }).catch(() => {})
        }
      }
    }).catch(() => {})
    return () => { isMounted = false }
  }, [])

  // Sync local state and hydrate from Supabase Cloud if available
  useEffect(() => {
    let isMounted = true
    if (activeUsername) {
      fetchProfileFromSupabase(activeUsername).then((remote) => {
        if (remote && isMounted) {
          setProfileData(getInitialProfileState(remote))
        } else if (storeProfile && isMounted) {
          setProfileData(getInitialProfileState(storeProfile))
        }
      }).catch(() => {
        if (storeProfile && isMounted) {
          setProfileData(getInitialProfileState(storeProfile))
        }
      })
    } else if (storeProfile && isMounted) {
      setProfileData(getInitialProfileState(storeProfile))
    }
    return () => { isMounted = false }
  }, [activeUsername])

  if (!profileData) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 bg-[#f8fafc] text-slate-900">
        <div className="text-center space-y-4">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-palette-primary" />
          <p className="text-slate-600 font-medium">Cargando Live Studio...</p>
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
    setIsDashboardSaving(true)
    // 1. Guardar en store local para reactividad inmediata
    updateProfile(profileData.username, profileData)

    // 2. Guardar en la base de datos Supabase para que esté visible en todo el mundo
    try {
      const saved = await saveProfileToSupabase(profileData)
      if (!saved) {
        const user = await getCurrentUser()
        if (!user) {
          console.warn('[Dashboard] Perfil no guardado en la nube: usuario no autenticado en Supabase.')
        }
      }
    } catch (err) {
      console.warn('[Dashboard] Error al sincronizar perfil con Supabase:', err)
    } finally {
      setIsSaving(false)
      setIsDashboardSaving(false)
    }

    setSavedAlert(true)
    setTimeout(() => setSavedAlert(false), 3500)
  }

  // Listen to Navbar Save Trigger
  const lastSaveTriggerRef = useRef(dashboardSaveTrigger)
  useEffect(() => {
    if (dashboardSaveTrigger > 0 && dashboardSaveTrigger !== lastSaveTriggerRef.current) {
      lastSaveTriggerRef.current = dashboardSaveTrigger
      handleSave()
    }
  }, [dashboardSaveTrigger])

  // Listen to Navbar Reset Trigger
  const lastResetTriggerRef = useRef(dashboardResetTrigger)
  useEffect(() => {
    if (dashboardResetTrigger > 0 && dashboardResetTrigger !== lastResetTriggerRef.current) {
      lastResetTriggerRef.current = dashboardResetTrigger
      handleResetDefaults()
    }
  }, [dashboardResetTrigger])

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
    const newId = `exp-${Date.now()}`
    const newExp = {
      id: newId,
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
    setCollapsedExp((prev) => ({ ...prev, [newId]: false }))
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
    const newId = `edu-${Date.now()}`
    const newEdu = {
      id: newId,
      degree: 'Título o Grado Académico',
      institution: 'Universidad o Instituto',
      year: new Date().getFullYear().toString(),
      details: 'Mención de honor, proyectos de investigación o especialidad...'
    }
    setProfileData((prev) => ({
      ...prev,
      education: [newEdu, ...(prev.education || [])]
    }))
    setCollapsedEdu((prev) => ({ ...prev, [newId]: false }))
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
    const newId = `proj-${Date.now()}`
    const newProj = {
      id: newId,
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
    setCollapsedProj((prev) => ({ ...prev, [newId]: false }))
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
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col antialiased pb-24 md:pb-10">

      {/* Notification Toast */}
      {savedAlert && (
        <div className="fixed top-20 right-4 sm:right-6 left-4 sm:left-auto z-50 p-4 rounded-2xl bg-emerald-50/95 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center justify-between gap-3 shadow-xl backdrop-blur-xl animate-fade-in">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <div className="text-emerald-950 font-extrabold text-sm">¡Portafolio Actualizado!</div>
              <div className="text-emerald-700 font-normal text-[11px]">
                Cambios sincronizados en Supabase Cloud y vista @{profileData.username}.
              </div>
            </div>
          </div>
          <button 
            type="button"
            onClick={() => setSavedAlert(false)} 
            className="text-emerald-600 hover:text-emerald-950 p-2 min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
            aria-label="Cerrar notificación"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Split-Screen Workspace */}
      <main className="flex-1 max-w-[1720px] w-full mx-auto p-3 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ========================================================================= */}
        {/* LEFT COLUMN: MODULAR ACCORDION / TABBED EDITOR (Span 7) */}
        {/* ========================================================================= */}
        <section 
          aria-label="Editor Modular" 
          className="lg:col-span-7 xl:col-span-7 bg-white border border-slate-200/90 rounded-3xl p-4 sm:p-6 shadow-sm flex flex-col gap-6"
        >

          {/* Editor Header & Tab Switcher */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span>Editor de Contenido</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Edita cada sección modularmente con actualización inmediata en el Live Preview.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsQrOpen(true)}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Código QR del Portafolio"
                >
                  <QrCode className="w-3.5 h-3.5 text-palette-primary" />
                  <span className="hidden sm:inline">Código QR</span>
                </button>
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-palette-primary/10 border border-palette-primary/20 text-palette-primary capitalize">
                  {profileData.theme}
                </span>
              </div>
            </div>

            {/* Scrollable Horizontal Tabs with Snap and Hidden Scrollbars */}
            <div className="relative flex items-center group/tabs">
              {/* Left Scroll Arrow (Desktop/PC) */}
              <button
                type="button"
                onClick={() => scrollTabs('left')}
                className="hidden md:flex p-1.5 rounded-lg bg-white/95 hover:bg-white text-slate-600 hover:text-slate-900 border border-slate-200 shadow-sm absolute left-0 z-10 -translate-x-2 opacity-0 group-hover/tabs:opacity-100 transition-opacity cursor-pointer"
                title="Desplazar a la izquierda"
                aria-label="Desplazar pestañas a la izquierda"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div 
                ref={tabsContainerRef}
                onWheel={(e) => {
                  if (tabsContainerRef.current && Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
                    e.preventDefault()
                    tabsContainerRef.current.scrollLeft += e.deltaY
                  }
                }}
                className="w-full flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-slate-200 scroll-smooth snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              >
                {tabs.map((tab) => {
                  const IconComponent = tab.icon
                  const isActive = activeTab === tab.id
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={`px-3.5 py-2.5 min-h-[44px] rounded-xl text-xs whitespace-nowrap transition-all flex items-center gap-2 shrink-0 cursor-pointer snap-start ${
                        isActive
                          ? 'bg-palette-primary/10 border-2 border-palette-primary text-palette-primary font-bold shadow-sm'
                          : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 border border-slate-200/80 font-medium'
                      }`}
                    >
                      <IconComponent className={`w-4 h-4 shrink-0 ${isActive ? 'text-palette-primary' : 'text-slate-400'}`} />
                      <span>{tab.label}</span>
                      {tab.count !== null && (
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                          isActive ? 'bg-palette-primary text-white shadow-sm' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {tab.count}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>

              {/* Right Scroll Arrow (Desktop/PC) */}
              <button
                type="button"
                onClick={() => scrollTabs('right')}
                className="hidden md:flex p-1.5 rounded-lg bg-white/95 hover:bg-white text-slate-600 hover:text-slate-900 border border-slate-200 shadow-sm absolute right-0 z-10 translate-x-2 opacity-0 group-hover/tabs:opacity-100 transition-opacity cursor-pointer"
                title="Desplazar a la derecha"
                aria-label="Desplazar pestañas a la derecha"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* TAB 1: PERSONAL & BIO */}
          {/* ========================================================================= */}
          {activeTab === 'personal' && (
            <div className="space-y-6 animate-fadeIn">
              
              {/* Avatar Dropzone with Auto-Compression */}
              <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200 space-y-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Foto de Perfil / Avatar (Compresión Nativa &lt; 200 KB)
                </label>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                  
                  {/* Current Avatar Preview */}
                  <div className="relative group shrink-0">
                    <img
                      src={profileData.personalInfo?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80'}
                      alt="Avatar Preview"
                      className="w-20 h-20 rounded-2xl object-cover border-2 border-palette-primary/30 shadow-sm"
                    />
                    {isCompressingAvatar && (
                      <div className="absolute inset-0 bg-white/80 rounded-2xl flex items-center justify-center">
                        <RefreshCw className="w-5 h-5 text-palette-primary animate-spin" />
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
                        ? 'border-palette-primary bg-palette-primary/10'
                        : 'border-slate-300 hover:border-palette-primary/60 bg-white hover:bg-slate-50'
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
                    <Upload className="w-5 h-5 text-palette-primary" />
                    <div className="text-xs font-bold text-slate-800">
                      Arrastra tu foto o haz clic para subir
                    </div>
                    <div className="text-[10px] text-slate-500">
                      Escalado y compresión automática mediante Canvas nativo ({formatBytes(avatarSize)})
                    </div>
                  </div>

                </div>

                {/* Manual Avatar URL Input as fallback */}
                <div className="pt-2">
                  <label className="text-[11px] text-slate-600 font-medium mb-1 block">
                    O ingresa una URL de imagen directa:
                  </label>
                  <input
                    type="url"
                    value={profileData.personalInfo?.avatar || ''}
                    onChange={(e) => updatePersonalInfo('avatar', e.target.value)}
                    placeholder="https://..."
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 focus:border-palette-primary text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-palette-primary font-mono transition-colors"
                  />
                </div>

              </div>

              {/* Available for Work Toggle */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50/80 border border-slate-200">
                <div className="space-y-0.5 pr-4">
                  <div className="text-xs font-bold text-slate-800 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
                    <span>Badge "Disponibilidad Inmediata"</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Muestra el indicador de disponibilidad inmediata en la cabecera de tu portafolio.
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={profileData.personalInfo?.availableForWork ?? true}
                  onClick={() => updatePersonalInfo('availableForWork', !(profileData.personalInfo?.availableForWork ?? true))}
                  className={`w-12 h-7 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 ease-in-out shrink-0 ${
                    (profileData.personalInfo?.availableForWork ?? true)
                      ? 'bg-palette-gradient shadow-sm shadow-palette-glow'
                      : 'bg-slate-200 border border-slate-300'
                  }`}
                >
                  <div
                    className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
                      (profileData.personalInfo?.availableForWork ?? true) ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Full Name & Title */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nombre Completo
                  </label>
                  <input
                    type="text"
                    value={profileData.personalInfo?.name || ''}
                    onChange={(e) => updatePersonalInfo('name', e.target.value)}
                    placeholder="Ej. Antonia Morales"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 focus:border-palette-primary text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-palette-primary font-medium transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Título / Especialidad
                  </label>
                  <input
                    type="text"
                    value={profileData.personalInfo?.title || ''}
                    onChange={(e) => updatePersonalInfo('title', e.target.value)}
                    placeholder="Ej. Lead Product Designer & UX"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 focus:border-palette-primary text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-palette-primary font-medium transition-colors"
                  />
                </div>
              </div>

              {/* Professional Bio */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Biografía Profesional
                </label>
                <textarea
                  rows={4}
                  value={profileData.personalInfo?.bio || ''}
                  onChange={(e) => updatePersonalInfo('bio', e.target.value)}
                  placeholder="Redacta un resumen ejecutivo de tu trayectoria, habilidades clave y logros..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 focus:border-palette-primary text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-palette-primary font-normal leading-relaxed transition-colors"
                />
              </div>

              {/* Contact Information & Channels */}
              <div className="space-y-3 pt-2 border-t border-slate-200">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Canales de Contacto & Redes
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Ubicación
                    </label>
                    <div className="relative">
                      <MapPin className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                      <input
                        type="text"
                        value={profileData.personalInfo?.location || ''}
                        onChange={(e) => updatePersonalInfo('location', e.target.value)}
                        placeholder="Santiago, Chile / Remoto"
                        className="w-full pl-9 pr-3 py-2 rounded-xl bg-white border border-slate-300 focus:border-palette-primary text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-palette-primary transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Correo Electrónico
                    </label>
                    <div className="relative">
                      <Mail className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                      <input
                        type="email"
                        value={profileData.personalInfo?.email || ''}
                        onChange={(e) => updatePersonalInfo('email', e.target.value)}
                        placeholder="tu.correo@ejemplo.com"
                        className="w-full pl-9 pr-3 py-2 rounded-xl bg-white border border-slate-300 focus:border-palette-primary text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-palette-primary transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Teléfono
                    </label>
                    <div className="relative">
                      <Phone className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                      <input
                        type="text"
                        value={profileData.personalInfo?.phone || ''}
                        onChange={(e) => updatePersonalInfo('phone', e.target.value)}
                        placeholder="+56 9 1234 5678"
                        className="w-full pl-9 pr-3 py-2 rounded-xl bg-white border border-slate-300 focus:border-palette-primary text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-palette-primary transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      WhatsApp (con código de país)
                    </label>
                    <div className="relative">
                      <MessageSquare className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                      <input
                        type="text"
                        value={profileData.personalInfo?.whatsapp || ''}
                        onChange={(e) => updatePersonalInfo('whatsapp', e.target.value)}
                        placeholder="+56912345678"
                        className="w-full pl-9 pr-3 py-2 rounded-xl bg-white border border-slate-300 focus:border-palette-primary text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-palette-primary transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      LinkedIn URL
                    </label>
                    <div className="relative">
                      <Linkedin className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                      <input
                        type="url"
                        value={profileData.personalInfo?.linkedin || ''}
                        onChange={(e) => updatePersonalInfo('linkedin', e.target.value)}
                        placeholder="https://linkedin.com/in/usuario"
                        className="w-full pl-9 pr-3 py-2 rounded-xl bg-white border border-slate-300 focus:border-palette-primary text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-palette-primary transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      GitHub URL
                    </label>
                    <div className="relative">
                      <Github className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                      <input
                        type="url"
                        value={profileData.personalInfo?.github || ''}
                        onChange={(e) => updatePersonalInfo('github', e.target.value)}
                        placeholder="https://github.com/usuario"
                        className="w-full pl-9 pr-3 py-2 rounded-xl bg-white border border-slate-300 focus:border-palette-primary text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-palette-primary transition-colors"
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
                  <h3 className="text-sm font-bold text-slate-900">Selector de Tema Polimórfico</h3>
                  <p className="text-xs text-slate-500">
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
                      className={`p-4 rounded-2xl transition-all cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                        isSelected
                          ? 'bg-palette-primary/5 border-2 border-palette-primary shadow-sm'
                          : 'bg-white border-2 border-slate-200 hover:border-slate-300'
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
                            <span className="font-bold text-sm text-slate-900">{theme.name}</span>
                            <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                              {theme.tag}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">{theme.desc}</p>
                          <span className="text-[10px] text-slate-500 font-semibold">{theme.category}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {isSelected ? (
                          <span className="px-3 py-1 rounded-full bg-palette-primary hover:bg-palette-hover text-white text-xs font-bold flex items-center gap-1 shadow-sm">
                            <Check className="w-3.5 h-3.5" />
                            <span>Activo</span>
                          </span>
                        ) : (
                          <button
                            type="button"
                            className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 hover:text-slate-900 hover:bg-slate-200 text-xs font-semibold transition-colors"
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
                  <h3 className="text-sm font-bold text-slate-900">Historial de Experiencia</h3>
                  <p className="text-xs text-slate-500">
                    Agrega, edita y organiza tus roles profesionales y logros clave.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddExperience}
                  className="px-3 py-1.5 rounded-xl bg-palette-primary hover:bg-palette-hover text-white text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-palette-glow cursor-pointer transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Agregar Experiencia</span>
                </button>
              </div>

              {(!profileData.experience || profileData.experience.length === 0) ? (
                <div className="p-8 text-center rounded-2xl bg-slate-50/80 border border-slate-200 text-slate-500 text-xs">
                  No hay registros de experiencia. Haz clic en "+ Agregar Experiencia" para comenzar.
                </div>
              ) : (
                <div className="space-y-4">
                  {profileData.experience.map((exp, idx) => (
                    <div key={exp.id || idx} className="p-4 sm:p-5 rounded-2xl bg-slate-50/80 border border-slate-200 space-y-3.5">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                        <span className="text-xs font-bold text-palette-primary uppercase tracking-wider flex items-center gap-1.5">
                          Puesto #{idx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDeleteExperience(exp.id)}
                          className="text-rose-500 hover:text-rose-700 p-1 rounded-lg hover:bg-rose-100/50 transition-colors cursor-pointer"
                          title="Eliminar este puesto"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                            Rol / Cargo
                          </label>
                          <input
                            type="text"
                            value={exp.role || ''}
                            onChange={(e) => handleUpdateExperience(exp.id, 'role', e.target.value)}
                            placeholder="Ej. Senior Software Architect"
                            className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 focus:border-palette-primary text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-palette-primary transition-colors"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                            Empresa / Organización
                          </label>
                          <input
                            type="text"
                            value={exp.company || ''}
                            onChange={(e) => handleUpdateExperience(exp.id, 'company', e.target.value)}
                            placeholder="Ej. Mercado Libre"
                            className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 focus:border-palette-primary text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-palette-primary transition-colors"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                            Fecha Inicio (YYYY-MM)
                          </label>
                          <input
                            type="text"
                            value={exp.startDate || ''}
                            onChange={(e) => handleUpdateExperience(exp.id, 'startDate', e.target.value)}
                            placeholder="2021-03"
                            className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 focus:border-palette-primary text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-palette-primary font-mono transition-colors"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                            Fecha Fin (o deja vacío si es actual)
                          </label>
                          <input
                            type="text"
                            disabled={exp.current}
                            value={exp.current ? 'Presente' : (exp.endDate || '')}
                            onChange={(e) => handleUpdateExperience(exp.id, 'endDate', e.target.value)}
                            placeholder="2023-12"
                            className={`w-full px-3 py-2 rounded-xl bg-white border border-slate-300 focus:border-palette-primary text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-palette-primary font-mono transition-colors ${
                              exp.current ? 'bg-slate-100 text-slate-500 opacity-60 cursor-not-allowed' : ''
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
                          className="w-4 h-4 text-palette-primary rounded bg-white border-slate-300 focus:ring-palette-primary cursor-pointer accent-palette-primary"
                        />
                        <label htmlFor={`currentWork-${exp.id}`} className="text-xs font-semibold text-slate-700 cursor-pointer select-none">
                          Trabajo actual / En curso
                        </label>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Descripción de Funciones
                        </label>
                        <textarea
                          rows={2}
                          value={exp.description || ''}
                          onChange={(e) => handleUpdateExperience(exp.id, 'description', e.target.value)}
                          placeholder="Liderazgo de equipo, diseño de arquitectura..."
                          className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 focus:border-palette-primary text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-palette-primary transition-colors"
                        />
                      </div>

                      {/* Achievements Sub-List */}
                      <div className="space-y-2 pt-2 border-t border-slate-200">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                            Logros & Hitos
                          </label>
                          <button
                            type="button"
                            onClick={() => handleAddAchievement(exp.id)}
                            className="px-2 py-0.5 rounded-lg bg-palette-primary/10 border border-palette-primary/30 text-palette-primary hover:bg-palette-primary/20 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
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
                              className="flex-1 px-3 py-1.5 rounded-lg bg-white border border-slate-300 focus:border-palette-primary text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-palette-primary transition-colors"
                            />
                            <button
                              type="button"
                              onClick={() => handleDeleteAchievement(exp.id, achIdx)}
                              className="text-slate-400 hover:text-rose-600 p-1 transition-colors cursor-pointer"
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
                  <h3 className="text-sm font-bold text-slate-900">Educación & Certificaciones</h3>
                  <p className="text-xs text-slate-500">
                    Grados académicos, másters y certificaciones profesionales.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddEducation}
                  className="px-3 py-1.5 rounded-xl bg-palette-primary hover:bg-palette-hover text-white text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-palette-glow cursor-pointer transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Agregar Educación</span>
                </button>
              </div>

              {(!profileData.education || profileData.education.length === 0) ? (
                <div className="p-8 text-center rounded-2xl bg-slate-50/80 border border-slate-200 text-slate-500 text-xs">
                  No hay registros de educación. Haz clic en "+ Agregar Educación".
                </div>
              ) : (
                <div className="space-y-3.5">
                  {profileData.education.map((edu, idx) => (
                    <div key={edu.id || idx} className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200 space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                        <span className="text-xs font-bold text-palette-primary uppercase tracking-wider flex items-center gap-1.5">
                          Título #{idx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDeleteEducation(edu.id)}
                          className="text-rose-500 hover:text-rose-700 p-1 rounded-lg hover:bg-rose-100/50 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                            Grado / Título
                          </label>
                          <input
                            type="text"
                            value={edu.degree || ''}
                            onChange={(e) => handleUpdateEducation(edu.id, 'degree', e.target.value)}
                            placeholder="Ej. Master of Laws (LL.M.)"
                            className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 focus:border-palette-primary text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-palette-primary font-medium transition-colors"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                            Institución Educativa
                          </label>
                          <input
                            type="text"
                            value={edu.institution || ''}
                            onChange={(e) => handleUpdateEducation(edu.id, 'institution', e.target.value)}
                            placeholder="Ej. New York University (NYU)"
                            className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 focus:border-palette-primary text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-palette-primary transition-colors"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                            Año / Periodo
                          </label>
                          <input
                            type="text"
                            value={edu.year || ''}
                            onChange={(e) => handleUpdateEducation(edu.id, 'year', e.target.value)}
                            placeholder="Ej. 2018 o 2014 - 2018"
                            className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 focus:border-palette-primary text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-palette-primary font-mono transition-colors"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                            Detalles / Honores Académicos
                          </label>
                          <input
                            type="text"
                            value={edu.details || ''}
                            onChange={(e) => handleUpdateEducation(edu.id, 'details', e.target.value)}
                            placeholder="Graduado con Distinción Máxima..."
                            className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 focus:border-palette-primary text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-palette-primary transition-colors"
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
                  <h3 className="text-sm font-bold text-slate-900">Stack & Habilidades Técnicas</h3>
                  <p className="text-xs text-slate-500">
                    Define tus competencias con nivel porcentual (1-100%) y categoría.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddSkill}
                  className="px-3 py-1.5 rounded-xl bg-palette-primary hover:bg-palette-hover text-white text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-palette-glow cursor-pointer transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Agregar Habilidad</span>
                </button>
              </div>

              {(!profileData.skills || profileData.skills.length === 0) ? (
                <div className="p-8 text-center rounded-2xl bg-slate-50/80 border border-slate-200 text-slate-500 text-xs">
                  No hay habilidades agregadas. Haz clic en "+ Agregar Habilidad".
                </div>
              ) : (
                <div className="space-y-3">
                  {profileData.skills.map((skill, idx) => (
                    <div key={skill.id || idx} className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center gap-3">
                      
                      <div className="flex-1 w-full sm:w-auto">
                        <label className="block text-[10px] font-semibold text-slate-700 mb-0.5">
                          Habilidad / Tecnología
                        </label>
                        <input
                          type="text"
                          value={skill.name || ''}
                          onChange={(e) => handleUpdateSkill(skill.id, 'name', e.target.value)}
                          placeholder="Ej. React 19 / Go / M&A"
                          className="w-full px-3 py-1.5 rounded-xl bg-white border border-slate-300 focus:border-palette-primary text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-palette-primary font-medium transition-colors"
                        />
                      </div>

                      <div className="w-full sm:w-36">
                        <label className="block text-[10px] font-semibold text-slate-700 mb-0.5">
                          Categoría
                        </label>
                        <input
                          type="text"
                          value={skill.category || ''}
                          onChange={(e) => handleUpdateSkill(skill.id, 'category', e.target.value)}
                          placeholder="Ej. Frontend"
                          className="w-full px-3 py-1.5 rounded-xl bg-white border border-slate-300 focus:border-palette-primary text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-palette-primary transition-colors"
                        />
                      </div>

                      <div className="w-full sm:w-36 flex flex-col justify-center">
                        <div className="flex justify-between text-[10px] text-slate-700 mb-1">
                          <span>Nivel</span>
                          <span className="font-mono font-bold text-palette-primary">{skill.level}%</span>
                        </div>
                        <input
                          type="range"
                          min={1}
                          max={100}
                          value={skill.level || 80}
                          onChange={(e) => handleUpdateSkill(skill.id, 'level', Number(e.target.value))}
                          className="w-full accent-palette-primary cursor-pointer h-2 bg-slate-200 rounded-lg"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteSkill(skill.id)}
                        className="text-rose-500 hover:text-rose-700 p-2 rounded-lg hover:bg-rose-100/50 transition-colors self-end sm:self-center cursor-pointer"
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
                  <h3 className="text-sm font-bold text-slate-900">Proyectos & Casos de Estudio</h3>
                  <p className="text-xs text-slate-500">
                    Muestra tus mejores trabajos con imágenes optimizadas y enlaces en vivo.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddProject}
                  className="px-3 py-1.5 rounded-xl bg-palette-primary hover:bg-palette-hover text-white text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-palette-glow cursor-pointer transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Agregar Proyecto</span>
                </button>
              </div>

              {(!profileData.projects || profileData.projects.length === 0) ? (
                <div className="p-8 text-center rounded-2xl bg-slate-50/80 border border-slate-200 text-slate-500 text-xs">
                  No hay proyectos registrados. Haz clic en "+ Agregar Proyecto".
                </div>
              ) : (
                <div className="space-y-4">
                  {profileData.projects.map((proj, idx) => (
                    <div key={proj.id || idx} className="p-4 sm:p-5 rounded-2xl bg-slate-50/80 border border-slate-200 space-y-3.5">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                        <span className="text-xs font-bold text-palette-primary uppercase tracking-wider flex items-center gap-1.5">
                          Proyecto #{idx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDeleteProject(proj.id)}
                          className="text-rose-500 hover:text-rose-700 p-1 rounded-lg hover:bg-rose-100/50 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Image Upload & Preview */}
                      <div className="flex flex-col sm:flex-row items-center gap-3.5 p-3 rounded-xl bg-white border border-slate-200">
                        {proj.image && (
                          <div className="relative group shrink-0">
                            <img
                              src={proj.image}
                              alt={proj.title}
                              className="w-24 h-16 rounded-xl object-cover border border-slate-200"
                            />
                            {compressingProjectIdx === proj.id && (
                              <div className="absolute inset-0 bg-white/80 rounded-xl flex items-center justify-center">
                                <RefreshCw className="w-4 h-4 text-palette-primary animate-spin" />
                              </div>
                            )}
                          </div>
                        )}

                        <div className="flex-1 w-full space-y-1.5">
                          <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider">
                            Foto de Portafolio (Compresión Automática)
                          </label>
                          <div className="flex items-center gap-2">
                            <label className="px-3 py-1.5 rounded-lg bg-palette-primary hover:bg-palette-hover text-white text-[11px] font-semibold cursor-pointer flex items-center gap-1.5 transition-colors shadow-sm">
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
                              className="flex-1 px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 focus:border-palette-primary text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-palette-primary transition-colors"
                            />
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Título del Proyecto
                        </label>
                        <input
                          type="text"
                          value={proj.title || ''}
                          onChange={(e) => handleUpdateProject(proj.id, 'title', e.target.value)}
                          placeholder="Ej. Aurora Design System"
                          className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 focus:border-palette-primary text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-palette-primary font-bold transition-colors"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Descripción
                        </label>
                        <textarea
                          rows={2}
                          value={proj.description || ''}
                          onChange={(e) => handleUpdateProject(proj.id, 'description', e.target.value)}
                          placeholder="Breve reseña del proyecto..."
                          className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 focus:border-palette-primary text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-palette-primary transition-colors"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
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
                          className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 focus:border-palette-primary text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-palette-primary transition-colors"
                        />
                        {proj.tags && proj.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {proj.tags.map((tag, tagI) => (
                              <span key={tagI} className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-palette-primary/10 text-palette-primary border border-palette-primary/20">
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                            URL en Vivo / Demo
                          </label>
                          <input
                            type="url"
                            value={proj.liveUrl || ''}
                            onChange={(e) => handleUpdateProject(proj.id, 'liveUrl', e.target.value)}
                            placeholder="https://..."
                            className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 focus:border-palette-primary text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-palette-primary font-mono transition-colors"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                            URL de Repositorio / Código
                          </label>
                          <input
                            type="url"
                            value={proj.repoUrl || ''}
                            onChange={(e) => handleUpdateProject(proj.id, 'repoUrl', e.target.value)}
                            placeholder="https://github.com/..."
                            className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 focus:border-palette-primary text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-palette-primary font-mono transition-colors"
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
                  <h3 className="text-sm font-bold text-slate-900">Idiomas & Dominio</h3>
                  <p className="text-xs text-slate-500">
                    Idiomas que manejas y nivel de suficiencia comunicativa.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddLanguage}
                  className="px-3 py-1.5 rounded-xl bg-palette-primary hover:bg-palette-hover text-white text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-palette-glow cursor-pointer transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Agregar Idioma</span>
                </button>
              </div>

              {(!profileData.languages || profileData.languages.length === 0) ? (
                <div className="p-8 text-center rounded-2xl bg-slate-50/80 border border-slate-200 text-slate-500 text-xs">
                  No hay idiomas registrados. Haz clic en "+ Agregar Idioma".
                </div>
              ) : (
                <div className="space-y-3">
                  {profileData.languages.map((lang, idx) => (
                    <div key={lang.id || idx} className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200 flex items-center gap-3">
                      <div className="flex-1">
                        <label className="block text-[10px] font-semibold text-slate-700 mb-0.5">
                          Idioma
                        </label>
                        <input
                          type="text"
                          value={lang.name || ''}
                          onChange={(e) => handleUpdateLanguage(lang.id, 'name', e.target.value)}
                          placeholder="Ej. Español / Inglés"
                          className="w-full px-3 py-1.5 rounded-xl bg-white border border-slate-300 focus:border-palette-primary text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-palette-primary font-bold transition-colors"
                        />
                      </div>

                      <div className="flex-1">
                        <label className="block text-[10px] font-semibold text-slate-700 mb-0.5">
                          Nivel de Dominio
                        </label>
                        <input
                          type="text"
                          value={lang.level || ''}
                          onChange={(e) => handleUpdateLanguage(lang.id, 'level', e.target.value)}
                          placeholder="Nativo / Bilingüe (C2) / Avanzado (C1)"
                          className="w-full px-3 py-1.5 rounded-xl bg-white border border-slate-300 focus:border-palette-primary text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-palette-primary transition-colors"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteLanguage(lang.id)}
                        className="text-rose-500 hover:text-rose-700 p-2 rounded-lg hover:bg-rose-100/50 transition-colors self-end cursor-pointer"
                        title="Eliminar idioma"
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
                <h3 className="text-sm font-bold text-slate-900">Botón de Contacto Flotante</h3>
                <p className="text-xs text-slate-500">
                  Gatillo de alta conversión fijo en la esquina inferior del portafolio.
                </p>
              </div>

              {/* Activation Switch */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50/80 border border-slate-200">
                <div className="space-y-0.5 pr-4">
                  <div className="text-xs font-bold text-slate-800">
                    Activar Botón Flotante
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Permite a los visitantes contactarte directamente con 1 solo clic.
                  </div>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={profileData.floatingButton?.enabled ?? true}
                  onClick={() => updateFloatingButton('enabled', !(profileData.floatingButton?.enabled ?? true))}
                  className={`w-12 h-7 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 ease-in-out shrink-0 ${
                    (profileData.floatingButton?.enabled ?? true)
                      ? 'bg-palette-gradient shadow-sm shadow-palette-glow'
                      : 'bg-slate-200 border border-slate-300'
                  }`}
                >
                  <div
                    className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
                      (profileData.floatingButton?.enabled ?? true) ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Channel Selector */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
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
                            ? 'border-palette-primary bg-palette-primary/10 ring-2 ring-palette-primary/30 text-palette-primary font-bold shadow-sm'
                            : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700 shadow-sm'
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
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mensaje Predeterminado al Abrir
                </label>
                <textarea
                  rows={3}
                  value={profileData.floatingButton?.customMessage || ''}
                  onChange={(e) => updateFloatingButton('customMessage', e.target.value)}
                  placeholder="Hola, vi tu portafolio en Mi Vitae y me gustaría conversar sobre una oportunidad..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 focus:border-palette-primary text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-palette-primary transition-colors"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Este texto se precargará automáticamente cuando un reclutador o cliente haga clic en el botón.
                </p>
              </div>

            </div>
          )}

        </section>

        {/* ========================================================================= */}
        {/* RIGHT COLUMN: LIVE ANALYTICS & PORTFOLIO CONTROL CENTER (Span 5) */}
        {/* ========================================================================= */}
        <section aria-label="Control Center y Métricas" className="hidden lg:flex lg:col-span-5 xl:col-span-5 sticky top-20 flex-col gap-5">
          
          {/* Quick Portfolio Action / Live Preview Card */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-4 sm:p-6 shadow-sm relative overflow-hidden">
            
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-600">
                  Portafolio en Línea
                </span>
              </div>
              <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-palette-primary/10 border border-palette-primary/20 text-palette-primary capitalize">
                Tema: {profileData.theme}
              </span>
            </div>

            {/* User Overview */}
            <div className="flex items-center gap-4 mb-5">
              <img
                src={profileData.personalInfo?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80'}
                alt={profileData.personalInfo?.name}
                className="w-16 h-16 rounded-2xl object-cover border-2 border-palette-primary/30 shadow-sm shrink-0"
              />
              <div className="min-w-0">
                <h3 className="font-extrabold text-base sm:text-lg text-slate-900 truncate">
                  {profileData.personalInfo?.name || 'Tu Nombre'}
                </h3>
                <p className="text-xs text-slate-500 font-medium truncate">
                  {profileData.personalInfo?.title || 'Tu Cargo Profesional'}
                </p>
                <div className="text-[11px] text-slate-400 font-mono mt-1">
                  @{profileData.username}
                </div>
              </div>
            </div>

            {/* Custom Link Box */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 flex items-center justify-between gap-2 mb-4">
              <div className="flex items-center gap-2 min-w-0 text-xs font-mono text-slate-600">
                <Globe className="w-4 h-4 text-palette-primary shrink-0" />
                <span className="truncate">{typeof window !== 'undefined' && window.location?.host && !window.location.host.includes('localhost') ? window.location.host : 'mivitae.wearesamod.com'}/<strong className="text-slate-900">{profileData.username}</strong></span>
              </div>
              <button
                type="button"
                onClick={handleCopyLink}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-bold transition-colors shrink-0 flex items-center gap-1 cursor-pointer"
                title="Copiar enlace directo"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Copiado' : 'Copiar'}</span>
              </button>
            </div>

            {/* Action Buttons Grid */}
            <div className="grid grid-cols-2 gap-2.5">
              <a
                href={getLiveProfileUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-3 rounded-2xl bg-palette-gradient hover:opacity-95 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-palette-glow transition-all hover:scale-[1.02] active:scale-[0.98] no-underline"
              >
                <Eye className="w-4 h-4" />
                <span>Ver en Vivo ↗</span>
              </a>

              <button
                type="button"
                onClick={() => setIsQrOpen(true)}
                className="px-4 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <QrCode className="w-4 h-4 text-palette-primary" />
                <span>Código QR</span>
              </button>
            </div>

          </div>

          {/* Real-time Analytics Dashboard Cards */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
            
            <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-palette-primary" />
                <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                  Métricas de Rendimiento
                </h4>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                Tiempo Real
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              
              {/* Metric 1: Views */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-medium text-slate-500">Visitas Totales</span>
                  <Eye className="w-4 h-4 text-palette-primary" />
                </div>
                <div className="text-2xl font-black text-slate-900">
                  {(profileData.analytics?.views || 1240).toLocaleString('es-CL')}
                </div>
                <div className="text-[10px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  <span>+18% esta semana</span>
                </div>
              </div>

              {/* Metric 2: WhatsApp Clicks */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-medium text-slate-500">Clics WhatsApp</span>
                  <MessageCircle className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-2xl font-black text-slate-900">
                  {(profileData.analytics?.contactClicks || 380).toLocaleString('es-CL')}
                </div>
                <div className="text-[10px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  <span>Contacto directo</span>
                </div>
              </div>

              {/* Metric 3: QR Scans */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-medium text-slate-500">Escaneos QR</span>
                  <QrCode className="w-4 h-4 text-palette-primary" />
                </div>
                <div className="text-2xl font-black text-slate-900">
                  {(profileData.analytics?.cvDownloads || 3).toLocaleString('es-CL')}
                </div>
                <div className="text-[10px] text-slate-500 font-semibold mt-1">
                  Tarjetas & networking
                </div>
              </div>

              {/* Metric 4: Conversion Rate */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-medium text-slate-500">Tasa de Conversión</span>
                  <Sparkles className="w-4 h-4 text-palette-primary" />
                </div>
                <div className="text-2xl font-black text-palette-primary">
                  {(((profileData.analytics?.contactClicks || 380) / Math.max(profileData.analytics?.views || 1240, 1)) * 100).toFixed(1)}%
                </div>
                <div className="text-[10px] text-palette-primary font-semibold mt-1">
                  x15 vs CV en PDF
                </div>
              </div>

            </div>

            {/* Profile Content Summary */}
            <div className="pt-2 border-t border-slate-200 text-xs text-slate-500 space-y-2">
              <div className="flex items-center justify-between">
                <span>Experiencias registradas:</span>
                <strong className="text-slate-900">{profileData.experience?.length || 0}</strong>
              </div>
              <div className="flex items-center justify-between">
                <span>Proyectos destacados:</span>
                <strong className="text-slate-900">{profileData.projects?.length || 0}</strong>
              </div>
              <div className="flex items-center justify-between">
                <span>Competencias / Stack:</span>
                <strong className="text-slate-900">{profileData.skills?.length || 0}</strong>
              </div>
            </div>

          </div>

          {/* Plan & Subscription Card */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-4 sm:p-5 shadow-sm space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold shadow-sm shrink-0 ${
                  planInfo.isExpired
                    ? 'bg-rose-100 text-rose-600 border border-rose-200'
                    : planInfo.isPremium
                    ? 'bg-palette-gradient text-white shadow-palette-glow'
                    : 'bg-palette-primary/10 text-palette-primary border border-palette-primary/20'
                }`}>
                  {planInfo.isExpired ? (
                    <CreditCard className="w-5 h-5" />
                  ) : planInfo.isPremium ? (
                    <Sparkles className="w-5 h-5 text-white" />
                  ) : (
                    <CheckCircle2 className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-black text-slate-900">
                      {planInfo.isPremium ? 'Suscripción Mi Vitae Pro' : '1er Mes Gratis Activo'}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                      planInfo.isExpired
                        ? 'bg-rose-100 text-rose-700 border border-rose-200'
                        : 'bg-palette-primary/10 text-palette-primary border border-palette-primary/20'
                    }`}>
                      {planInfo.isExpired ? 'Vencido' : 'Activo'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Plan Profesional · $3.490 CLP/mes
                  </p>
                </div>
              </div>
            </div>

            {/* Expiration and days remaining notice */}
            <div className={`p-3 rounded-2xl text-xs flex items-center justify-between gap-2 border ${
              planInfo.isExpired
                ? 'bg-rose-50 border-rose-200 text-rose-700'
                : 'bg-slate-50 border border-slate-200 text-slate-700'
            }`}>
              {planInfo.isExpired ? (
                <div className="flex items-center gap-2 text-rose-700 font-medium">
                  <span>⚠️</span>
                  <span><strong>Plan Vencido:</strong> Renueva para mantener tu portafolio activo.</span>
                </div>
              ) : (
                <div className="flex items-center justify-between w-full">
                  <span className="text-slate-600">Vence: <strong className="text-slate-900">{planInfo.formattedDate}</strong></span>
                  <span className="px-2 py-0.5 rounded-md bg-palette-primary/10 text-palette-primary font-bold font-mono text-[11px] border border-palette-primary/20">
                    {planInfo.daysRemaining} {planInfo.daysRemaining === 1 ? 'día restante' : 'días restantes'}
                  </span>
                </div>
              )}
            </div>

            {/* The single unified action button */}
            <button
              type="button"
              onClick={() => openFlowModal({ username: profileData.username, planName: 'Suscripción Mi Vitae ($3.490 CLP/mes)', amount: 3490 })}
              className="w-full min-h-[44px] py-2.5 px-4 rounded-xl bg-palette-gradient hover:opacity-95 text-white text-xs sm:text-sm font-bold shadow-palette-glow hover:shadow-palette-glow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
            >
              <CreditCard className="w-4 h-4" />
              <span>{planInfo.isExpired ? 'Renovar Suscripción con Flow.cl ($3.490 CLP)' : 'Pagar Suscripción ($3.490 CLP/mes)'}</span>
            </button>
          </div>

        </section>

      </main>

      {/* Sticky Bottom Bar for Mobile */}
      <aside aria-label="Acciones rápidas móviles" className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-4 py-3 shadow-xl flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setIsQrOpen(true)}
          className="flex-1 min-h-[44px] px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          <QrCode className="w-4 h-4 text-palette-primary" />
          <span>Código QR</span>
        </button>

        <button
          type="button"
          onClick={handleCopyLink}
          className="flex-1 min-h-[44px] px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
          <span>{copiedLink ? 'Copiado' : 'Copiar Link'}</span>
        </button>

        <a
          href={getLiveProfileUrl()}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 min-h-[44px] px-3 py-2 rounded-xl bg-palette-gradient hover:opacity-95 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm shadow-palette-glow transition-transform active:scale-[0.98] no-underline"
        >
          <Eye className="w-4 h-4" />
          <span>En Vivo ↗</span>
        </a>
      </aside>

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
