import React, { useState, useMemo, useEffect } from 'react'
import { Link, useNavigate } from '../router/Router'
import { useProfileStore } from '../stores/profileStore'
import { 
  getCurrentUser, 
  fetchTransactionsFromSupabase,
  fetchAllProfilesFromSupabase,
  updateProfilePlanInSupabase,
  deleteProfileFromSupabase
} from '../lib/supabaseClient'
import { 
  Shield, Users, Eye, MousePointerClick, DollarSign, 
  ExternalLink, TrendingUp, RefreshCw, CheckCircle2, 
  Search, UserCheck, Trash2, Edit3, X,
  Sparkles, FileDown, ChevronDown, UserPlus, Lock,
  Award, Copy, Check, Calendar, ArrowRight, LogOut, Receipt
} from 'lucide-react'

// Map theme IDs to user-friendly names and badge styling
const THEME_INFO = {
  minimalist: { name: 'Minimalista', color: 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700' },
  neo_brutalist: { name: 'Pop Tactile', color: 'bg-amber-100 dark:bg-amber-950/50 text-amber-900 dark:text-amber-300 border-amber-300 dark:border-amber-700' },
  creative: { name: 'Creativo', color: 'bg-fuchsia-50 dark:bg-fuchsia-950/50 text-fuchsia-700 dark:text-fuchsia-300 border-fuchsia-200 dark:border-fuchsia-800' },
  tech: { name: 'Técnico', color: 'bg-cyan-50 dark:bg-cyan-950/50 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800' },
  warm: { name: 'Cálido', color: 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800' },
  executive: { name: 'Ejecutivo', color: 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800' },
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

  // Security & Authorization State (user: jericesb5@gmail.com, pass: TeAmoSambi!@123a)
  const [isAdminAuthorized, setIsAdminAuthorized] = useState(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('mi_vitae_admin_auth') === 'true'
    }
    return false
  })
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
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

  const handleAdminLogin = (e) => {
    e.preventDefault()
    const cleanUser = adminEmailInput.trim().toLowerCase()
    const pass = adminPasswordInput.trim()

    // Canonical Admin Credentials: user: jericesb5@gmail.com, pass: TeAmoSambi!@123a
    if (cleanUser === 'jericesb5@gmail.com' && pass === 'TeAmoSambi!@123a') {
      setIsAdminAuthorized(true)
      sessionStorage.setItem('mi_vitae_admin_auth', 'true')
      setAuthError('')
      showToast('¡Bienvenido Jeric! Acceso concedido al Super Admin.')
    } else {
      setAuthError('Usuario o contraseña de administrador incorrectos.')
    }
  }

  const handleAdminLogout = () => {
    sessionStorage.removeItem('mi_vitae_admin_auth')
    setIsAdminAuthorized(false)
    setAdminPasswordInput('')
    navigate('/')
  }

  // Navigation tab: 'users' (Portafolios & Usuarios) | 'creators' (Afiliados & Creadores)
  const [activeAdminTab, setActiveAdminTab] = useState('users')

  // Live Database State from Supabase
  const [remoteProfiles, setRemoteProfilesState] = useState([])
  const [isLoadingProfiles, setIsLoadingProfiles] = useState(true)
  const [transactions, setTransactions] = useState([])
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false)
  const [creatorSearch, setCreatorSearch] = useState('')
  const [selectedCreatorDetails, setSelectedCreatorDetails] = useState(null)
  const [copiedCreatorCode, setCopiedCreatorCode] = useState(null)

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
  const [themeFilter, setThemeFilter] = useState('all') // 'all', 'minimalist', 'neo_brutalist', 'creative', 'tech', 'warm', 'executive'
  const [sortField, setSortField] = useState('views') // 'views', 'name', 'createdAt'
  const [sortOrder, setSortOrder] = useState('desc') // 'asc', 'desc'

  // UI state
  const [isModalOpen, setIsModalOpen] = useState(false)
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

  // Aggregate Key KPIs
  const totalProfiles = profileList.length
  const lifetimeProfiles = profileList.filter((p) => p.plan === 'lifetime').length
  const activePremiumProfiles = profileList.filter((p) => p.plan === 'premium').length
  const trialProfiles = profileList.filter((p) => p.plan === 'trial').length
  const inactiveProfiles = profileList.filter((p) => p.plan === 'inactive').length

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
          valA = a.createdAt || '2025-01-01'
          valB = b.createdAt || '2025-01-01'
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
    const success = await updateProfilePlanInSupabase(username, newPlan, 'TeAmoSambi!@123a')
    if (success) {
      showToast(`✅ Plan de @${username} actualizado a ${PLAN_INFO[newPlan]?.name || newPlan} en Supabase`)
      // Refresh remote profiles directly from Supabase
      fetchAllProfilesFromSupabase().then((refreshed) => {
        if (refreshed && refreshed.length > 0) {
          setRemoteProfilesState(refreshed)
        }
      }).catch(() => {})
    } else {
      showToast(`⚠️ No se pudo guardar en Supabase (error de permisos o RLS).`)
    }
  }

  // Handle user deletion with persistence to Supabase
  const handleDelete = async (username) => {
    // 1. Remove from local state
    setRemoteProfilesState((prev) => prev.filter((p) => p.username.toLowerCase() !== username.toLowerCase()))
    deleteProfile(username)
    setConfirmDeleteUser(null)

    // 2. Delete from Supabase via serverless endpoint bypassing RLS
    const success = await deleteProfileFromSupabase(username, 'TeAmoSambi!@123a')
    if (success) {
      showToast(`✅ Portafolio de @${username} eliminado de Supabase.`)
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
      'Tasa de Conversión (%)',
      'Fecha Creación',
      'URL Portafolio'
    ]

    const rows = profileList.map((p) => {
      const views = p.analytics?.views || 0
      const clicks = p.analytics?.contactClicks || 0
      const cr = views > 0 ? ((clicks / views) * 100).toFixed(1) : '0.0'
      const portUrl = `https://mi-vitae.wearesamod.com/${p.username}`

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

  // ---------------------------------------------------------------------------
  // AFFILIATES & CREATORS ("APOYA A UN CREADOR") REAL BUSINESS LOGIC
  // Chilean Flow.cl sales: $600 CLP commission per paying user
  // International PayPal sales: $2.60 USD commission per paying user
  // ---------------------------------------------------------------------------
  const creatorsSummary = useMemo(() => {
    const map = {}

    // Initialize registered official creator(s)
    REGISTERED_AFFILIATES.forEach((aff) => {
      map[aff.code] = {
        code: aff.code,
        creatorUsername: aff.creatorUsername,
        creatorName: aff.creatorName,
        creatorTitle: aff.creatorTitle,
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
    })

    // 1. Process real transactions from Supabase transactions table
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
        map[code].commissionUsd += 2.60
      } else {
        map[code].salesClp += 1
        map[code].totalRevenueClp += Number(tx.amount || 3490)
        map[code].commissionClp += 600
      }

      map[code].transactions.push({
        id: tx.order_number || tx.id,
        date: tx.created_at || new Date().toISOString(),
        username: tx.username || 'usuario',
        payerEmail: tx.payer_email || 'cliente@ejemplo.com',
        currency: isUsd ? 'USD' : 'CLP',
        amount: Number(tx.amount || (isUsd ? 3.99 : 3490)),
        paymentMethod: tx.payment_method || (isUsd ? 'PayPal' : 'Flow.cl'),
        commissionEarned: isUsd ? 2.60 : 600
      })
    })

    // 2. Process transactions from profiles history
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
          map[code].commissionUsd += 2.60
        } else {
          map[code].salesClp += 1
          map[code].totalRevenueClp += Number(tx.amount || 3490)
          map[code].commissionClp += 600
        }

        map[code].transactions.push({
          id: orderId || `TX-${Date.now()}`,
          date: tx.date || new Date().toISOString(),
          username: p.username,
          payerEmail: tx.payerEmail || p.personalInfo?.email || 'cliente@ejemplo.com',
          currency: isUsd ? 'USD' : 'CLP',
          amount: Number(tx.amount || (isUsd ? 3.99 : 3490)),
          paymentMethod: tx.paymentMethod || (isUsd ? 'PayPal' : 'Flow.cl'),
          commissionEarned: isUsd ? 2.60 : 600
        })
      })
    })

    return Object.values(map)
  }, [transactions, profileList])

  // Filtered creators list by search term
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

  // Copy monthly settlement summary for transferring on the 30th
  const handleCopyCreatorSettlement = (creator) => {
    const totalUsers = creator.salesClp + creator.salesUsd
    const text = `
==================================================
LIQUIDACIÓN CREADOR / AFILIADO (CORTE DÍA 30)
Mi Vitae by We Are Samod
==================================================
Código de Creador:          ${creator.code}
Fecha de Emisión:            ${new Date().toLocaleDateString('es-CL')}

RESUMEN DE VENTAS Y CONVERSIONES:
• Ventas Chile (Flow.cl):         ${creator.salesClp} usuarios ($600 CLP comisión c/u)
• Ventas Internacional (PayPal):  ${creator.salesUsd} usuarios ($2.60 USD comisión c/u)
• Total Usuarios Pagados:         ${totalUsers} usuarios

TOTAL A TRANSFERIR ESTE MES:
${creator.commissionClp > 0 ? `👉 Total en Pesos:  $${creator.commissionClp.toLocaleString('es-CL')} CLP\n` : ''}${creator.commissionUsd > 0 ? `👉 Total en Dólares: $${creator.commissionUsd.toFixed(2)} USD (PayPal)\n` : ''}
Administrador autorizado: jericesb5@gmail.com
==================================================
`.trim()

    navigator.clipboard.writeText(text)
    setCopiedCreatorCode(creator.code)
    setTimeout(() => setCopiedCreatorCode(null), 3000)
    showToast(`¡Liquidación de ${creator.code} copiada al portapapeles!`)
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
      'Comisión a Pagar CLP ($600 c/u)',
      'Comisión a Pagar USD ($2.60 c/u)',
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
        <div className="max-w-md w-full p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-6 animate-fadeIn">
          <div className="text-center space-y-2.5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white mx-auto flex items-center justify-center shadow-lg shadow-indigo-600/30">
              <Shield className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight">Super Admin</h2>
              <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                /admin/wearesamod
              </span>
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
                placeholder="jericesb5@gmail.com"
                value={adminEmailInput}
                onChange={(e) => { setAdminEmailInput(e.target.value); setAuthError('') }}
                className="w-full px-4 py-3 rounded-xl bg-slate-800/90 border border-slate-700 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
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
                className="w-full px-4 py-3 rounded-xl bg-slate-800/90 border border-slate-700 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
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
              className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-[0.99] text-white font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-indigo-600/30 cursor-pointer flex items-center justify-center gap-2"
            >
              <Lock className="w-4 h-4" />
              <span>Acceder al Panel de Control</span>
            </button>
          </form>

          <div className="pt-2 border-t border-slate-800 text-center">
            <Link to="/" className="text-xs text-slate-400 hover:text-white transition-colors">
              ← Volver al inicio
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
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 bg-slate-900 text-white dark:bg-indigo-600 rounded-2xl shadow-xl border border-slate-700 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span className="text-sm font-semibold">{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="ml-2 text-slate-400 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Super Admin Hero Header */}
      <div className="bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-white py-10 px-4 sm:px-6 lg:px-8 border-b border-slate-800 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white shadow-lg shadow-indigo-500/20">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Super Admin Dashboard</h1>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    Live Control
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  Métricas globales, monitoreo de portafolios, tráfico orgánico y control de suscripciones en tiempo real.
                </p>
              </div>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={loadAdminData}
              disabled={isLoadingProfiles || isLoadingTransactions}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-bold flex items-center gap-1.5 border border-slate-700 hover:border-slate-600 transition-colors cursor-pointer"
              title="Recargar usuarios y transacciones en tiempo real desde Supabase"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingProfiles ? 'animate-spin text-indigo-400' : 'text-emerald-400'}`} />
              <span>Refrescar</span>
            </button>

            <button
              onClick={() => setIsModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-md shadow-indigo-600/20 transition-all hover:scale-105 active:scale-95"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ Perfil Demo</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-bold flex items-center gap-1.5 border border-slate-700 hover:border-slate-600 transition-colors"
            >
              <FileDown className="w-4 h-4 text-emerald-400" />
              <span>Exportar CSV</span>
            </button>

            <button
              onClick={handleAdminLogout}
              className="px-3.5 py-2 rounded-xl bg-rose-950/50 hover:bg-rose-900/70 text-rose-300 text-xs sm:text-sm font-bold flex items-center gap-1.5 border border-rose-800/70 transition-colors cursor-pointer"
              title="Cerrar sesión de administrador"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Cerrar Sesión</span>
            </button>
          </div>

        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">

        {/* Navigation Tabs between Portfolios and Creators */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6 bg-white dark:bg-slate-900 p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveAdminTab('users')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeAdminTab === 'users'
                  ? 'bg-palette-primary text-white shadow-md shadow-palette-primary/25 scale-[1.01]'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Portafolios & Usuarios ({totalProfiles})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveAdminTab('creators')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeAdminTab === 'creators'
                  ? 'bg-palette-primary text-white shadow-md shadow-palette-primary/25 scale-[1.01]'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Award className="w-4 h-4 text-amber-400" />
              <span>Afiliados & Creadores</span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono font-black bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                {creatorsSummary.length}
              </span>
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 px-3 py-1">
            <Calendar className="w-3.5 h-3.5 text-indigo-500" />
            <span>Liquidación mensual: <strong>Día 30 de cada mes</strong></span>
          </div>
        </div>

        {/* Tab 1: Portafolios y Usuarios */}
        {activeAdminTab === 'users' && (
          <div>
            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          
          {/* Card 1: Portafolios Totales */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800/80 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-28 h-28 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition-colors pointer-events-none" />
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Portafolios</span>
              <div className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-black text-slate-900 dark:text-white">
              {totalProfiles}
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/60 text-xs font-semibold text-slate-500 dark:text-slate-400">
              {lifetimeProfiles > 0 && (
                <span className="text-indigo-600 dark:text-indigo-400 flex items-center gap-0.5 font-bold">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  {lifetimeProfiles} De por vida
                </span>
              )}
              {lifetimeProfiles > 0 && <span>•</span>}
              <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {activePremiumProfiles} Suscripción
              </span>
              <span>•</span>
              <span className="text-amber-600 dark:text-amber-400">
                {trialProfiles} en Prueba
              </span>
            </div>
          </div>

          {/* Card 2: Usuarios Activos / Suscripciones */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800/80 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-28 h-28 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-colors pointer-events-none" />
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Usuarios Activos</span>
              <div className="p-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                <UserCheck className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-black text-slate-900 dark:text-white">
              {activePremiumProfiles + lifetimeProfiles}
            </div>
            <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/60 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>{lifetimeProfiles} VIP De por vida + {activePremiumProfiles} suscriptores</span>
            </div>
          </div>

          {/* Card 3: MRR Proyectado */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800/80 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-28 h-28 bg-purple-500/5 rounded-full blur-2xl group-hover:bg-purple-500/10 transition-colors pointer-events-none" />
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">MRR Proyectado</span>
              <div className="p-2.5 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-black text-slate-900 dark:text-white">
              ${projectedMrr.toLocaleString('es-CL')} <span className="text-sm font-bold text-slate-500">CLP/mes</span>
            </div>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/60 text-xs text-slate-500 dark:text-slate-400 font-medium">
              <span>ARR: ${projectedArr.toLocaleString('es-CL')} CLP</span>
              <span className="font-semibold text-purple-600 dark:text-purple-400">$3.490/u</span>
            </div>
          </div>

          {/* Card 4: Tráfico Global & Conversión */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800/80 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-28 h-28 bg-cyan-500/5 rounded-full blur-2xl group-hover:bg-cyan-500/10 transition-colors pointer-events-none" />
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Tráfico & Conversión</span>
              <div className="p-2.5 rounded-2xl bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400">
                <Eye className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-black text-slate-900 dark:text-white">
              {totalViews.toLocaleString()} <span className="text-sm font-bold text-slate-500">visitas</span>
            </div>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/60 text-xs font-semibold">
              <span className="text-cyan-600 dark:text-cyan-400 flex items-center gap-1">
                <MousePointerClick className="w-3.5 h-3.5" />
                {totalClicks} clics
              </span>
              <span className="text-purple-600 dark:text-purple-400 flex items-center gap-1">
                <FileDown className="w-3.5 h-3.5" />
                {totalDownloads} CVs
              </span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                {globalConversionRate}% CR
              </span>
            </div>
          </div>

        </div>

        {/* Filters & Search Control Bar */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm mb-6">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
            
            {/* Search input */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nombre, @username, cargo o email..."
                className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/80 rounded-2xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter pills and selects */}
            <div className="flex flex-wrap items-center gap-3">
              
              {/* Status Filter */}
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl border border-slate-200 dark:border-slate-700/60">
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                    statusFilter === 'all'
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Todos ({totalProfiles})
                </button>
                {lifetimeProfiles > 0 && (
                  <button
                    onClick={() => setStatusFilter('lifetime')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                      statusFilter === 'lifetime'
                        ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm font-black'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    ✨ De por vida ({lifetimeProfiles})
                  </button>
                )}
                <button
                  onClick={() => setStatusFilter('premium')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                    statusFilter === 'premium'
                      ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Suscripción ({activePremiumProfiles})
                </button>
                <button
                  onClick={() => setStatusFilter('trial')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                    statusFilter === 'trial'
                      ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Prueba ({trialProfiles})
                </button>
                <button
                  onClick={() => setStatusFilter('inactive')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                    statusFilter === 'inactive'
                      ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Inactivos ({inactiveProfiles})
                </button>
              </div>

              {/* Theme Filter Dropdown */}
              <div className="flex items-center gap-1.5">
                <select
                  value={themeFilter}
                  onChange={(e) => setThemeFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="all">Todos los Temas</option>
                  <option value="minimalist">Minimalista</option>
                  <option value="neo_brutalist">Pop Tactile</option>
                  <option value="creative">Creativo</option>
                  <option value="tech">Técnico</option>
                  <option value="warm">Cálido</option>
                  <option value="executive">Ejecutivo</option>
                </select>
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
                  className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="views_desc">Mayor Tráfico (Visitas ↓)</option>
                  <option value="views_asc">Menor Tráfico (Visitas ↑)</option>
                  <option value="clicks_desc">Más Clics de Contacto ↓</option>
                  <option value="name_asc">Nombre (A-Z)</option>
                  <option value="createdAt_desc">Más Recientes</option>
                </select>
              </div>

              {/* Clear filters button */}
              {(searchTerm || statusFilter !== 'all' || themeFilter !== 'all') && (
                <button
                  onClick={() => {
                    setSearchTerm('')
                    setStatusFilter('all')
                    setThemeFilter('all')
                  }}
                  className="px-3 py-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-xl transition-colors"
                >
                  Limpiar filtros
                </button>
              )}

            </div>

          </div>
        </div>

        {/* User Profiles Table */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
          
          <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-900/50">
            <div className="flex items-center gap-2.5">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Portafolios Registrados</h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                {filteredProfiles.length} {filteredProfiles.length === 1 ? 'resultado' : 'resultados'}
              </span>
            </div>
            
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Usa los selectores de la columna <strong className="text-slate-700 dark:text-slate-300">Plan / Estado</strong> para modificar suscripciones en vivo.
            </p>
          </div>

          {filteredProfiles.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4 text-slate-400">
                <Search className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">No se encontraron portafolios</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-4">
                No hay usuarios que coincidan con los criterios de búsqueda o filtros seleccionados.
              </p>
              <button
                onClick={() => {
                  setSearchTerm('')
                  setStatusFilter('all')
                  setThemeFilter('all')
                }}
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-500 transition-colors"
              >
                Restablecer Filtros
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
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
                  {filteredProfiles.map((p) => {
                    const views = p.analytics?.views || 0
                    const clicks = p.analytics?.contactClicks || 0
                    const conversionRate = views > 0 ? ((clicks / views) * 100).toFixed(1) : '0.0'
                    const themeObj = THEME_INFO[p.theme] || { name: p.theme, color: 'bg-slate-100 text-slate-700 border-slate-200' }

                    return (
                      <tr 
                        key={p.username} 
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group"
                      >
                        {/* Profile Info */}
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3.5">
                            <img
                              src={p.personalInfo?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'}
                              alt={p.personalInfo?.name}
                              className="w-11 h-11 rounded-2xl object-cover border border-slate-200 dark:border-slate-700 shadow-sm"
                            />
                            <div className="min-w-0">
                              <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 truncate">
                                <span>{p.personalInfo?.name || p.username}</span>
                                {p.isLifetime && (
                                  <span className="px-2 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 text-[10px] font-black border border-indigo-200 dark:border-indigo-800 flex items-center gap-1 shadow-xs" title="Plan Premium Vitalicio">
                                    <Sparkles className="w-3 h-3 text-amber-500 fill-amber-500" />
                                    <span>VIP De por vida</span>
                                  </span>
                                )}
                                {p.personalInfo?.availableForWork && (
                                  <span className="w-2 h-2 rounded-full bg-emerald-500" title="Disponible para trabajar" />
                                )}
                              </div>
                              <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-xs">
                                {p.personalInfo?.title || 'Profesional'}
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
                              <option value="lifetime">✨ De por vida</option>
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
                            
                            {/* Link to view live portfolio */}
                            <Link
                              to={`/${p.username}`}
                              target="_blank"
                              title="Ver portafolio público"
                              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Link>

                            {/* Edit in Studio Button */}
                            <button
                              onClick={() => handleEdit(p.username)}
                              title="Editar en Studio"
                              className="p-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/80 text-indigo-600 dark:text-indigo-400 transition-colors"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            {/* Delete Profile Button */}
                            <button
                              onClick={() => setConfirmDeleteUser(p.username)}
                              title="Eliminar usuario"
                              className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 transition-colors"
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
          )}

          {/* Table Footer Summary */}
          <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400 font-medium">
            <div>
              Mostrando <strong className="text-slate-800 dark:text-slate-200">{filteredProfiles.length}</strong> de <strong className="text-slate-800 dark:text-slate-200">{totalProfiles}</strong> usuarios registrados.
            </div>
            <div className="flex items-center gap-4">
              <span>MRR Activo: <strong className="text-emerald-600 dark:text-emerald-400 font-bold">${projectedMrr.toLocaleString('es-CL')} CLP</strong></span>
              <span>•</span>
              <span>Tráfico acumulado: <strong className="text-slate-800 dark:text-slate-200 font-bold">{totalViews.toLocaleString()} visitas</strong></span>
            </div>
          </div>
        </div>
      </div>
    )}

        {/* ========================================================================= */}
        {/* TAB 2: AFILIADOS & CREADORES ("APOYA A UN CREADOR")                       */}
        {/* ========================================================================= */}
        {activeAdminTab === 'creators' && (
          <div className="space-y-6 animate-fadeIn">
            
            {/* 1. Official Commission Rules Banner */}
            <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-indigo-900/90 via-slate-900 to-slate-900 border border-indigo-500/30 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
              <div className="flex items-start gap-3.5">
                <div className="p-3 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 shrink-0">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white">Reglas Oficiales de Liquidación para Creadores</h3>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Corte: 30 de cada mes
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    Comisiones fijas acordadas por cada usuario suscrito con el código del influencer:
                  </p>
                  <div className="flex flex-wrap items-center gap-2.5 mt-2.5 text-xs">
                    <span className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 flex items-center gap-1.5 font-bold text-slate-200">
                      🇨🇱 Chile (Flow.cl): <strong className="text-emerald-400 font-mono">$600 CLP</strong> por usuario
                    </span>
                    <span className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 flex items-center gap-1.5 font-bold text-slate-200">
                      🌐 Internacional (PayPal): <strong className="text-cyan-400 font-mono">$2.60 USD</strong> por usuario
                    </span>
                  </div>
                </div>
              </div>

              <div className="shrink-0 flex items-center gap-2 w-full md:w-auto">
                <button
                  type="button"
                  onClick={handleExportCreatorsCSV}
                  className="w-full md:w-auto px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
                >
                  <FileDown className="w-4 h-4 text-emerald-300" />
                  <span>Exportar Liquidación CSV</span>
                </button>
              </div>
            </div>

            {/* 2. Creators KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              
              {/* Card 1: Creadores Activos */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800/80 shadow-sm relative overflow-hidden">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Creadores con Ventas</span>
                  <div className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                    <Users className="w-5 h-5" />
                  </div>
                </div>
                <div className="text-3xl font-black text-slate-900 dark:text-white">
                  {creatorsSummary.length}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-medium">
                  Códigos únicos con conversiones
                </div>
              </div>

              {/* Card 2: Total Usuarios Convertidos */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800/80 shadow-sm relative overflow-hidden">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Usuarios Convertidos</span>
                  <div className="p-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                </div>
                <div className="text-3xl font-black text-slate-900 dark:text-white">
                  {totalCreatorSalesClp + totalCreatorSalesUsd}
                </div>
                <div className="flex items-center gap-2 mt-2 text-xs font-semibold text-slate-500">
                  <span className="text-emerald-600 dark:text-emerald-400">{totalCreatorSalesClp} en Flow</span>
                  <span>•</span>
                  <span className="text-cyan-600 dark:text-cyan-400">{totalCreatorSalesUsd} en PayPal</span>
                </div>
              </div>

              {/* Card 3: Total Recaudado Bruto */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800/80 shadow-sm relative overflow-hidden">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Recaudado</span>
                  <div className="p-2.5 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
                    <DollarSign className="w-5 h-5" />
                  </div>
                </div>
                <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                  ${totalCreatorRevenueClp.toLocaleString('es-CL')} CLP
                </div>
                <div className="text-xs font-bold text-cyan-600 dark:text-cyan-400 mt-1">
                  + ${totalCreatorRevenueUsd.toFixed(2)} USD
                </div>
              </div>

              {/* Card 4: Total a Transferir el 30 */}
              <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white p-6 rounded-3xl shadow-lg shadow-emerald-600/20 relative overflow-hidden">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black uppercase tracking-wider text-emerald-100">A Transferir (Día 30)</span>
                  <div className="p-2 rounded-xl bg-white/20 text-white">
                    <Receipt className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-white">
                  ${totalCreatorCommissionClp.toLocaleString('es-CL')} CLP
                </div>
                <div className="text-sm font-bold text-emerald-100 mt-1">
                  + ${totalCreatorCommissionUsd.toFixed(2)} USD
                </div>
                <div className="text-[11px] text-emerald-100/80 mt-2 font-medium">
                  Comisiones calculadas a liquidar
                </div>
              </div>

            </div>

            {/* 3. Search and Table Card */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              
              <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-950/50">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={creatorSearch}
                    onChange={(e) => setCreatorSearch(e.target.value)}
                    placeholder="Filtrar por código de creador (EJ: STREAMER10)..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 uppercase"
                  />
                </div>

                <div className="text-xs text-slate-500 dark:text-slate-400 font-medium text-right">
                  Mostrando {filteredCreators.length} de {creatorsSummary.length} creadores
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
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
                    {filteredCreators.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-500 dark:text-slate-400">
                          No se encontraron creadores con ventas registradas.
                        </td>
                      </tr>
                    ) : (
                      filteredCreators.map((creator) => {
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
                                (${(creator.salesClp * 600).toLocaleString('es-CL')} CLP)
                              </div>
                            </td>

                            <td className="py-4 px-4 text-center">
                              <div className="font-bold text-slate-800 dark:text-slate-200">
                                {creator.salesUsd} usuarios
                              </div>
                              <div className="text-[10px] text-cyan-600 dark:text-cyan-400 font-mono">
                                (${(creator.salesUsd * 2.60).toFixed(2)} USD)
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
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleCopyCreatorSettlement(creator)}
                                  className="px-2.5 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 font-bold text-[11px] border border-emerald-200 dark:border-emerald-800 flex items-center gap-1 transition-colors cursor-pointer"
                                  title="Copiar liquidación para transferir"
                                >
                                  {copiedCreatorCode === creator.code ? (
                                    <>
                                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                                      <span>¡Copiado!</span>
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
                              </div>
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>

            </div>

            {/* Modal: Creator Transactions Detail */}
            {selectedCreatorDetails && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
                <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 relative max-h-[85vh] flex flex-col">
                  
                  <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                          Detalle de Ventas con Código
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
                      className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="overflow-y-auto py-3 space-y-2 flex-1">
                    {selectedCreatorDetails.transactions.map((tx, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between text-xs"
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

                        <div className="text-right">
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

                  <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
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
                      className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 relative">
            
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Generar Perfil Demo</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Añade arquetipos listos para testear la plataforma</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 mb-6">
              {DEMO_PRESETS.map((preset) => (
                <div
                  key={preset.username}
                  className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20 transition-all flex items-center justify-between gap-3 group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={preset.personalInfo.avatar}
                      alt={preset.personalInfo.name}
                      className="w-10 h-10 rounded-xl object-cover flex-shrink-0"
                    />
                    <div className="min-w-0">
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                        {preset.personalInfo.name}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
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
                    className="px-3.5 py-1.5 rounded-xl bg-indigo-600 group-hover:bg-indigo-500 text-white text-xs font-bold flex-shrink-0 shadow-sm transition-all"
                  >
                    + Agregar
                  </button>
                </div>
              ))}
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                Cerrar
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Confirmation Modal: Delete Profile */}
      {confirmDeleteUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
              ¿Eliminar @{confirmDeleteUser}?
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
              Esta acción eliminará el portafolio y todas sus métricas asociadas de forma permanente.
            </p>
            <div className="flex items-center justify-center gap-2.5">
              <button
                onClick={() => setConfirmDeleteUser(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(confirmDeleteUser)}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-colors shadow-sm shadow-rose-600/20"
              >
                Sí, Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
