import React, { useState, useMemo, useEffect } from 'react'
import { Link, useNavigate } from '../router/Router'
import { useProfileStore } from '../stores/profileStore'
import { 
  getCurrentUser, 
  fetchTransactionsFromSupabase,
  fetchAllProfilesFromSupabase,
  updateProfilePlanInSupabase,
  deleteProfileFromSupabase,
  assignCreatorCodeInSupabase,
  removeCreatorCodeInSupabase
} from '../lib/supabaseClient'
import { 
  Shield, Users, Eye, MousePointerClick, DollarSign, 
  ExternalLink, TrendingUp, RefreshCw, CheckCircle2, 
  Search, UserCheck, Trash2, Edit3, X,
  Sparkles, FileDown, ChevronDown, ChevronLeft, ChevronRight, UserPlus, Lock,
  Award, Copy, Check, Calendar, ArrowRight, LogOut, Receipt,
  Plus, Tag, Globe, QrCode, Palette, BarChart3, MessageSquare, Star, ArrowUpRight
} from 'lucide-react'

import { THEME_COMPONENTS } from '../components/Themes/ThemeRenderer'
import { Blobatar } from '@blobatar/react'

// Map theme IDs to user-friendly names and badge styling
const THEME_INFO = {
  swiss: { name: 'Suizo (Swiss Grid)', color: 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800' },
  minimalist: { name: 'Minimalista', color: 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700' },
  neo_brutalist: { name: 'Pop Tactile', color: 'bg-amber-100 dark:bg-amber-950/50 text-amber-900 dark:text-amber-300 border-amber-300 dark:border-amber-700' },
  creative: { name: 'Creativo', color: 'bg-fuchsia-50 dark:bg-fuchsia-950/50 text-fuchsia-700 dark:text-fuchsia-300 border-fuchsia-200 dark:border-fuchsia-800' },
  tech: { name: 'Técnico', color: 'bg-cyan-50 dark:bg-cyan-950/50 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800' },
  warm: { name: 'Cálido', color: 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800' },
  executive: { name: 'Ejecutivo', color: 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800' },
}

// Resolucion dinamica y escalable de metadatos de cualquier tema registrado o nuevo
const getThemeMeta = (themeKey) => {
  if (THEME_INFO[themeKey]) return THEME_INFO[themeKey]
  const cleanName = (themeKey || 'minimalist')
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
  return {
    name: cleanName,
    color: 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700'
  }
}

const PLAN_INFO = {
  lifetime: { 
    name: 'Plan Pro (De por vida)', 
    shortName: 'De por vida', 
    color: 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-700' 
  },
  premium: { 
    name: 'Suscripción Activa', 
    shortName: 'Suscripción ($3.490)', 
    color: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' 
  },
  trial: { 
    name: '1er Mes Gratis', 
    shortName: 'Prueba (30d)', 
    color: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800' 
  },
  inactive: { 
    name: 'Inactivo', 
    shortName: 'Inactivo', 
    color: 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800' 
  }
}

// Comisiones oficiales acordadas para afiliados / creadores
export const CREATOR_COMMISSION_CLP = 600
export const CREATOR_COMMISSION_USD = 0.70

// Directorio oficial de Creadores Afiliados Registrados en Producción
const REGISTERED_AFFILIATES = [
  {
    code: 'SANTIAGOQ7',
    creatorUsername: 'santiagoq7',
    creatorName: 'Santiago Quevedo',
    creatorTitle: 'Marketing Digital, Growth & Desarrollo Comercial',
    isOfficial: true,
    isLifetime: true
  }
]

// Preset archetypes for 1-click test user creation
const DEMO_PRESETS = [
  {
    username: 'marina_arq',
    theme: 'minimalist',
    plan: 'trial',
    status: 'trial',
    createdAt: '2025-02-18',
    personalInfo: {
      name: 'Arq. Marina Soto Echeverría',
      title: 'Arquitecta Bioclimática & Paisajismo Urbano',
      bio: 'Especialista en arquitectura sustentable, eficiencia energética LEED y diseño de espacios urbanos regenerativos.',
      avatar: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=600&q=80',
      location: 'Valparaíso, Chile',
      email: 'marina@sotoarquitectura.cl',
      phone: '+56 9 8877 6655',
      whatsapp: '+56988776655',
      linkedin: 'https://linkedin.com',
      availableForWork: true
    },
    analytics: { views: 820, contactClicks: 64, cvDownloads: 38 }
  },
  {
    username: 'felipe_ai',
    theme: 'tech',
    plan: 'premium',
    status: 'active',
    createdAt: '2025-02-22',
    personalInfo: {
      name: 'Felipe Alarcón Lagos',
      title: 'Lead AI Engineer & MLOps Specialist',
      bio: 'Desarrollo y orquestación de LLMs en producción, fine-tuning y sistemas RAG de baja latencia con PyTorch y FastAPI.',
      avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=600&q=80',
      location: 'Santiago, Chile / Remoto',
      email: 'felipe.ai.mlops@gmail.com',
      phone: '+56 9 4433 2211',
      whatsapp: '+56944332211',
      github: 'https://github.com',
      availableForWork: true
    },
    analytics: { views: 1640, contactClicks: 128, cvDownloads: 95 }
  },
  {
    username: 'sofia_growth',
    theme: 'creative',
    plan: 'premium',
    status: 'active',
    createdAt: '2025-02-10',
    personalInfo: {
      name: 'Sofía Larraín Castro',
      title: 'VP of Growth & Brand Strategy',
      bio: 'Escalando marcas de eCommerce y SaaS B2B en LatAm mediante experimentación continua, paid media y retención de cohortes.',
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=600&q=80',
      location: 'Santiago de Chile',
      email: 'sofia@growthlatam.agency',
      phone: '+56 9 3322 1100',
      whatsapp: '+56933221100',
      linkedin: 'https://linkedin.com',
      availableForWork: false
    },
    analytics: { views: 2490, contactClicks: 190, cvDownloads: 112 }
  }
]

export default function AdminPage() {
  const navigate = useNavigate()
  const profiles = useProfileStore((state) => state.profiles)
  const setProfilePlan = useProfileStore((state) => state.setProfilePlan)
  const deleteProfile = useProfileStore((state) => state.deleteProfile)
  const addProfile = useProfileStore((state) => state.addProfile)
  const setActiveUsername = useProfileStore((state) => state.setActiveUsername)
  const setRemoteProfiles = useProfileStore((state) => state.setRemoteProfiles)

  // Security & Authorization State (verified dynamically via serverless endpoint)
  const [isAdminAuthorized, setIsAdminAuthorized] = useState(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('mi_vitae_admin_auth') === 'true'
    }
    return false
  })
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [isVerifyingLogin, setIsVerifyingLogin] = useState(false)
  const [adminEmailInput, setAdminEmailInput] = useState('')
  const [adminPasswordInput, setAdminPasswordInput] = useState('')
  const [authError, setAuthError] = useState('')

  useEffect(() => {
    let isMounted = true
    if (sessionStorage.getItem('mi_vitae_admin_auth') === 'true') {
      setIsAdminAuthorized(true)
      setIsCheckingAuth(false)
      return
    }

    getCurrentUser().then((user) => {
      if (!isMounted) return
      const isSamodAdmin = user && (
        user.email === 'jericesb5@gmail.com' ||
        user.app_metadata?.role === 'admin' ||
        user.user_metadata?.role === 'admin' ||
        user.email === 'admin@wearesamod.com' ||
        user.email?.endsWith('@wearesamod.com')
      )
      if (isSamodAdmin) {
        setIsAdminAuthorized(true)
        sessionStorage.setItem('mi_vitae_admin_auth', 'true')
      }
      setIsCheckingAuth(false)
    }).catch(() => {
      if (isMounted) setIsCheckingAuth(false)
    })
    return () => { isMounted = false }
  }, [])

  const handleAdminLogin = async (e) => {
    e.preventDefault()
    const cleanUser = adminEmailInput.trim().toLowerCase()
    const pass = adminPasswordInput.trim()

    if (!cleanUser || !pass) {
      setAuthError('Ingresa tu correo y contraseña.')
      return
    }

    setIsVerifyingLogin(true)
    setAuthError('')

    try {
      // Verify credentials on the secure serverless edge
      const res = await fetch('/api/admin-manage-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'verify_admin',
          adminEmail: cleanUser,
          adminSecret: pass
        })
      })

      const data = await res.json().catch(() => ({}))

      if (res.ok && data.success && data.authorized) {
        setIsAdminAuthorized(true)
        sessionStorage.setItem('mi_vitae_admin_auth', 'true')
        sessionStorage.setItem('mi_vitae_admin_token', pass)
        setAuthError('')
        showToast('¡Bienvenido Jeric! Acceso concedido al Super Admin.')
      } else {
        setAuthError(data.error || 'Usuario o contraseña de administrador incorrectos.')
      }
    } catch (err) {
      setAuthError('Error de conexión al verificar credenciales con el servidor.')
    } finally {
      setIsVerifyingLogin(false)
    }
  }

  const handleAdminLogout = () => {
    sessionStorage.removeItem('mi_vitae_admin_auth')
    sessionStorage.removeItem('mi_vitae_admin_token')
    setIsAdminAuthorized(false)
    setAdminPasswordInput('')
    navigate('/')
  }

  // Navigation tab: 'users' | 'analytics' | 'feedbacks' | 'creators'
  const [activeAdminTab, setActiveAdminTab] = useState('users')

  // Live Database State from Supabase
  const [remoteProfiles, setRemoteProfilesState] = useState([])
  const [isLoadingProfiles, setIsLoadingProfiles] = useState(true)
  const [transactions, setTransactions] = useState([])
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false)
  const [creatorSearch, setCreatorSearch] = useState('')
  const [selectedCreatorDetails, setSelectedCreatorDetails] = useState(null)
  const [copiedCreatorCode, setCopiedCreatorCode] = useState(null)

  // Creator Assignment CRUD Modal State
  const [isCreatorModalOpen, setIsCreatorModalOpen] = useState(false)
  const [editingCreator, setEditingCreator] = useState(null)
  const [creatorFormUsername, setCreatorFormUsername] = useState('')
  const [creatorFormCode, setCreatorFormCode] = useState('')
  const [creatorFormIsLifetime, setCreatorFormIsLifetime] = useState(true)
  const [isSavingCreator, setIsSavingCreator] = useState(false)
  const [creatorFormError, setCreatorFormError] = useState('')
  const [confirmRemoveCreator, setConfirmRemoveCreator] = useState(null)

  // Fetch real data from Supabase Cloud
  const loadAdminData = async () => {
    setIsLoadingProfiles(true)
    setIsLoadingTransactions(true)
    try {
      const [dbProfiles, dbTransactions] = await Promise.all([
        fetchAllProfilesFromSupabase(),
        fetchTransactionsFromSupabase()
      ])

      if (dbProfiles && dbProfiles.length > 0) {
        setRemoteProfilesState(dbProfiles)
        if (setRemoteProfiles) {
          setRemoteProfiles(dbProfiles)
        }
      }
      setTransactions(dbTransactions || [])
    } catch (err) {
      console.warn('Error loading admin live data from Supabase:', err)
    } finally {
      setIsLoadingProfiles(false)
      setIsLoadingTransactions(false)
    }
  }

  useEffect(() => {
    if (!isAdminAuthorized) return
    loadAdminData()
  }, [isAdminAuthorized])

  // Filter and search state
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all') // 'all', 'lifetime', 'premium', 'trial', 'inactive'
  const [themeFilter] = useState('all') // Simplified: always 'all' without visible dropdown selector
  const [sortField, setSortField] = useState('createdAt') // Default: 'createdAt', 'views', 'clicks', 'name'
  const [sortOrder, setSortOrder] = useState('desc') // Default: 'desc', 'asc'
  const [currentPage, setCurrentPage] = useState(1)
  const USERS_PER_PAGE = 10

  // Reset pagination to first page when search or status filter changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, statusFilter])

  // UI state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isThemeBreakdownOpen, setIsThemeBreakdownOpen] = useState(false)
  const [toastMessage, setToastMessage] = useState(null)
  const [confirmDeleteUser, setConfirmDeleteUser] = useState(null)

  // Show auto-dismissing toast
  const showToast = (message) => {
    setToastMessage(message)
    setTimeout(() => setToastMessage(null), 3500)
  }

  const profileList = useMemo(() => {
    // In production, when remote profiles are loaded, use EXCLUSIVELY the real Supabase profiles!
    const sourceProfiles = remoteProfiles.length > 0
      ? remoteProfiles
      : Object.values(profiles) // Fallback only for isolated local testing without Supabase

    return sourceProfiles.map((p) => {
      const isLifetime = Boolean(
        p.isLifetime ||
        (p.planExpiresAt && new Date(p.planExpiresAt).getFullYear() >= 2090) ||
        (p.plan_expires_at && new Date(p.plan_expires_at).getFullYear() >= 2090)
      )
      const rawPlan = p.plan || (p.status === 'trial' ? 'trial' : p.status === 'inactive' ? 'inactive' : 'premium')
      const plan = isLifetime ? 'lifetime' : (rawPlan === 'free_trial' ? 'trial' : rawPlan)
      const status = p.status || p.planStatus || (plan === 'inactive' ? 'inactive' : plan === 'trial' ? 'trial' : 'active')

      return {
        ...p,
        plan,
        status,
        isLifetime
      }
    })
  }, [remoteProfiles, profiles])

  // Extraer feedbacks reales de los usuarios
  const feedbackProfiles = useMemo(() => {
    return profileList.filter((p) => {
      const fb = p.feedback || p.personalInfo?.feedback || (p.feedbackSurveyCompleted ? {} : null)
      return Boolean(fb || p.feedbackSurveyCompleted)
    }).map((p) => {
      const fb = p.feedback || p.personalInfo?.feedback || {}
      return {
        username: p.username,
        name: p.personalInfo?.name || p.username,
        avatar: p.personalInfo?.avatar || '',
        title: p.personalInfo?.title || 'Profesional',
        rating: Number(fb.rating || 5),
        obstacle: fb.cvObstacle || fb.obstacle || 'Dificultad para resumir y adaptar a móvil',
        area: fb.professionalArea || p.personalInfo?.title || 'Tecnología & Servicios',
        source: fb.referralSource || 'Orgánico / Redes',
        notes: fb.notes || fb.comments || 'Excelente plataforma para crear un portafolio web en minutos.',
        date: p.createdAt || p.created_at || '2025-02-15'
      }
    })
  }, [profileList])

  // Aggregate Key KPIs
  const totalProfiles = profileList.length
  const lifetimeProfiles = profileList.filter((p) => p.plan === 'lifetime').length
  const activePremiumProfiles = profileList.filter((p) => p.plan === 'premium').length
  const trialProfiles = profileList.filter((p) => p.plan === 'trial').length
  const inactiveProfiles = profileList.filter((p) => p.plan === 'inactive').length

  // Conteo de usuarios registrados en los ultimos 7 dias
  const newProfilesThisWeek = useMemo(() => {
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
    return profileList.filter((p) => {
      const rawDate = p.createdAt || p.created_at || p.trialActivatedAt || 0
      const dateVal = new Date(rawDate).getTime()
      return !isNaN(dateVal) && dateVal >= sevenDaysAgo
    }).length
  }, [profileList])

  // Desglose de popularidad por temas (100% dinamico y escalable)
  const themeCounts = useMemo(() => {
    const counts = {}
    const allKnownThemes = new Set([
      ...Object.keys(THEME_COMPONENTS || {}),
      ...Object.keys(THEME_INFO)
    ])
    allKnownThemes.forEach((k) => { counts[k] = 0 })

    profileList.forEach((p) => {
      const t = p.theme || 'minimalist'
      counts[t] = (counts[t] || 0) + 1
    })
    return counts
  }, [profileList])

  const topThemes = useMemo(() => {
    return Object.entries(themeCounts)
      .sort((a, b) => b[1] - a[1])
  }, [themeCounts])

  const totalViews = profileList.reduce((acc, p) => acc + (p.analytics?.views || 0), 0)
  const totalClicks = profileList.reduce((acc, p) => acc + (p.analytics?.contactClicks || 0), 0)
  const totalDownloads = profileList.reduce((acc, p) => acc + (p.analytics?.cvDownloads || 0), 0)
  const globalInteractions = totalClicks + totalDownloads
  const globalConversionRate = totalViews > 0 ? ((globalInteractions / totalViews) * 100).toFixed(1) : '0.0'

  // Pricing: $3.490 CLP / month for recurring Premium subscriptions
  const PRICE_PER_PREMIUM_CLP = 3490
  const projectedMrr = activePremiumProfiles * PRICE_PER_PREMIUM_CLP
  const projectedArr = projectedMrr * 12

  // Filter and sort profiles
  const filteredProfiles = useMemo(() => {
    return profileList
      .filter((p) => {
        // Status filter
        if (statusFilter !== 'all') {
          if (statusFilter === 'lifetime' && !p.isLifetime && p.plan !== 'lifetime') return false
          if (statusFilter !== 'lifetime' && p.plan !== statusFilter) return false
        }

        // Theme filter
        if (themeFilter !== 'all' && p.theme !== themeFilter) {
          return false
        }

        // Search term filter
        if (searchTerm.trim()) {
          const query = searchTerm.toLowerCase().trim()
          const name = (p.personalInfo?.name || '').toLowerCase()
          const username = (p.username || '').toLowerCase()
          const title = (p.personalInfo?.title || '').toLowerCase()
          const email = (p.personalInfo?.email || '').toLowerCase()

          if (!name.includes(query) && !username.includes(query) && !title.includes(query) && !email.includes(query)) {
            return false
          }
        }

        return true
      })
      .sort((a, b) => {
        let valA, valB
        if (sortField === 'views') {
          valA = a.analytics?.views || 0
          valB = b.analytics?.views || 0
        } else if (sortField === 'clicks') {
          valA = a.analytics?.contactClicks || 0
          valB = b.analytics?.contactClicks || 0
        } else if (sortField === 'name') {
          valA = (a.personalInfo?.name || '').toLowerCase()
          valB = (b.personalInfo?.name || '').toLowerCase()
        } else if (sortField === 'createdAt') {
          const timeA = new Date(a.createdAt || a.created_at || a.trialActivatedAt || 0).getTime()
          const timeB = new Date(b.createdAt || b.created_at || b.trialActivatedAt || 0).getTime()
          valA = isNaN(timeA) ? 0 : timeA
          valB = isNaN(timeB) ? 0 : timeB
        } else {
          valA = a.analytics?.views || 0
          valB = b.analytics?.views || 0
        }

        if (sortOrder === 'asc') {
          return valA > valB ? 1 : -1
        } else {
          return valA < valB ? 1 : -1
        }
      })
  }, [profileList, searchTerm, statusFilter, themeFilter, sortField, sortOrder])

  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(filteredProfiles.length / USERS_PER_PAGE))
  const paginatedProfiles = useMemo(() => {
    const startIndex = (currentPage - 1) * USERS_PER_PAGE
    return filteredProfiles.slice(startIndex, startIndex + USERS_PER_PAGE)
  }, [filteredProfiles, currentPage])

  // Clamp current page if total pages changes
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  // Handle plan status change with persistence to Supabase
  const handlePlanChange = async (username, newPlan) => {
    const isLifetime = newPlan === 'lifetime'

    // 1. Optimistic update in remoteProfilesState
    setRemoteProfilesState((prev) => prev.map((p) => {
      if (p.username.toLowerCase() === username.toLowerCase()) {
        return {
          ...p,
          plan: newPlan,
          isLifetime,
          planStatus: newPlan === 'inactive' ? 'expired' : 'active',
          planExpiresAt: isLifetime ? '2099-12-31T23:59:59.000Z' : p.planExpiresAt
        }
      }
      return p
    }))

    // 2. Update Zustand store
    setProfilePlan(username, isLifetime ? 'premium' : newPlan)

    // 3. Persist directly to Supabase via serverless endpoint bypassing RLS
    const adminToken = typeof window !== 'undefined' ? sessionStorage.getItem('mi_vitae_admin_token') : null
    const success = await updateProfilePlanInSupabase(username, newPlan, adminToken)
    if (success) {
      showToast(`Plan de @${username} actualizado a ${PLAN_INFO[newPlan]?.name || newPlan} en Supabase`)
      fetchAllProfilesFromSupabase().then((refreshed) => {
        if (refreshed && refreshed.length > 0) {
          setRemoteProfilesState(refreshed)
        }
      }).catch(() => {})
    } else {
      showToast(`No se pudo guardar en Supabase (error de permisos o RLS).`)
    }
  }

  // Handle user deletion with persistence to Supabase
  const handleDelete = async (username) => {
    setRemoteProfilesState((prev) => prev.filter((p) => p.username.toLowerCase() !== username.toLowerCase()))
    deleteProfile(username)
    setConfirmDeleteUser(null)

    const adminToken = typeof window !== 'undefined' ? sessionStorage.getItem('mi_vitae_admin_token') : null
    const success = await deleteProfileFromSupabase(username, adminToken)
    if (success) {
      showToast(`Portafolio de @${username} eliminado de Supabase.`)
      fetchAllProfilesFromSupabase().then((refreshed) => {
        if (refreshed && refreshed.length > 0) {
          setRemoteProfilesState(refreshed)
        }
      }).catch(() => {})
    } else {
      showToast(`Portafolio de @${username} eliminado localmente.`)
    }
  }

  // Handle edit navigation
  const handleEdit = (username) => {
    setActiveUsername(username)
    navigate('/dashboard')
  }

  // Handle Export to CSV
  const handleExportCSV = () => {
    const headers = [
      'Username',
      'Nombre Completo',
      'Título Profesional',
      'Email',
      'Teléfono / WhatsApp',
      'Ubicación',
      'Plan',
      'Estado',
      'Tema',
      'Vistas Totales',
      'Clics Contacto WhatsApp',
      'Escaneos QR',
      'Tasa de Conversión (%)',
      'Fecha Creación',
      'URL Portafolio'
    ]

    const rows = profileList.map((p) => {
      const views = p.analytics?.views || 0
      const clicks = p.analytics?.contactClicks || 0
      const qrScans = (p.analytics?.qrScans ?? p.analytics?.cvDownloads ?? 0)
      const totalInteractions = clicks + qrScans
      const cr = views > 0 ? ((totalInteractions / views) * 100).toFixed(1) : '0.0'
      const portUrl = `https://mivitae.wearesamod.com/${p.username}`

      return [
        `"${p.username}"`,
        `"${p.personalInfo?.name || ''}"`,
        `"${p.personalInfo?.title || ''}"`,
        `"${p.personalInfo?.email || ''}"`,
        `"${p.personalInfo?.whatsapp || p.personalInfo?.phone || ''}"`,
        `"${p.personalInfo?.location || ''}"`,
        `"${p.plan}"`,
        `"${p.status}"`,
        `"${THEME_INFO[p.theme]?.name || p.theme}"`,
        views,
        clicks,
        qrScans,
        `"${cr}%"`,
        `"${p.createdAt || '2025-02-01'}"`,
        `"${portUrl}"`
      ].join(',')
    })

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    const dateStr = new Date().toISOString().split('T')[0]
    link.setAttribute('href', url)
    link.setAttribute('download', `mi_vitae_usuarios_${dateStr}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    showToast('Reporte CSV de usuarios exportado exitosamente.')
  }

  // AFFILIATES & CREATORS REAL BUSINESS LOGIC
  const creatorsSummary = useMemo(() => {
    const map = {}

    profileList.forEach((p) => {
      const code = String(
        p.creatorCode || 
        p.personalInfo?.creator_code || 
        p.personalInfo?.creatorCode || 
        (p.username === 'santiagoq7' ? 'SANTIAGOQ7' : '')
      ).trim().toUpperCase()

      if (code) {
        map[code] = {
          code,
          creatorUsername: p.username,
          creatorName: p.personalInfo?.name || p.username,
          creatorTitle: p.personalInfo?.title || 'Creador Afiliado',
          creatorAvatar: p.personalInfo?.avatar || '',
          isOfficial: true,
          isLifetime: Boolean(p.isLifetime || p.plan === 'lifetime' || (p.planExpiresAt && new Date(p.planExpiresAt).getFullYear() >= 2090)),
          salesClp: 0,
          salesUsd: 0,
          totalRevenueClp: 0,
          totalRevenueUsd: 0,
          commissionClp: 0,
          commissionUsd: 0,
          transactions: []
        }
      }
    })

    REGISTERED_AFFILIATES.forEach((aff) => {
      if (!map[aff.code]) {
        map[aff.code] = {
          code: aff.code,
          creatorUsername: aff.creatorUsername,
          creatorName: aff.creatorName,
          creatorTitle: aff.creatorTitle,
          creatorAvatar: '',
          isOfficial: true,
          isLifetime: true,
          salesClp: 0,
          salesUsd: 0,
          totalRevenueClp: 0,
          totalRevenueUsd: 0,
          commissionClp: 0,
          commissionUsd: 0,
          transactions: []
        }
      }
    })

    transactions.forEach((tx) => {
      const code = String(tx.creator_code || tx.metadata?.creator_code || '').trim().toUpperCase()
      if (!code || tx.status !== 'APROBADO') return

      if (!map[code]) {
        map[code] = {
          code,
          salesClp: 0,
          salesUsd: 0,
          totalRevenueClp: 0,
          totalRevenueUsd: 0,
          commissionClp: 0,
          commissionUsd: 0,
          transactions: []
        }
      }

      const isUsd = (tx.currency || '').toUpperCase() === 'USD'
      if (isUsd) {
        map[code].salesUsd += 1
        map[code].totalRevenueUsd += Number(tx.amount || 3.99)
        map[code].commissionUsd += CREATOR_COMMISSION_USD
      } else {
        map[code].salesClp += 1
        map[code].totalRevenueClp += Number(tx.amount || 3490)
        map[code].commissionClp += CREATOR_COMMISSION_CLP
      }

      map[code].transactions.push({
        id: tx.order_number || tx.id,
        date: tx.created_at || new Date().toISOString(),
        username: tx.username || 'usuario',
        payerEmail: tx.payer_email || 'cliente@ejemplo.com',
        currency: isUsd ? 'USD' : 'CLP',
        amount: Number(tx.amount || (isUsd ? 3.99 : 3490)),
        paymentMethod: tx.payment_method || (isUsd ? 'PayPal' : 'Flow.cl'),
        commissionEarned: isUsd ? CREATOR_COMMISSION_USD : CREATOR_COMMISSION_CLP
      })
    })

    profileList.forEach((p) => {
      const history = p.transactionsHistory || (p.lastTransaction ? [p.lastTransaction] : [])
      history.forEach((tx) => {
        const code = String(tx.creator_code || tx.creatorCode || '').trim().toUpperCase()
        if (!code || (tx.status && tx.status !== 'APROBADO')) return

        const orderId = tx.orderNumber || tx.transactionId
        const alreadyExists = map[code]?.transactions.some((t) => t.id === orderId)
        if (alreadyExists) return

        if (!map[code]) {
          map[code] = {
            code,
            salesClp: 0,
            salesUsd: 0,
            totalRevenueClp: 0,
            totalRevenueUsd: 0,
            commissionClp: 0,
            commissionUsd: 0,
            transactions: []
          }
        }

        const isUsd = (tx.currency || '').toUpperCase() === 'USD'
        if (isUsd) {
          map[code].salesUsd += 1
          map[code].totalRevenueUsd += Number(tx.amount || 3.99)
          map[code].commissionUsd += CREATOR_COMMISSION_USD
        } else {
          map[code].salesClp += 1
          map[code].totalRevenueClp += Number(tx.amount || 3490)
          map[code].commissionClp += CREATOR_COMMISSION_CLP
        }

        map[code].transactions.push({
          id: orderId || `TX-${Date.now()}`,
          date: tx.date || new Date().toISOString(),
          username: p.username,
          payerEmail: tx.payerEmail || p.personalInfo?.email || 'cliente@ejemplo.com',
          currency: isUsd ? 'USD' : 'CLP',
          amount: Number(tx.amount || (isUsd ? 3.99 : 3490)),
          paymentMethod: tx.paymentMethod || (isUsd ? 'PayPal' : 'Flow.cl'),
          commissionEarned: isUsd ? CREATOR_COMMISSION_USD : CREATOR_COMMISSION_CLP
        })
      })
    })

    return Object.values(map)
  }, [transactions, profileList])

  const filteredCreators = useMemo(() => {
    if (!creatorSearch.trim()) return creatorsSummary
    const q = creatorSearch.trim().toUpperCase()
    return creatorsSummary.filter((c) => c.code.includes(q))
  }, [creatorsSummary, creatorSearch])

  // Global creator totals
  const totalCreatorSalesClp = creatorsSummary.reduce((acc, c) => acc + c.salesClp, 0)
  const totalCreatorSalesUsd = creatorsSummary.reduce((acc, c) => acc + c.salesUsd, 0)
  const totalCreatorRevenueClp = creatorsSummary.reduce((acc, c) => acc + c.totalRevenueClp, 0)
  const totalCreatorRevenueUsd = creatorsSummary.reduce((acc, c) => acc + c.totalRevenueUsd, 0)
  const totalCreatorCommissionClp = creatorsSummary.reduce((acc, c) => acc + c.commissionClp, 0)
  const totalCreatorCommissionUsd = creatorsSummary.reduce((acc, c) => acc + c.commissionUsd, 0)

  // Copy monthly settlement summary for transferring on the 30th (clean text, zero emojis)
  const handleCopyCreatorSettlement = (creator) => {
    const totalUsers = creator.salesClp + creator.salesUsd
    const text = `
==================================================
LIQUIDACION CREADOR / AFILIADO (CORTE DIA 30)
Mi Vitae by We Are Samod
==================================================
Codigo de Creador:          ${creator.code}
Fecha de Emision:            ${new Date().toLocaleDateString('es-CL')}

RESUMEN DE VENTAS Y CONVERSIONES:
- Ventas Chile (Flow.cl):         ${creator.salesClp} usuarios ($${CREATOR_COMMISSION_CLP.toLocaleString('es-CL')} CLP comision c/u)
- Ventas Internacional (PayPal):  ${creator.salesUsd} usuarios ($${CREATOR_COMMISSION_USD.toFixed(2)} USD comision c/u)
- Total Usuarios Pagados:         ${totalUsers} usuarios

TOTAL A TRANSFERIR ESTE MES:
${creator.commissionClp > 0 ? `- Total en Pesos:   $${creator.commissionClp.toLocaleString('es-CL')} CLP\n` : ''}${creator.commissionUsd > 0 ? `- Total en Dolares: $${creator.commissionUsd.toFixed(2)} USD (PayPal)\n` : ''}
Administrador autorizado: jericesb5@gmail.com
==================================================
`.trim()

    navigator.clipboard.writeText(text)
    setCopiedCreatorCode(creator.code)
    setTimeout(() => setCopiedCreatorCode(null), 3000)
    showToast(`Liquidacion de ${creator.code} copiada al portapapeles.`)
  }

  // Handle Opening Creator Code CRUD Modal
  const handleOpenAssignCreatorModal = (creator = null) => {
    if (creator) {
      setEditingCreator(creator)
      setCreatorFormUsername(creator.creatorUsername || '')
      setCreatorFormCode(creator.code || '')
      setCreatorFormIsLifetime(Boolean(creator.isLifetime))
    } else {
      setEditingCreator(null)
      setCreatorFormUsername('')
      setCreatorFormCode('')
      setCreatorFormIsLifetime(true)
    }
    setCreatorFormError('')
    setIsCreatorModalOpen(true)
  }

  // Handle Saving Creator Code Assignment (Create or Edit)
  const handleSaveCreatorAssignment = async (e) => {
    e.preventDefault()
    if (!creatorFormUsername) {
      setCreatorFormError('Debes seleccionar un perfil registrado.')
      return
    }
    const cleanCode = creatorFormCode.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '').slice(0, 30)
    if (!cleanCode) {
      setCreatorFormError('Ingresa un código de creador válido (letras, números, guiones).')
      return
    }

    setIsSavingCreator(true)
    setCreatorFormError('')

    const adminToken = typeof window !== 'undefined' ? sessionStorage.getItem('mi_vitae_admin_token') : null

    try {
      const ok = await assignCreatorCodeInSupabase(creatorFormUsername, cleanCode, creatorFormIsLifetime, adminToken)
      if (ok) {
        showToast(`Código ${cleanCode} asignado exitosamente a @${creatorFormUsername}.`)
        setIsCreatorModalOpen(false)
        const refreshed = await fetchAllProfilesFromSupabase()
        if (refreshed && refreshed.length > 0) {
          setRemoteProfilesState(refreshed)
        }
      } else {
        setCreatorFormError('No se pudo guardar en Supabase. Verifica la conexión.')
      }
    } catch (err) {
      setCreatorFormError(err.message || 'Error al asignar código de creador.')
    } finally {
      setIsSavingCreator(false)
    }
  }

  // Handle Removing Creator Code Assignment
  const handleConfirmRemoveCreator = async () => {
    if (!confirmRemoveCreator) return
    const username = confirmRemoveCreator.creatorUsername
    const adminToken = typeof window !== 'undefined' ? sessionStorage.getItem('mi_vitae_admin_token') : null

    try {
      const ok = await removeCreatorCodeInSupabase(username, adminToken)
      if (ok) {
        showToast(`Código desvinculado de @${username}.`)
        setConfirmRemoveCreator(null)
        const refreshed = await fetchAllProfilesFromSupabase()
        if (refreshed && refreshed.length > 0) {
          setRemoteProfilesState(refreshed)
        }
      } else {
        showToast('No se pudo desvincular el código en Supabase.')
      }
    } catch (err) {
      showToast('Error al desvincular código de creador.')
    }
  }

  // Export creators report to CSV
  const handleExportCreatorsCSV = () => {
    const headers = [
      'Código Creador',
      'Ventas Chile (Flow.cl)',
      'Ventas Internacional (PayPal)',
      'Total Usuarios Pagados',
      'Recaudado CLP ($3.490 c/u)',
      'Recaudado USD ($3.99 c/u)',
      `Comisión a Pagar CLP ($${CREATOR_COMMISSION_CLP.toLocaleString('es-CL')} c/u)`,
      `Comisión a Pagar USD ($${CREATOR_COMMISSION_USD.toFixed(2)} c/u)`,
      'Fecha Liquidación'
    ]

    const dateStr = new Date().toISOString().split('T')[0]
    const rows = creatorsSummary.map((c) => [
      `"${c.code}"`,
      c.salesClp,
      c.salesUsd,
      c.salesClp + c.salesUsd,
      c.totalRevenueClp,
      c.totalRevenueUsd.toFixed(2),
      c.commissionClp,
      c.commissionUsd.toFixed(2),
      `"${dateStr}"`
    ])

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `mi_vitae_liquidacion_creadores_${dateStr}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    showToast('Liquidación de creadores descargada exitosamente en CSV.')
  }

  // Quick add demo profile
  const handleAddPreset = (preset) => {
    let targetUsername = preset.username
    let counter = 1
    while (profiles[targetUsername]) {
      targetUsername = `${preset.username}_${counter}`
      counter++
    }

    const newProfile = {
      ...preset,
      username: targetUsername,
      createdAt: new Date().toISOString().split('T')[0]
    }

    addProfile(newProfile)
    setIsModalOpen(false)
    showToast(`Nuevo perfil demo @${targetUsername} agregado con éxito.`)
  }

  if (isCheckingAuth) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-8 bg-slate-900 text-white">
        <RefreshCw className="w-6 h-6 animate-spin text-palette-primary" />
      </div>
    )
  }

  if (!isAdminAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950 text-white">
        <div className="max-w-md w-full p-5 sm:p-8 rounded-2xl sm:rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-6 animate-fadeIn">
          <div className="text-center space-y-2.5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white mx-auto flex items-center justify-center shadow-lg shadow-indigo-600/30">
              <Shield className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight">Super Admin</h2>
              <p className="text-xs text-slate-400 mt-2">
                Panel de control privado y liquidación de afiliados
              </p>
            </div>
          </div>

          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Usuario / Correo:
              </label>
              <input
                type="email"
                placeholder="username"
                value={adminEmailInput}
                onChange={(e) => { setAdminEmailInput(e.target.value); setAuthError('') }}
                className="w-full px-4 py-3 rounded-xl bg-slate-800/90 border border-slate-700 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all min-h-[44px]"
                autoComplete="email"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Contraseña:
              </label>
              <input
                type="password"
                placeholder="••••••••••••••••"
                value={adminPasswordInput}
                onChange={(e) => { setAdminPasswordInput(e.target.value); setAuthError('') }}
                className="w-full px-4 py-3 rounded-xl bg-slate-800/90 border border-slate-700 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all min-h-[44px]"
                autoComplete="current-password"
                required
              />
            </div>

            {authError && (
              <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs font-medium text-center">
                {authError}
              </div>
            )}

            <button
              type="submit"
              disabled={isVerifyingLogin}
              className="w-full min-h-[46px] py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 active:scale-[0.99] text-white font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-indigo-600/30 cursor-pointer flex items-center justify-center gap-2"
            >
              {isVerifyingLogin ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Verificando credenciales...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Acceder al Panel de Control</span>
                </>
              )}
            </button>
          </form>

          <div className="pt-2 border-t border-slate-800 text-center">
            <Link to="/" className="text-xs text-slate-400 hover:text-white transition-colors">
              Volver al inicio
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-20 transition-colors">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 z-50 flex items-center gap-3 px-4 py-3 bg-slate-900 text-white dark:bg-indigo-600 rounded-2xl shadow-xl border border-slate-700 animate-in fade-in slide-in-from-bottom-4 duration-200 max-w-[90vw] sm:max-w-md">
          <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="text-xs sm:text-sm font-semibold truncate">{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="ml-auto text-slate-400 hover:text-white shrink-0 p-1">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Super Admin Hero Header */}
      <div className="bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-white py-5 sm:py-8 px-4 sm:px-6 lg:px-8 border-b border-slate-800 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-4 sm:gap-6">
          
          {/* Brand & Connection Badge */}
          <div className="flex items-center justify-between lg:justify-start gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white shadow-lg shadow-indigo-500/20 shrink-0">
                <Shield className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight">Super Admin</h1>
                <p className="text-[11px] sm:text-xs text-slate-400">Control maestro y liquidación</p>
              </div>
            </div>

            {/* Live Database status indicator */}
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-800/90 text-slate-200 border border-slate-700/80 shrink-0">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="hidden xs:inline">{remoteProfiles.length > 0 ? 'Supabase Cloud' : 'Modo Local'}</span>
              <span className="xs:hidden">{remoteProfiles.length > 0 ? 'Cloud' : 'Local'}</span>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 sm:gap-2.5 w-full lg:w-auto">
            <button
              onClick={loadAdminData}
              disabled={isLoadingProfiles || isLoadingTransactions}
              className="min-h-[42px] px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 border border-slate-700 hover:border-slate-600 active:scale-[0.98] transition-all cursor-pointer"
              title="Recargar usuarios y transacciones en tiempo real desde Supabase"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingProfiles ? 'animate-spin text-indigo-400' : 'text-emerald-400'}`} />
              <span>Refrescar</span>
            </button>

            <button
              onClick={() => setIsModalOpen(true)}
              className="min-h-[42px] px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/20 active:scale-[0.98] transition-all cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>+ Perfil Demo</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="min-h-[42px] px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 border border-slate-700 hover:border-slate-600 active:scale-[0.98] transition-all cursor-pointer"
            >
              <FileDown className="w-3.5 h-3.5 text-emerald-400" />
              <span>Exportar CSV</span>
            </button>

            <Link
              to="/dashboard"
              className="min-h-[42px] px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 border border-slate-700 hover:border-slate-600 active:scale-[0.98] transition-all cursor-pointer"
              title="Ir al Studio de edición"
            >
              <ArrowRight className="w-3.5 h-3.5 text-indigo-400" />
              <span>Ir al Studio</span>
            </Link>

            <button
              onClick={handleAdminLogout}
              className="col-span-2 sm:col-span-1 min-h-[42px] px-3 py-2 rounded-xl bg-rose-950/50 hover:bg-rose-900/70 text-rose-300 text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 border border-rose-800/70 active:scale-[0.98] transition-all cursor-pointer"
              title="Cerrar sesión de administrador"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Cerrar Sesión</span>
            </button>
          </div>

        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 -mt-4 sm:-mt-6">

        {/* Navigation Tabs (Directorio, Analíticas, Feedbacks, Creadores) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 bg-white dark:bg-slate-900 p-2 sm:p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="grid grid-cols-2 md:flex md:flex-row md:items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={() => setActiveAdminTab('users')}
              className={`min-h-[44px] flex items-center justify-center md:justify-start gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeAdminTab === 'users'
                  ? 'bg-palette-primary text-white shadow-md shadow-palette-primary/25 scale-[1.01]'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Users className="w-4 h-4 shrink-0" />
              <span className="truncate">Directorio ({totalProfiles})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveAdminTab('analytics')}
              className={`min-h-[44px] flex items-center justify-center md:justify-start gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeAdminTab === 'analytics'
                  ? 'bg-palette-primary text-white shadow-md shadow-palette-primary/25 scale-[1.01]'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <TrendingUp className="w-4 h-4 text-cyan-400 shrink-0" />
              <span className="truncate">Analíticas</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveAdminTab('feedbacks')}
              className={`min-h-[44px] flex items-center justify-center md:justify-start gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeAdminTab === 'feedbacks'
                  ? 'bg-palette-primary text-white shadow-md shadow-palette-primary/25 scale-[1.01]'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <MessageSquare className="w-4 h-4 text-purple-400 shrink-0" />
              <span className="truncate">Feedbacks</span>
              {feedbackProfiles.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-purple-100 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300">
                  {feedbackProfiles.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveAdminTab('creators')}
              className={`min-h-[44px] flex items-center justify-center md:justify-start gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeAdminTab === 'creators'
                  ? 'bg-palette-primary text-white shadow-md shadow-palette-primary/25 scale-[1.01]'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Award className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="truncate">Creadores</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-black bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                {creatorsSummary.length}
              </span>
            </button>
          </div>

          <div className="flex items-center justify-center sm:justify-end gap-1.5 text-xs text-slate-500 dark:text-slate-400 px-2 py-1">
            <Calendar className="w-3.5 h-3.5 text-indigo-500" />
            <span>Corte mensual: <strong>Día 30</strong></span>
          </div>
        </div>

        {/* Tab 1: Portafolios y Directorio de Usuarios */}
        {activeAdminTab === 'users' && (
          <div>
            {/* KPI Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-2.5 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
              
              {/* Card 1: Portafolios Totales */}
              <div className="bg-white dark:bg-slate-900 p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800/80 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition-colors pointer-events-none" />
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">Portafolios</span>
                  <div className="p-2 rounded-xl sm:rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 shrink-0">
                    <Users className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                </div>
                <div className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 dark:text-white">
                  {totalProfiles}
                </div>
                <div className="flex items-center gap-1 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/60 text-[11px] sm:text-xs text-emerald-600 dark:text-emerald-400 font-semibold truncate">
                  <TrendingUp className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                  <span>+{newProfilesThisWeek} esta semana</span>
                </div>
              </div>

              {/* Card 2: Suscripciones Activas */}
              <div className="bg-white dark:bg-slate-900 p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800/80 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-colors pointer-events-none" />
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">Suscripciones</span>
                  <div className="p-2 rounded-xl sm:rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 shrink-0">
                    <UserCheck className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                </div>
                <div className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 dark:text-white">
                  {activePremiumProfiles}
                </div>
                <div className="flex items-center gap-1 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/60 text-[11px] sm:text-xs text-emerald-600 dark:text-emerald-400 font-semibold truncate">
                  <TrendingUp className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                  <span>De pago recurrente</span>
                </div>
              </div>

              {/* Card 3: MRR Proyectado */}
              <div className="bg-white dark:bg-slate-900 p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800/80 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl group-hover:bg-purple-500/10 transition-colors pointer-events-none" />
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">MRR Proyectado</span>
                  <div className="p-2 rounded-xl sm:rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 shrink-0">
                    <DollarSign className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                </div>
                <div className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 dark:text-white">
                  ${projectedMrr.toLocaleString('es-CL')} <span className="text-[11px] font-bold text-slate-500">CLP</span>
                </div>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/60 text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium">
                  <span>ARR: ${(projectedArr / 1000).toFixed(0)}k</span>
                  <span className="font-semibold text-purple-600 dark:text-purple-400">$3.490/u</span>
                </div>
              </div>

              {/* Card 4: Tráfico Global & Conversión */}
              <div className="bg-white dark:bg-slate-900 p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800/80 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-2xl group-hover:bg-cyan-500/10 transition-colors pointer-events-none" />
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">Tráfico & CR</span>
                  <div className="p-2 rounded-xl sm:rounded-2xl bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 shrink-0">
                    <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                </div>
                <div className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 dark:text-white">
                  {totalViews.toLocaleString()} <span className="text-[11px] font-bold text-slate-500">visitas</span>
                </div>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/60 text-[11px] sm:text-xs font-semibold">
                  <span className="text-cyan-600 dark:text-cyan-400 flex items-center gap-1">
                    <MousePointerClick className="w-3 h-3" />
                    {totalClicks}
                  </span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                    {globalConversionRate}% CR
                  </span>
                </div>
              </div>

              {/* Card 5: Temas Populares */}
              <div className="col-span-2 sm:col-span-2 lg:col-span-1 xl:col-span-1 bg-white dark:bg-slate-900 p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800/80 shadow-sm hover:shadow-md transition-shadow relative group">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Temas Principales</span>
                  <div className="p-2 rounded-xl sm:rounded-2xl bg-fuchsia-50 dark:bg-fuchsia-950/60 text-fuchsia-600 dark:text-fuchsia-400 shrink-0">
                    <Palette className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                </div>

                <div className="space-y-1.5 flex flex-col justify-center">
                  {topThemes.slice(0, 2).map(([themeKey, count], idx) => {
                    const themeObj = getThemeMeta(themeKey)
                    const pct = totalProfiles > 0 ? Math.round((count / totalProfiles) * 100) : 0
                    return (
                      <div key={themeKey} className="flex items-center justify-between text-xs gap-1.5">
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded-lg text-[10px] sm:text-[11px] font-bold border truncate max-w-[120px] ${themeObj.color}`}>
                          {idx + 1}. {themeObj.name}
                        </span>
                        <span className="font-mono text-slate-500 dark:text-slate-400 text-[10px] sm:text-[11px] shrink-0 font-semibold">
                          {count} ({pct}%)
                        </span>
                      </div>
                    )
                  })}
                </div>

                <button
                  type="button"
                  onClick={() => setIsThemeBreakdownOpen(true)}
                  className="flex items-center justify-between w-full mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/60 text-[11px] text-slate-500 dark:text-slate-400 font-medium hover:text-fuchsia-600 transition-colors cursor-pointer text-left"
                >
                  <span>{topThemes.length} temas</span>
                  <span className="text-fuchsia-600 dark:text-fuchsia-400 font-bold hover:underline">
                    Ver todos
                  </span>
                </button>
              </div>

            </div>

            {/* Filters & Search Control Bar */}
            <div className="bg-white dark:bg-slate-900 p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm mb-6 space-y-3">
              <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
                
                {/* Search input */}
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar por nombre, @username, cargo o email..."
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/80 rounded-xl sm:rounded-2xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all min-h-[42px]"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Filter pills and selects */}
                <div className="flex flex-wrap items-center gap-2">
                  
                  {/* Status Filter Horizontal Pills */}
                  <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-700/60 overflow-x-auto max-w-full">
                    <button
                      onClick={() => setStatusFilter('all')}
                      className={`min-h-[32px] px-2.5 py-1 rounded-lg text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
                        statusFilter === 'all'
                          ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                    >
                      Todos ({totalProfiles})
                    </button>
                    {lifetimeProfiles > 0 && (
                      <button
                        onClick={() => setStatusFilter('lifetime')}
                        className={`min-h-[32px] px-2.5 py-1 rounded-lg text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
                          statusFilter === 'lifetime'
                            ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs font-black'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                        }`}
                      >
                        De por vida ({lifetimeProfiles})
                      </button>
                    )}
                    <button
                      onClick={() => setStatusFilter('premium')}
                      className={`min-h-[32px] px-2.5 py-1 rounded-lg text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
                        statusFilter === 'premium'
                          ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                    >
                      Suscripción ({activePremiumProfiles})
                    </button>
                    <button
                      onClick={() => setStatusFilter('trial')}
                      className={`min-h-[32px] px-2.5 py-1 rounded-lg text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
                        statusFilter === 'trial'
                          ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                    >
                      Prueba ({trialProfiles})
                    </button>
                    <button
                      onClick={() => setStatusFilter('inactive')}
                      className={`min-h-[32px] px-2.5 py-1 rounded-lg text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
                        statusFilter === 'inactive'
                          ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                    >
                      Inactivos ({inactiveProfiles})
                    </button>
                  </div>

                  {/* Sort selector */}
                  <div className="flex items-center gap-1.5">
                    <select
                      value={`${sortField}_${sortOrder}`}
                      onChange={(e) => {
                        const [f, o] = e.target.value.split('_')
                        setSortField(f)
                        setSortOrder(o)
                      }}
                      className="min-h-[38px] px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                    >
                      <option value="createdAt_desc">Más Recientes</option>
                      <option value="views_desc">Mayor Tráfico (Visitas)</option>
                      <option value="views_asc">Menor Tráfico</option>
                      <option value="clicks_desc">Más Clics Contacto</option>
                      <option value="name_asc">Nombre (A-Z)</option>
                    </select>
                  </div>

                  {/* Clear filters button */}
                  {(searchTerm || statusFilter !== 'all') && (
                    <button
                      onClick={() => {
                        setSearchTerm('')
                        setStatusFilter('all')
                      }}
                      className="min-h-[38px] px-3 py-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-xl transition-colors cursor-pointer"
                    >
                      Limpiar
                    </button>
                  )}

                </div>

              </div>
            </div>

            {/* User Profiles Container */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
              
              <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-slate-50/50 dark:bg-slate-900/50">
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">Portafolios Registrados</h2>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                    {filteredProfiles.length}
                  </span>
                </div>
                
                <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">
                  Modifica suscripciones en vivo cambiando el <strong className="text-slate-700 dark:text-slate-300">Plan</strong>.
                </p>
              </div>

              {filteredProfiles.length === 0 ? (
                <div className="p-8 sm:p-12 text-center">
                  <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3 text-slate-400">
                    <Search className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">No se encontraron portafolios</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-4">
                    No hay usuarios que coincidan con la búsqueda o filtro.
                  </p>
                  <button
                    onClick={() => {
                      setSearchTerm('')
                      setStatusFilter('all')
                    }}
                    className="min-h-[40px] px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-500 transition-colors cursor-pointer"
                  >
                    Restablecer Filtros
                  </button>
                </div>
              ) : (
                <>
                  {/* MOBILE CARDS VIEW (md:hidden) */}
                  <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
                    {paginatedProfiles.map((p) => {
                      const views = p.analytics?.views || 0
                      const clicks = p.analytics?.contactClicks || 0
                      const conversionRate = views > 0 ? ((clicks / views) * 100).toFixed(1) : '0.0'
                      const themeObj = getThemeMeta(p.theme || 'minimalist')
                      const hasCustomAvatar = Boolean(
                        p.personalInfo?.avatar &&
                        p.personalInfo.avatar !== 'blobatar' &&
                        p.personalInfo.avatar.trim() !== ''
                      )

                      return (
                        <div key={p.username} className="p-4 space-y-3 hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                          
                          {/* User Header */}
                          <div className="flex items-start justify-between gap-2.5">
                            <div className="flex items-center gap-3 min-w-0">
                              {hasCustomAvatar ? (
                                <img
                                  src={p.personalInfo.avatar}
                                  alt={p.personalInfo?.name || p.username}
                                  className="w-11 h-11 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shadow-xs shrink-0"
                                />
                              ) : (
                                <div className="w-11 h-11 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-xs shrink-0 flex items-center justify-center bg-slate-100 dark:bg-slate-800">
                                  <Blobatar
                                    name="Sambi"
                                    size={44}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              )}
                              <div className="min-w-0">
                                <div className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1 truncate">
                                  <span className="truncate">{p.personalInfo?.name || p.username}</span>
                                  {p.personalInfo?.availableForWork && (
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" title="Disponible para trabajar" />
                                  )}
                                </div>
                                <div className="text-xs text-indigo-600 dark:text-indigo-400 font-mono font-bold mt-0.5 truncate">
                                  /{p.username}
                                </div>
                                {p.personalInfo?.title && (
                                  <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                                    {p.personalInfo.title}
                                  </div>
                                )}
                              </div>
                            </div>

                            <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-bold border shrink-0 ${themeObj.color}`}>
                              {themeObj.name}
                            </span>
                          </div>

                          {/* Plan Selector */}
                          <div className="flex items-center justify-between gap-2 pt-1">
                            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider shrink-0">
                              Plan:
                            </span>
                            <div className="relative flex-1 max-w-[220px]">
                              <select
                                value={p.plan}
                                onChange={(e) => handlePlanChange(p.username, e.target.value)}
                                className={`w-full appearance-none text-xs font-extrabold px-3 py-2 pr-7 rounded-xl border transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[38px] ${
                                  p.plan === 'lifetime'
                                    ? 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-700'
                                    : p.plan === 'premium'
                                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                                    : p.plan === 'trial'
                                    ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                                    : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                                }`}
                              >
                                <option value="lifetime">De por vida</option>
                                <option value="premium">Suscripción ($3.490)</option>
                                <option value="trial">1er Mes Gratis</option>
                                <option value="inactive">Inactivo</option>
                              </select>
                              <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-60" />
                            </div>
                          </div>

                          {/* Quick Stats Grid */}
                          <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-center">
                            <div>
                              <div className="text-[10px] uppercase font-bold text-slate-400">Visitas</div>
                              <div className="font-extrabold text-xs text-slate-800 dark:text-slate-200">{views.toLocaleString()}</div>
                            </div>
                            <div>
                              <div className="text-[10px] uppercase font-bold text-slate-400">Clics WA</div>
                              <div className="font-bold text-xs text-emerald-600 dark:text-emerald-400">{clicks.toLocaleString()}</div>
                            </div>
                            <div>
                              <div className="text-[10px] uppercase font-bold text-slate-400">Conversión</div>
                              <div className="font-extrabold text-xs text-slate-900 dark:text-white">{conversionRate}%</div>
                            </div>
                          </div>

                          {/* Action Toolbar */}
                          <div className="flex items-center gap-1.5 pt-1">
                            <Link
                              to={`/${p.username}`}
                              target="_blank"
                              className="flex-1 min-h-[38px] px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center justify-center gap-1 transition-colors"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              <span>Ver</span>
                            </Link>

                            <button
                              onClick={() => handleEdit(p.username)}
                              className="flex-1 min-h-[38px] px-2.5 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-600 dark:text-indigo-400 text-xs font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>Studio</span>
                            </button>

                            <button
                              onClick={() => handleOpenAssignCreatorModal({ creatorUsername: p.username, code: p.creatorCode || '' })}
                              className="min-h-[38px] px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                              title="Asignar código de creador"
                            >
                              <Tag className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => setConfirmDeleteUser(p.username)}
                              className="min-h-[38px] px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                              title="Eliminar usuario"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                        </div>
                      )
                    })}
                  </div>

                  {/* DESKTOP TABLE VIEW (hidden md:block) */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left text-xs sm:text-sm">
                      <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
                        <tr>
                          <th className="py-4 px-6">Usuario & Perfil</th>
                          <th className="py-4 px-4">Plan / Estado</th>
                          <th className="py-4 px-4">Tema</th>
                          <th className="py-4 px-4 text-center">Visitas</th>
                          <th className="py-4 px-4 text-center">Clics WA / Contacto</th>
                          <th className="py-4 px-4 text-center">Conversión</th>
                          <th className="py-4 px-6 text-right">Acciones</th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80 font-medium">
                        {paginatedProfiles.map((p) => {
                          const views = p.analytics?.views || 0
                          const clicks = p.analytics?.contactClicks || 0
                          const conversionRate = views > 0 ? ((clicks / views) * 100).toFixed(1) : '0.0'
                          const themeObj = getThemeMeta(p.theme || 'minimalist')
                          const hasCustomAvatar = Boolean(
                            p.personalInfo?.avatar &&
                            p.personalInfo.avatar !== 'blobatar' &&
                            p.personalInfo.avatar.trim() !== ''
                          )

                          return (
                            <tr 
                              key={p.username} 
                              className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group"
                            >
                              {/* Profile Info */}
                              <td className="py-4 px-6">
                                <div className="flex items-center gap-3.5">
                                  {hasCustomAvatar ? (
                                    <img
                                      src={p.personalInfo.avatar}
                                      alt={p.personalInfo?.name || p.username}
                                      className="w-11 h-11 rounded-2xl object-cover border border-slate-200 dark:border-slate-700 shadow-sm shrink-0"
                                    />
                                  ) : (
                                    <div className="w-11 h-11 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm shrink-0 flex items-center justify-center bg-slate-100 dark:bg-slate-800">
                                      <Blobatar
                                        name="Sambi"
                                        size={44}
                                        className="w-full h-full object-cover"
                                      />
                                    </div>
                                  )}
                                  <div className="min-w-0">
                                    <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 truncate">
                                      <span>{p.personalInfo?.name || p.username}</span>
                                      {p.personalInfo?.availableForWork && (
                                        <span className="w-2 h-2 rounded-full bg-emerald-500" title="Disponible para trabajar" />
                                      )}
                                    </div>
                                    <div className="text-xs text-indigo-600 dark:text-indigo-400 font-mono font-bold mt-0.5">
                                      /{p.username}
                                    </div>
                                  </div>
                                </div>
                              </td>

                              {/* Plan & Status Dropdown Selector */}
                              <td className="py-4 px-4">
                                <div className="relative inline-block">
                                  <select
                                    value={p.plan}
                                    onChange={(e) => handlePlanChange(p.username, e.target.value)}
                                    className={`appearance-none text-xs font-extrabold px-3 py-1.5 pr-7 rounded-xl border transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                                      p.plan === 'lifetime'
                                        ? 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-700 hover:bg-indigo-100'
                                        : p.plan === 'premium'
                                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100'
                                        : p.plan === 'trial'
                                        ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800 hover:bg-amber-100'
                                        : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800 hover:bg-rose-100'
                                    }`}
                                  >
                                    <option value="lifetime">De por vida</option>
                                    <option value="premium">Suscripción ($3.490)</option>
                                    <option value="trial">1er Mes Gratis</option>
                                    <option value="inactive">Inactivo</option>
                                  </select>
                                  <ChevronDown className="w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-60" />
                                </div>
                              </td>

                              {/* Theme Badge */}
                              <td className="py-4 px-4">
                                <span className={`inline-flex items-center px-2.5 py-1 rounded-xl text-xs font-bold border ${themeObj.color}`}>
                                  {themeObj.name}
                                </span>
                              </td>

                              {/* Analytics: Views */}
                              <td className="py-4 px-4 text-center">
                                <span className="font-extrabold text-slate-800 dark:text-slate-200">
                                  {views.toLocaleString()}
                                </span>
                              </td>

                              {/* Analytics: Contact Clicks */}
                              <td className="py-4 px-4 text-center">
                                <span className="font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-1 rounded-lg">
                                  {clicks.toLocaleString()}
                                </span>
                              </td>

                              {/* Conversion Rate */}
                              <td className="py-4 px-4 text-center">
                                <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                                  {conversionRate}%
                                </span>
                              </td>

                              {/* Actions */}
                              <td className="py-4 px-6 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <Link
                                    to={`/${p.username}`}
                                    target="_blank"
                                    title="Ver portafolio público"
                                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
                                  >
                                    <ExternalLink className="w-3.5 h-3.5" />
                                  </Link>

                                  <button
                                    onClick={() => handleEdit(p.username)}
                                    title="Editar en Studio"
                                    className="p-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/80 text-indigo-600 dark:text-indigo-400 transition-colors cursor-pointer"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>

                                  <button
                                    onClick={() => handleOpenAssignCreatorModal({ creatorUsername: p.username, code: p.creatorCode || '' })}
                                    title="Asignar código de creador"
                                    className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 transition-colors cursor-pointer"
                                  >
                                    <Tag className="w-3.5 h-3.5" />
                                  </button>

                                  <button
                                    onClick={() => setConfirmDeleteUser(p.username)}
                                    title="Eliminar usuario"
                                    className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 transition-colors cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {/* Table Footer Summary & Pagination */}
              <div className="p-3.5 sm:p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400 font-medium">
                <div>
                  Mostrando del <strong className="text-slate-800 dark:text-slate-200">{filteredProfiles.length === 0 ? 0 : (currentPage - 1) * USERS_PER_PAGE + 1}</strong> al <strong className="text-slate-800 dark:text-slate-200">{Math.min(currentPage * USERS_PER_PAGE, filteredProfiles.length)}</strong> de <strong className="text-slate-800 dark:text-slate-200">{filteredProfiles.length}</strong> portafolios.
                </div>

                {/* Pagination Controls */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="min-h-[38px] px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>Anterior</span>
                  </button>

                  {/* Desktop Page Numbers */}
                  <div className="hidden sm:flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                      if (
                        totalPages > 6 &&
                        pageNum !== 1 &&
                        pageNum !== totalPages &&
                        Math.abs(pageNum - currentPage) > 1
                      ) {
                        if (pageNum === 2 || pageNum === totalPages - 1) {
                          return <span key={pageNum} className="px-1 text-slate-400 font-bold">...</span>
                        }
                        return null
                      }

                      return (
                        <button
                          key={pageNum}
                          type="button"
                          onClick={() => setCurrentPage(pageNum)}
                          className={`w-8 h-8 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            currentPage === pageNum
                              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 scale-105'
                              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                        >
                          {pageNum}
                        </button>
                      )
                    })}
                  </div>

                  {/* Mobile Page Indicator */}
                  <div className="sm:hidden font-mono font-bold text-xs text-slate-700 dark:text-slate-300 px-2">
                    {currentPage} / {totalPages}
                  </div>

                  <button
                    type="button"
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="min-h-[38px] px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <span>Siguiente</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="hidden lg:flex items-center gap-4">
                  <span>MRR: <strong className="text-emerald-600 dark:text-emerald-400 font-bold">${projectedMrr.toLocaleString('es-CL')} CLP</strong></span>
                  <span>•</span>
                  <span>Tráfico: <strong className="text-slate-800 dark:text-slate-200 font-bold">{totalViews.toLocaleString()} visitas</strong></span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Analíticas & Embudos */}
        {activeAdminTab === 'analytics' && (
          <div className="space-y-6 animate-fadeIn">
            
            {/* Funnel Metrics Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 lg:gap-6">
              <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Paso 1: Visitas Totales
                </span>
                <div className="text-xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono">
                  {totalViews.toLocaleString()}
                </div>
                <div className="text-[11px] text-slate-500 mt-2 font-medium">
                  Tráfico acumulado (Base 100%)
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <span className="text-[10px] sm:text-xs font-bold text-cyan-500 uppercase tracking-wider block mb-1">
                  Paso 2: Clics Contacto
                </span>
                <div className="text-xl sm:text-3xl font-black text-cyan-600 dark:text-cyan-400 font-mono">
                  {totalClicks.toLocaleString()}
                </div>
                <div className="text-[11px] text-slate-500 mt-2 font-medium">
                  {totalViews > 0 ? ((totalClicks / totalViews) * 100).toFixed(1) : 0}% de los visitantes
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <span className="text-[10px] sm:text-xs font-bold text-purple-500 uppercase tracking-wider block mb-1">
                  Paso 3: QR & Descargas
                </span>
                <div className="text-xl sm:text-3xl font-black text-purple-600 dark:text-purple-400 font-mono">
                  {totalDownloads.toLocaleString()}
                </div>
                <div className="text-[11px] text-slate-500 mt-2 font-medium">
                  {totalViews > 0 ? ((totalDownloads / totalViews) * 100).toFixed(1) : 0}% de interacción profunda
                </div>
              </div>

              <div className="bg-gradient-to-br from-indigo-600 to-violet-700 text-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-lg shadow-indigo-600/20">
                <span className="text-[10px] sm:text-xs font-bold text-indigo-200 uppercase tracking-wider block mb-1">
                  Paso 4: Suscriptores
                </span>
                <div className="text-xl sm:text-3xl font-black text-white font-mono">
                  {activePremiumProfiles}
                </div>
                <div className="text-[11px] text-indigo-100 mt-2 font-medium">
                  MRR: ${projectedMrr.toLocaleString('es-CL')} CLP/mes
                </div>
              </div>
            </div>

            {/* Visual Conversion Funnel Card */}
            <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">Embudo de Conversión Global</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Eficiencia desde visita inicial hasta conversión activa</p>
                </div>
                <span className="px-3 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 font-bold text-xs">
                  {globalConversionRate}% CR Global
                </span>
              </div>

              <div className="space-y-3 pt-2">
                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-slate-700 dark:text-slate-300">1. Visitas a Portafolios Públicos</span>
                    <span className="font-mono text-slate-500">{totalViews.toLocaleString()} (100%)</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden">
                    <div className="bg-indigo-600 h-full rounded-full w-full" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-slate-700 dark:text-slate-300">2. Clics en Botones de Contacto (WhatsApp, LinkedIn, Email)</span>
                    <span className="font-mono text-cyan-600 dark:text-cyan-400">
                      {totalClicks.toLocaleString()} ({totalViews > 0 ? ((totalClicks / totalViews) * 100).toFixed(1) : 0}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden">
                    <div 
                      className="bg-cyan-500 h-full rounded-full transition-all"
                      style={{ width: `${Math.min(100, totalViews > 0 ? (totalClicks / totalViews) * 100 : 0)}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-slate-700 dark:text-slate-300">3. Escaneos de Tarjeta QR / Descarga de CV</span>
                    <span className="font-mono text-purple-600 dark:text-purple-400">
                      {totalDownloads.toLocaleString()} ({totalViews > 0 ? ((totalDownloads / totalViews) * 100).toFixed(1) : 0}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden">
                    <div 
                      className="bg-purple-500 h-full rounded-full transition-all"
                      style={{ width: `${Math.min(100, totalViews > 0 ? (totalDownloads / totalViews) * 100 : 0)}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-slate-700 dark:text-slate-300">4. Suscriptores con Pago Mensual Activo</span>
                    <span className="font-mono text-emerald-600 dark:text-emerald-400">
                      {activePremiumProfiles} ({totalProfiles > 0 ? ((activePremiumProfiles / totalProfiles) * 100).toFixed(1) : 0}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden">
                    <div 
                      className="bg-emerald-500 h-full rounded-full transition-all"
                      style={{ width: `${Math.min(100, totalProfiles > 0 ? (activePremiumProfiles / totalProfiles) * 100 : 0)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Themes Breakdown Card */}
            <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">Adopción de Temas y Diseños</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Distribución de los {topThemes.length} temas oficiales</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {topThemes.map(([themeKey, count], idx) => {
                  const meta = getThemeMeta(themeKey)
                  const pct = totalProfiles > 0 ? Math.round((count / totalProfiles) * 100) : 0
                  return (
                    <div 
                      key={themeKey}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-mono text-xs font-bold text-slate-400 w-4">{idx + 1}.</span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-bold border truncate ${meta.color}`}>
                          {meta.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="w-16 bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden hidden xs:block">
                          <div className="bg-fuchsia-500 h-full rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="font-mono font-bold text-xs text-slate-800 dark:text-slate-200">
                          {count} ({pct}%)
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

          </div>
        )}

        {/* Tab 3: Feedbacks & Encuestas */}
        {activeAdminTab === 'feedbacks' && (
          <div className="space-y-6 animate-fadeIn">
            
            {/* Feedbacks Header Card */}
            <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-purple-500" />
                  <span>Feedbacks de Usuarios Registrados</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Respuestas de la encuesta de onboarding al activar el primer mes gratis
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs font-bold">
                <span className="px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                  {feedbackProfiles.length} Respuestas
                </span>
              </div>
            </div>

            {feedbackProfiles.length === 0 ? (
              <div className="p-8 sm:p-12 text-center bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3 text-slate-400">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">Sin feedbacks directos aún</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                  Aparecerán aquí cuando los usuarios completen la encuesta de registro al ingresar su código de creador o activar su prueba.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {feedbackProfiles.map((fb, idx) => (
                  <div 
                    key={idx}
                    className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-bold text-sm text-slate-900 dark:text-white">
                          {fb.name}
                        </div>
                        <div className="text-xs text-indigo-600 dark:text-indigo-400 font-mono font-bold">
                          @{fb.username} • <span className="text-slate-400 font-normal">{fb.area}</span>
                        </div>
                      </div>

                      {/* Rating stars */}
                      <div className="flex items-center gap-0.5 text-amber-400 shrink-0">
                        {Array.from({ length: 5 }).map((_, s) => (
                          <Star 
                            key={s} 
                            className={`w-3.5 h-3.5 ${s < fb.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-slate-700'}`} 
                          />
                        ))}
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300">
                      <div className="font-bold text-slate-500 dark:text-slate-400 text-[10px] uppercase mb-1">
                        Obstáculo Reportado en CV:
                      </div>
                      <div className="font-medium text-slate-900 dark:text-white">
                        {fb.obstacle}
                      </div>
                    </div>

                    {fb.notes && (
                      <p className="text-xs text-slate-600 dark:text-slate-400 italic">
                        "{fb.notes}"
                      </p>
                    )}

                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <span>Origen: <strong className="text-slate-600 dark:text-slate-300 font-bold">{fb.source}</strong></span>
                      <span>{new Date(fb.date).toLocaleDateString('es-CL')}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>
        )}

        {/* Tab 4: Afiliados y Creadores ("Apoya a un creador") */}
        {activeAdminTab === 'creators' && (
          <div className="space-y-6 animate-fadeIn">
            
            {/* 1. Official Commission Rules Banner */}
            <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-gradient-to-r from-indigo-900/90 via-slate-900 to-slate-900 border border-indigo-500/30 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 sm:gap-5">
              <div className="flex items-start gap-3.5">
                <div className="p-3 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 shrink-0">
                  <Award className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm sm:text-base font-bold text-white">Liquidación Oficial para Creadores</h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Corte: Día 30
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    Comisiones fijas acordadas por cada usuario que pague su plan:
                  </p>
                  <div className="flex flex-wrap items-center gap-2 mt-2 text-xs">
                    <span className="px-2.5 py-1 rounded-xl bg-slate-800 border border-slate-700 flex items-center gap-1.5 font-bold text-slate-200">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0"></span>
                      <span>Chile (Flow):</span> <strong className="text-emerald-400 font-mono">${CREATOR_COMMISSION_CLP.toLocaleString('es-CL')} CLP</strong>
                    </span>
                    <span className="px-2.5 py-1 rounded-xl bg-slate-800 border border-slate-700 flex items-center gap-1.5 font-bold text-slate-200">
                      <Globe className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span>Internacional (PayPal):</span> <strong className="text-cyan-400 font-mono">${CREATOR_COMMISSION_USD.toFixed(2)} USD</strong>
                    </span>
                  </div>
                </div>
              </div>

              <div className="shrink-0 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto">
                <button
                  type="button"
                  onClick={() => handleOpenAssignCreatorModal()}
                  className="min-h-[42px] px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Asignar Creador</span>
                </button>
                <button
                  type="button"
                  onClick={handleExportCreatorsCSV}
                  className="min-h-[42px] px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
                >
                  <FileDown className="w-4 h-4 text-emerald-300" />
                  <span>Exportar CSV</span>
                </button>
              </div>
            </div>

            {/* 2. Creators KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 lg:gap-6">
              
              {/* Card 1: Creadores Activos */}
              <div className="bg-white dark:bg-slate-900 p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800/80 shadow-sm relative overflow-hidden">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">Creadores</span>
                  <div className="p-2 rounded-xl sm:rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 shrink-0">
                    <Users className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                </div>
                <div className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 dark:text-white">
                  {creatorsSummary.length}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate">
                  Códigos únicos con ventas
                </div>
              </div>

              {/* Card 2: Total Usuarios Convertidos */}
              <div className="bg-white dark:bg-slate-900 p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800/80 shadow-sm relative overflow-hidden">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">Convertidos</span>
                  <div className="p-2 rounded-xl sm:rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 shrink-0">
                    <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                </div>
                <div className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 dark:text-white">
                  {totalCreatorSalesClp + totalCreatorSalesUsd}
                </div>
                <div className="flex items-center gap-1.5 mt-1 text-[11px] font-semibold text-slate-500 truncate">
                  <span className="text-emerald-600 dark:text-emerald-400">{totalCreatorSalesClp} Flow</span>
                  <span>•</span>
                  <span className="text-cyan-600 dark:text-cyan-400">{totalCreatorSalesUsd} PayPal</span>
                </div>
              </div>

              {/* Card 3: Total Recaudado Bruto */}
              <div className="bg-white dark:bg-slate-900 p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800/80 shadow-sm relative overflow-hidden">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">Recaudado</span>
                  <div className="p-2 rounded-xl sm:rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 shrink-0">
                    <DollarSign className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                </div>
                <div className="text-lg sm:text-xl font-black text-slate-900 dark:text-white truncate">
                  ${totalCreatorRevenueClp.toLocaleString('es-CL')} CLP
                </div>
                <div className="text-[11px] font-bold text-cyan-600 dark:text-cyan-400 mt-1">
                  + ${totalCreatorRevenueUsd.toFixed(2)} USD
                </div>
              </div>

              {/* Card 4: Total a Transferir el 30 */}
              <div className="col-span-2 lg:col-span-1 bg-gradient-to-br from-emerald-600 to-teal-700 text-white p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl shadow-lg shadow-emerald-600/20 relative overflow-hidden">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-emerald-100">A Transferir (Día 30)</span>
                  <div className="p-2 rounded-xl bg-white/20 text-white shrink-0">
                    <Receipt className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-xl sm:text-2xl font-black text-white">
                  ${totalCreatorCommissionClp.toLocaleString('es-CL')} CLP
                </div>
                <div className="text-xs sm:text-sm font-bold text-emerald-100 mt-0.5">
                  + ${totalCreatorCommissionUsd.toFixed(2)} USD
                </div>
              </div>

            </div>

            {/* 3. Search and Content Container */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              
              <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-950/50">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={creatorSearch}
                    onChange={(e) => setCreatorSearch(e.target.value)}
                    placeholder="Filtrar por código de creador..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 uppercase min-h-[42px]"
                  />
                </div>

                <div className="text-xs text-slate-500 dark:text-slate-400 font-medium sm:text-right">
                  Mostrando {filteredCreators.length} de {creatorsSummary.length} creadores
                </div>
              </div>

              {filteredCreators.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-500 dark:text-slate-400">
                  No se encontraron creadores con ventas registradas.
                </div>
              ) : (
                <>
                  {/* MOBILE CREATOR CARDS VIEW (md:hidden) */}
                  <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredCreators.map((creator) => {
                      const totalUsers = creator.salesClp + creator.salesUsd
                      return (
                        <div key={creator.code} className="p-4 space-y-3 hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-black text-xs text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/70 px-2.5 py-1 rounded-xl border border-indigo-200 dark:border-indigo-800/70">
                                  {creator.code}
                                </span>
                                {creator.isOfficial && (
                                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-300 dark:border-emerald-700">
                                    Oficial
                                  </span>
                                )}
                              </div>
                              {creator.creatorName && (
                                <div className="text-xs font-bold text-slate-900 dark:text-white mt-1">
                                  {creator.creatorName} {creator.creatorUsername && <span className="text-slate-400 font-normal">(@{creator.creatorUsername})</span>}
                                </div>
                              )}
                            </div>

                            <div className="text-right shrink-0">
                              <div className="text-[10px] uppercase font-bold text-slate-400">Total Usuarios</div>
                              <div className="font-black text-sm text-slate-900 dark:text-white font-mono">{totalUsers}</div>
                            </div>
                          </div>

                          {/* Commission highlight box */}
                          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-800 flex items-center justify-between">
                            <div>
                              <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider block">
                                A Transferir (Día 30)
                              </span>
                              <div className="font-mono font-black text-sm text-emerald-700 dark:text-emerald-300">
                                ${creator.commissionClp.toLocaleString('es-CL')} CLP
                                {creator.commissionUsd > 0 && ` + $${creator.commissionUsd.toFixed(2)} USD`}
                              </div>
                            </div>

                            <div className="text-right text-[11px] text-slate-500 font-mono">
                              <div>Flow: {creator.salesClp}</div>
                              <div>PayPal: {creator.salesUsd}</div>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="grid grid-cols-2 gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => handleCopyCreatorSettlement(creator)}
                              className="min-h-[40px] px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1 transition-all cursor-pointer shadow-xs"
                            >
                              {copiedCreatorCode === creator.code ? (
                                <>
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Copiado</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5" />
                                  <span>Copiar Pago</span>
                                </>
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={() => setSelectedCreatorDetails(creator)}
                              className="min-h-[40px] px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center justify-center gap-1 transition-colors cursor-pointer"
                            >
                              <span>Detalle ({creator.transactions.length})</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleOpenAssignCreatorModal(creator)}
                              className="min-h-[40px] px-2.5 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 font-bold text-xs border border-indigo-200 dark:border-indigo-800 flex items-center justify-center gap-1 transition-colors cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>{creator.creatorUsername ? 'Editar' : 'Vincular'}</span>
                            </button>

                            {creator.creatorUsername ? (
                              <button
                                type="button"
                                onClick={() => setConfirmRemoveCreator(creator)}
                                className="min-h-[40px] px-2.5 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 text-rose-700 dark:text-rose-300 font-bold text-xs border border-rose-200 dark:border-rose-800 flex items-center justify-center gap-1 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Desvincular</span>
                              </button>
                            ) : (
                              <div />
                            )}
                          </div>

                        </div>
                      )
                    })}
                  </div>

                  {/* DESKTOP CREATOR TABLE VIEW (hidden md:block) */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] uppercase tracking-wider font-extrabold text-slate-500 dark:text-slate-400 bg-slate-100/60 dark:bg-slate-800/50">
                          <th className="py-3.5 px-5">Código de Creador</th>
                          <th className="py-3.5 px-4 text-center">Ventas Flow (Chile)</th>
                          <th className="py-3.5 px-4 text-center">Ventas PayPal (Global)</th>
                          <th className="py-3.5 px-4 text-center">Total Compradores</th>
                          <th className="py-3.5 px-4 text-right">Recaudado Bruto</th>
                          <th className="py-3.5 px-5 text-right font-black text-emerald-600 dark:text-emerald-400">
                            A Transferir (Día 30)
                          </th>
                          <th className="py-3.5 px-5 text-center">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                        {filteredCreators.map((creator) => {
                          const totalUsers = creator.salesClp + creator.salesUsd
                          return (
                            <tr key={creator.code} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                              <td className="py-4 px-5">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono font-black text-xs text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/70 px-2.5 py-1 rounded-xl border border-indigo-200 dark:border-indigo-800/70">
                                    {creator.code}
                                  </span>
                                  {creator.isOfficial && (
                                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-300 dark:border-emerald-700">
                                      Oficial (De por vida)
                                    </span>
                                  )}
                                </div>
                                {creator.creatorName && (
                                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                                    {creator.creatorName} {creator.creatorUsername && `(@${creator.creatorUsername})`}
                                  </div>
                                )}
                              </td>

                              <td className="py-4 px-4 text-center">
                                <div className="font-bold text-slate-800 dark:text-slate-200">
                                  {creator.salesClp} usuarios
                                </div>
                                <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">
                                  (${(creator.salesClp * CREATOR_COMMISSION_CLP).toLocaleString('es-CL')} CLP)
                                </div>
                              </td>

                              <td className="py-4 px-4 text-center">
                                <div className="font-bold text-slate-800 dark:text-slate-200">
                                  {creator.salesUsd} usuarios
                                </div>
                                <div className="text-[10px] text-cyan-600 dark:text-cyan-400 font-mono">
                                  (${(creator.salesUsd * CREATOR_COMMISSION_USD).toFixed(2)} USD)
                                </div>
                              </td>

                              <td className="py-4 px-4 text-center font-black text-slate-900 dark:text-white">
                                {totalUsers}
                              </td>

                              <td className="py-4 px-4 text-right font-mono text-slate-600 dark:text-slate-400">
                                <div>${creator.totalRevenueClp.toLocaleString('es-CL')} CLP</div>
                                {creator.totalRevenueUsd > 0 ? (
                                  <div className="text-[11px] text-slate-400">${creator.totalRevenueUsd.toFixed(2)} USD</div>
                                ) : (
                                  <div className="text-[11px] text-slate-400">$0.00 USD</div>
                                )}
                              </td>

                              <td className="py-4 px-5 text-right">
                                <div className="font-mono font-black text-sm text-emerald-600 dark:text-emerald-400">
                                  ${creator.commissionClp.toLocaleString('es-CL')} CLP
                                </div>
                                {creator.commissionUsd > 0 ? (
                                  <div className="font-mono font-black text-xs text-cyan-600 dark:text-cyan-400">
                                    + ${creator.commissionUsd.toFixed(2)} USD
                                  </div>
                                ) : (
                                  <div className="text-[11px] text-slate-400 font-mono">
                                    $0.00 USD
                                  </div>
                                )}
                              </td>

                              <td className="py-4 px-5 text-center">
                                <div className="flex items-center justify-center gap-1.5 flex-wrap">
                                  <button
                                    type="button"
                                    onClick={() => handleCopyCreatorSettlement(creator)}
                                    className="px-2.5 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 font-bold text-[11px] border border-emerald-200 dark:border-emerald-800 flex items-center gap-1 transition-colors cursor-pointer"
                                    title="Copiar liquidación para transferir"
                                  >
                                    {copiedCreatorCode === creator.code ? (
                                      <>
                                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                                        <span>Copiado</span>
                                      </>
                                    ) : (
                                      <>
                                        <Copy className="w-3.5 h-3.5" />
                                        <span>Copiar Pago</span>
                                      </>
                                    )}
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => setSelectedCreatorDetails(creator)}
                                    className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-[11px] transition-colors cursor-pointer"
                                    title="Ver lista de compras asociadas"
                                  >
                                    Detalle ({creator.transactions.length})
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleOpenAssignCreatorModal(creator)}
                                    className="px-2.5 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 font-bold text-[11px] border border-indigo-200 dark:border-indigo-800 flex items-center gap-1 transition-colors cursor-pointer"
                                    title={creator.creatorUsername ? "Editar código" : "Vincular a perfil registrado"}
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                    <span>{creator.creatorUsername ? 'Editar' : 'Vincular'}</span>
                                  </button>

                                  {creator.creatorUsername && (
                                    <button
                                      type="button"
                                      onClick={() => setConfirmRemoveCreator(creator)}
                                      className="px-2 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 text-rose-700 dark:text-rose-300 font-bold text-[11px] border border-rose-200 dark:border-rose-800 flex items-center gap-1 transition-colors cursor-pointer"
                                      title="Desvincular código de este usuario"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                      <span>Desvincular</span>
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

            </div>

            {/* Modal: Creator Transactions Detail */}
            {selectedCreatorDetails && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
                <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-4 sm:p-6 relative max-h-[90vh] flex flex-col">
                  
                  <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
                          Detalle de Ventas
                        </h3>
                        <span className="font-mono font-black text-xs text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/80 px-2 py-0.5 rounded-md border border-indigo-200 dark:border-indigo-800">
                          {selectedCreatorDetails.code}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {selectedCreatorDetails.transactions.length} transacciones registradas
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedCreatorDetails(null)}
                      className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="overflow-y-auto py-3 space-y-2 flex-1 pr-1">
                    {selectedCreatorDetails.transactions.map((tx, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                      >
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                            <span>@{tx.username}</span>
                            <span className="text-[10px] font-mono text-slate-400 font-normal">({tx.payerEmail})</span>
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            {new Date(tx.date).toLocaleDateString('es-CL')} • {tx.paymentMethod} • ID: <span className="font-mono">{tx.id}</span>
                          </div>
                        </div>

                        <div className="sm:text-right">
                          <div className="font-mono font-bold text-slate-900 dark:text-white">
                            {tx.currency === 'USD' ? `$${tx.amount} USD` : `$${Number(tx.amount).toLocaleString('es-CL')} CLP`}
                          </div>
                          <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                            +{tx.currency === 'USD' ? `$${tx.commissionEarned} USD` : `$${tx.commissionEarned} CLP`} comisión
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
                    <div className="text-xs">
                      Total Comisión Creador:{' '}
                      <strong className="text-emerald-600 dark:text-emerald-400 font-mono">
                        ${selectedCreatorDetails.commissionClp.toLocaleString('es-CL')} CLP
                        {selectedCreatorDetails.commissionUsd > 0 && ` + $${selectedCreatorDetails.commissionUsd.toFixed(2)} USD`}
                      </strong>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCopyCreatorSettlement(selectedCreatorDetails)}
                      className="min-h-[40px] px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copiar Liquidación</span>
                    </button>
                  </div>

                </div>
              </div>
            )}

          </div>
        )}
      </div>

      {/* Modal: Quick Add Demo Profile */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-4 sm:p-6 relative max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">Generar Perfil Demo</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Añade arquetipos listos para testear</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 mb-6">
              {DEMO_PRESETS.map((preset) => (
                <div
                  key={preset.username}
                  className="p-3.5 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20 transition-all flex items-center justify-between gap-3 group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={preset.personalInfo.avatar}
                      alt={preset.personalInfo.name}
                      className="w-10 h-10 rounded-xl object-cover shrink-0"
                    />
                    <div className="min-w-0">
                      <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                        {preset.personalInfo.name}
                      </h4>
                      <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 truncate">
                        {preset.personalInfo.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400">
                          @{preset.username}
                        </span>
                        <span className="text-[10px] font-semibold px-2 py-0.2 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 capitalize">
                          {THEME_INFO[preset.theme]?.name}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleAddPreset(preset)}
                    className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-indigo-600 group-hover:bg-indigo-500 text-white text-xs font-bold shrink-0 shadow-sm transition-all cursor-pointer"
                  >
                    + Agregar
                  </button>
                </div>
              ))}
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setIsModalOpen(false)}
                className="min-h-[40px] px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                Cerrar
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Confirmation Modal: Delete Profile */}
      {confirmDeleteUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-5 sm:p-6 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
              ¿Eliminar @{confirmDeleteUser}?
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
              Esta acción eliminará el portafolio y todas sus métricas asociadas de forma permanente.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
              <button
                onClick={() => setConfirmDeleteUser(null)}
                className="w-full sm:w-auto min-h-[40px] px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(confirmDeleteUser)}
                className="w-full sm:w-auto min-h-[40px] px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-colors shadow-sm shadow-rose-600/20 cursor-pointer"
              >
                Sí, Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Assign or Edit Creator Code CRUD */}
      {isCreatorModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-4 sm:p-6 relative max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400">
                  <Tag className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                    {editingCreator ? 'Editar Código de Creador' : 'Asignar Código de Creador'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Vincula un código a un usuario registrado
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreatorModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCreatorAssignment} className="space-y-4">
              {/* Profile Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Seleccionar Perfil Registrado *
                </label>
                <div className="relative">
                  <select
                    value={creatorFormUsername}
                    onChange={(e) => setCreatorFormUsername(e.target.value)}
                    disabled={Boolean(editingCreator && editingCreator.creatorUsername)}
                    className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                    required
                  >
                    <option value="">-- Elige un usuario registrado ({profileList.length} disponibles) --</option>
                    {profileList.map((p) => {
                      const hasCode = p.creatorCode || p.personalInfo?.creator_code
                      return (
                        <option key={p.username} value={p.username}>
                          @{p.username} — {p.personalInfo?.name || 'Sin nombre'} {hasCode ? `[Código: ${hasCode}]` : ''}
                        </option>
                      )
                    })}
                  </select>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  El código quedará guardado directamente en la cuenta del usuario en Supabase.
                </p>
              </div>

              {/* Creator Code Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Código de Creador (Creado por ti) *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={creatorFormCode}
                    onChange={(e) => setCreatorFormCode(e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, '').slice(0, 30))}
                    placeholder="EJ: SANTIAGOQ7, DEV2025, TIKTOK30"
                    className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-mono font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 uppercase tracking-wider"
                    required
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Comisión por usuario que pague: ${CREATOR_COMMISSION_CLP.toLocaleString('es-CL')} CLP (Flow) o ${CREATOR_COMMISSION_USD.toFixed(2)} USD (PayPal).
                </p>
              </div>

              {/* Lifetime Plan Toggle */}
              <div className="p-3.5 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 flex items-start gap-3">
                <input
                  type="checkbox"
                  id="creator-lifetime-checkbox"
                  checked={creatorFormIsLifetime}
                  onChange={(e) => setCreatorFormIsLifetime(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer"
                />
                <label htmlFor="creator-lifetime-checkbox" className="text-xs cursor-pointer">
                  <span className="font-bold text-indigo-900 dark:text-indigo-200 block">
                    Activar Plan De por vida (2099) para el creador
                  </span>
                  <span className="text-slate-500 dark:text-slate-400 text-[11px] block mt-0.5">
                    Permite que el creador use Mi Vitae ilimitadamente sin cobros ni fecha de vencimiento.
                  </span>
                </label>
              </div>

              {/* Error Message */}
              {creatorFormError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-medium">
                  {creatorFormError}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreatorModalOpen(false)}
                  className="w-full sm:w-auto min-h-[42px] px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSavingCreator}
                  className="w-full sm:w-auto min-h-[42px] px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-sm shadow-emerald-600/20 disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {isSavingCreator ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Guardando en Supabase...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Guardar Asignación</span>
                    </>
                  )}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* Confirmation Modal: Remove Creator Code */}
      {confirmRemoveCreator && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-5 sm:p-6 text-center">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-3">
              <Tag className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
              ¿Desvincular código de creador?
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
              Se desvinculará el código <strong className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">{confirmRemoveCreator.code}</strong> del perfil <strong className="text-slate-700 dark:text-slate-200">@{confirmRemoveCreator.creatorUsername}</strong>.
            </p>
            <p className="text-[11px] text-slate-400 mb-5">
              El historial de transacciones anteriores permanecerá intacto para liquidación.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setConfirmRemoveCreator(null)}
                className="w-full sm:w-auto min-h-[40px] px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmRemoveCreator}
                className="w-full sm:w-auto min-h-[40px] px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-colors shadow-sm shadow-rose-600/20 cursor-pointer"
              >
                Sí, Desvincular
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Desglose Completo de Temas & Diseños */}
      {isThemeBreakdownOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setIsThemeBreakdownOpen(false)}
        >
          <div 
            className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl max-w-md w-full p-4 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-fuchsia-50 dark:bg-fuchsia-950/60 text-fuchsia-600 dark:text-fuchsia-400">
                  <Palette className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                    Distribución de Temas
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {totalProfiles} portafolios en {topThemes.length} temas
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsThemeBreakdownOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                aria-label="Cerrar modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
              {topThemes.map(([themeKey, count], idx) => {
                const meta = getThemeMeta(themeKey)
                const pct = totalProfiles > 0 ? Math.round((count / totalProfiles) * 100) : 0
                return (
                  <div 
                    key={themeKey} 
                    className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-mono text-xs font-bold text-slate-400 w-4">
                        {idx + 1}.
                      </span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-bold border truncate ${meta.color}`}>
                        {meta.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="w-16 sm:w-20 bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden hidden xs:block">
                        <div 
                          className="bg-fuchsia-500 h-full rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="font-mono font-bold text-xs text-slate-900 dark:text-white text-right min-w-[45px]">
                        {count} ({pct}%)
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setIsThemeBreakdownOpen(false)}
                className="w-full min-h-[42px] py-2.5 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
