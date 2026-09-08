import React, { useState, useMemo } from 'react'
import { Link, useNavigate } from '../router/Router'
import { useProfileStore } from '../stores/profileStore'
import { 
  Shield, Users, Eye, MousePointerClick, DollarSign, 
  ExternalLink, TrendingUp, RefreshCw, CheckCircle2, 
  Search, UserCheck, Trash2, Edit3, X,
  Sparkles, FileDown, ChevronDown, UserPlus
} from 'lucide-react'

// Map theme IDs to user-friendly names and badge styling
const THEME_INFO = {
  minimalist: { name: 'Minimalista', color: 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700' },
  creative: { name: 'Creativo', color: 'bg-fuchsia-50 dark:bg-fuchsia-950/50 text-fuchsia-700 dark:text-fuchsia-300 border-fuchsia-200 dark:border-fuchsia-800' },
  tech: { name: 'Técnico', color: 'bg-cyan-50 dark:bg-cyan-950/50 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800' },
  warm: { name: 'Cálido', color: 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800' },
  executive: { name: 'Ejecutivo', color: 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800' },
}

const PLAN_INFO = {
  premium: { name: 'Suscripción Activa', color: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' },
  trial: { name: '1er Mes Gratis', color: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800' },
  inactive: { name: 'Inactivo', color: 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800' }
}

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
  const resetToDefaults = useProfileStore((state) => state.resetToDefaults)

  // Filter and search state
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all') // 'all', 'premium', 'trial', 'inactive'
  const [themeFilter, setThemeFilter] = useState('all') // 'all', 'minimalist', 'creative', 'tech', 'warm', 'executive'
  const [sortField, setSortField] = useState('views') // 'views', 'name', 'createdAt', 'mrr'
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
    return Object.values(profiles).map(p => ({
      ...p,
      plan: p.plan || (p.status === 'trial' ? 'trial' : p.status === 'inactive' ? 'inactive' : 'premium'),
      status: p.status || (p.plan === 'inactive' ? 'inactive' : p.plan === 'trial' ? 'trial' : 'active')
    }))
  }, [profiles])

  // Aggregate Key KPIs
  const totalProfiles = profileList.length
  const activePremiumProfiles = profileList.filter(p => p.plan === 'premium').length
  const trialProfiles = profileList.filter(p => p.plan === 'trial').length
  const inactiveProfiles = profileList.filter(p => p.plan === 'inactive').length

  const totalViews = profileList.reduce((acc, p) => acc + (p.analytics?.views || 0), 0)
  const totalClicks = profileList.reduce((acc, p) => acc + (p.analytics?.contactClicks || 0), 0)
  const totalDownloads = profileList.reduce((acc, p) => acc + (p.analytics?.cvDownloads || 0), 0)
  const globalInteractions = totalClicks + totalDownloads
  const globalConversionRate = totalViews > 0 ? ((globalInteractions / totalViews) * 100).toFixed(1) : '0.0'

  // Pricing: $3.490 CLP / month for Premium plan
  const PRICE_PER_PREMIUM_CLP = 3490
  const projectedMrr = activePremiumProfiles * PRICE_PER_PREMIUM_CLP
  const projectedArr = projectedMrr * 12

  // Filter and sort profiles
  const filteredProfiles = useMemo(() => {
    return profileList
      .filter((p) => {
        // Status filter
        if (statusFilter !== 'all' && p.plan !== statusFilter) {
          return false
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

  // Handle plan status change
  const handlePlanChange = (username, newPlan) => {
    setProfilePlan(username, newPlan)
    showToast(`Plan de @${username} actualizado a ${PLAN_INFO[newPlan]?.name || newPlan}`)
  }

  // Handle user deletion
  const handleDelete = (username) => {
    deleteProfile(username)
    setConfirmDeleteUser(null)
    showToast(`Portafolio de @${username} eliminado correctamente.`)
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
              onClick={() => {
                if (window.confirm('¿Restablecer todos los perfiles a los valores de demostración iniciales?')) {
                  resetToDefaults()
                  showToast('Perfiles restablecidos a los valores por defecto.')
                }
              }}
              className="px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 text-xs sm:text-sm font-medium flex items-center gap-1.5 border border-slate-700/60 transition-colors"
              title="Restablecer a valores iniciales"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          </div>

        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
        
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
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/60 text-xs font-semibold text-slate-500 dark:text-slate-400">
              <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {activePremiumProfiles} Premium
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
              {activePremiumProfiles}
            </div>
            <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/60 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>{totalProfiles > 0 ? ((activePremiumProfiles / totalProfiles) * 100).toFixed(0) : 0}% tasa de retención</span>
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
                <button
                  onClick={() => setStatusFilter('premium')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                    statusFilter === 'premium'
                      ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Suscripción Activa ({activePremiumProfiles})
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
                                p.plan === 'premium'
                                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100'
                                  : p.plan === 'trial'
                                  ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800 hover:bg-amber-100'
                                  : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800 hover:bg-rose-100'
                              }`}
                            >
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
