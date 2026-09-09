import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { INITIAL_MOCK_PROFILES } from '../data/mockProfiles'
import {
  isSupabaseConfigured,
  saveProfileToSupabase,
  fetchProfileFromSupabase,
  checkUsernameAvailableInSupabase,
  saveFeedbackToSupabase,
  saveTransactionToSupabase,
  incrementAnalyticsInSupabase
} from '../lib/supabaseClient'
import { sendWelcomeEmail } from '../lib/emailService'

export const useProfileStore = create(
  persist(
    (set, get) => ({
      // State
      profiles: INITIAL_MOCK_PROFILES,
      activeUsername: 'carlos_dev', // Default active profile for editor/dashboard

      // Dashboard Save & Reset Coordination State (Navbar <-> DashboardPage)
      isDashboardSaving: false,
      dashboardSaveTrigger: 0,
      dashboardResetTrigger: 0,
      triggerDashboardSave: () => set((state) => ({ dashboardSaveTrigger: state.dashboardSaveTrigger + 1 })),
      triggerDashboardReset: () => set((state) => ({ dashboardResetTrigger: state.dashboardResetTrigger + 1 })),
      setIsDashboardSaving: (val) => set({ isDashboardSaving: val }),

      // Global Modal States for instant activation from any view
      isRegisterModalOpen: false,
      registerModalPrefill: {},
      isFlowModalOpen: false,
      flowModalData: {},

      // Global Loading Indicator State
      isGlobalLoading: false,
      loadingMessage: '',

      showLoading: (message = 'Cargando...') => {
        set({ isGlobalLoading: true, loadingMessage: message })
      },

      hideLoading: () => {
        set({ isGlobalLoading: false, loadingMessage: '' })
      },

      openRegisterModal: (prefill = {}) => {
        set({ isRegisterModalOpen: true, registerModalPrefill: prefill })
      },

      closeRegisterModal: () => {
        set({ isRegisterModalOpen: false })
      },

      openFlowModal: (data = {}) => {
        set({ isFlowModalOpen: true, flowModalData: data })
      },

      closeFlowModal: () => {
        set({ isFlowModalOpen: false })
      },

      // Getters & Lookups
      getProfileByUsername: (username) => {
        if (!username) return null
        const normalized = username.toLowerCase().trim()
        const profiles = get().profiles
        return profiles[normalized] || null
      },

      // Fetch profile from Supabase Cloud if available
      fetchRemoteProfile: async (username) => {
        if (!username || !isSupabaseConfigured) return null
        const normalized = username.toLowerCase().trim()
        try {
          const remote = await fetchProfileFromSupabase(normalized)
          if (remote) {
            set((state) => ({
              profiles: {
                ...state.profiles,
                [normalized]: {
                  ...(state.profiles[normalized] || {}),
                  ...remote
                }
              }
            }))
            return remote
          }
        } catch (err) {
          console.warn('[profileStore] Error fetching remote profile:', err)
        }
        return null
      },

      remoteTakenUsernames: [],

      isUsernameAvailable: (username) => {
        if (!username || username.trim() === '') return false
        const normalized = username.toLowerCase().trim()
        
        // Reserved system routes
        const reserved = ['dashboard', 'admin', 'login', 'register', 'api', 'app', 'settings', 'help', 'pricing']
        if (reserved.includes(normalized)) return false

        const profiles = get().profiles
        if (profiles[normalized]) return false

        const remoteTaken = get().remoteTakenUsernames || []
        if (remoteTaken.includes(normalized)) return false

        return true
      },

      checkUsernameAvailability: async (username) => {
        if (!username || username.trim() === '') return false
        const normalized = username.toLowerCase().trim()
        
        // Reserved system routes
        const reserved = ['dashboard', 'admin', 'login', 'register', 'api', 'app', 'settings', 'help', 'pricing']
        if (reserved.includes(normalized)) return false

        const profiles = get().profiles
        if (profiles[normalized]) return false

        if (isSupabaseConfigured) {
          try {
            const available = await checkUsernameAvailableInSupabase(normalized)
            if (!available) {
              set((state) => ({
                remoteTakenUsernames: [...new Set([...(state.remoteTakenUsernames || []), normalized])]
              }))
              return false
            }
          } catch {
            // graceful fallback
          }
        }
        return true
      },

      getActiveProfile: () => {
        const { profiles, activeUsername } = get()
        return profiles[activeUsername] || Object.values(profiles)[0] || null
      },

      setActiveUsername: (username) => {
        if (username) {
          set({ activeUsername: username.toLowerCase().trim() })
        }
      },

      // Profile Mutators
      updateProfile: (usernameOrData, possibleData) => {
        let username = get().activeUsername
        let updatedData = usernameOrData

        // Support both updateProfile(data) for active profile and updateProfile(username, data)
        if (typeof usernameOrData === 'string' && possibleData) {
          username = usernameOrData
          updatedData = possibleData
        }

        const normalized = username.toLowerCase().trim()
        const currentProfile = get().profiles[normalized] || {}

        set((state) => ({
          profiles: {
            ...state.profiles,
            [normalized]: {
              ...currentProfile,
              ...updatedData,
              username: normalized, // enforce consistency
              plan: updatedData.plan || currentProfile.plan || 'free_trial',
              planName: updatedData.planName || currentProfile.planName || '1er Mes Gratis ($0 CLP)',
              personalInfo: {
                ...(currentProfile.personalInfo || {}),
                ...(updatedData.personalInfo || {})
              },
              floatingButton: {
                ...(currentProfile.floatingButton || {}),
                ...(updatedData.floatingButton || {})
              },
              analytics: {
                ...(currentProfile.analytics || {}),
                ...(updatedData.analytics || {})
              }
            }
          }
        }))

        if (isSupabaseConfigured) {
          const latest = get().profiles[normalized]
          if (latest) saveProfileToSupabase(latest)
        }
      },

      setTheme: (themeOrUsername, maybeTheme) => {
        let username = get().activeUsername
        let theme = themeOrUsername

        if (maybeTheme) {
          username = themeOrUsername
          theme = maybeTheme
        }

        const normalized = username.toLowerCase().trim()
        const currentProfile = get().profiles[normalized]
        if (!currentProfile) return

        set((state) => ({
          profiles: {
            ...state.profiles,
            [normalized]: {
              ...currentProfile,
              theme
            }
          }
        }))

        if (isSupabaseConfigured) {
          const latest = get().profiles[normalized]
          if (latest) saveProfileToSupabase(latest)
        }
      },

      // Analytics Actions
      recordView: (username) => {
        if (!username) return
        const normalized = username.toLowerCase().trim()
        const profile = get().profiles[normalized]
        if (!profile) return

        const currentViews = profile.analytics?.views || 0
        set((state) => ({
          profiles: {
            ...state.profiles,
            [normalized]: {
              ...profile,
              analytics: {
                ...profile.analytics,
                views: currentViews + 1
              }
            }
          }
        }))

        if (isSupabaseConfigured) {
          incrementAnalyticsInSupabase(normalized, 'views')
        }
      },

      recordClick: (username, type = 'contact') => {
        if (!username) return
        const normalized = username.toLowerCase().trim()
        const profile = get().profiles[normalized]
        if (!profile) return

        const analytics = profile.analytics || { views: 0, contactClicks: 0, cvDownloads: 0 }
        
        let newAnalytics = { ...analytics }
        const metricName = (type === 'cv' || type === 'download') ? 'cvDownloads' : 'contactClicks'
        if (type === 'cv' || type === 'download') {
          newAnalytics.cvDownloads = (analytics.cvDownloads || 0) + 1
        } else {
          newAnalytics.contactClicks = (analytics.contactClicks || 0) + 1
        }

        set((state) => ({
          profiles: {
            ...state.profiles,
            [normalized]: {
              ...profile,
              analytics: newAnalytics
            }
          }
        }))

        if (isSupabaseConfigured) {
          incrementAnalyticsInSupabase(normalized, metricName)
        }
      },

      recordDownload: (username) => {
        get().recordClick(username, 'download')
      },

      // Create or import new profile with free trial & feedback
      addProfile: (newProfile) => {
        if (!newProfile || !newProfile.username) return false
        const normalized = newProfile.username.toLowerCase().trim()

        const profileWithDefaults = {
          plan: 'free_trial',
          planName: '1er Mes Gratis ($0 CLP)',
          planStatus: 'active',
          trialActivatedAt: new Date().toISOString(),
          ...newProfile,
          username: normalized
        }

        set((state) => ({
          profiles: {
            ...state.profiles,
            [normalized]: profileWithDefaults
          },
          activeUsername: normalized
        }))

        if (isSupabaseConfigured) {
          saveProfileToSupabase(profileWithDefaults)
        }
        return true
      },

      // Activate Free Trial with Feedback responses
      activateFreeTrial: (username, feedbackData = {}) => {
        const normalized = (username || get().activeUsername).toLowerCase().trim()
        const profile = get().profiles[normalized]
        if (!profile) return false

        const now = new Date()
        const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) // 30 days free trial

        set((state) => ({
          profiles: {
            ...state.profiles,
            [normalized]: {
              ...profile,
              plan: 'free_trial',
              planName: '1er Mes Gratis ($0 CLP)',
              planStatus: 'active',
              feedbackSurveyCompleted: true,
              trialActivatedAt: now.toISOString(),
              planExpiresAt: expiresAt.toISOString(),
              feedback: {
                ...(profile.feedback || {}),
                ...feedbackData,
                submittedAt: now.toISOString()
              }
            }
          },
          activeUsername: normalized
        }))

        if (isSupabaseConfigured) {
          const updated = get().profiles[normalized]
          if (updated) saveProfileToSupabase(updated)
          saveFeedbackToSupabase({ username: normalized, ...feedbackData })
        }

        // Send Welcome & Free trial activation transactional email
        const targetEmail = profile.personalInfo?.email || feedbackData?.email
        if (targetEmail) {
          sendWelcomeEmail({
            to: targetEmail,
            username: normalized,
            name: profile.personalInfo?.name || normalized,
            expiresAt: expiresAt.toISOString()
          }).catch((err) => {
            console.warn('[profileStore] Notice: Welcome email delivery deferred:', err)
          })
        }

        return true
      },

      // Upgrade profile to Premium via Flow.cl Simulation
      upgradeToPremium: (username, transactionData = {}) => {
        const normalized = (username || get().activeUsername).toLowerCase().trim()
        const profile = get().profiles[normalized]
        if (!profile) return false

        const now = new Date()
        const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

        const transaction = {
          transactionId: transactionData.transactionId || `FLW-${Math.floor(100000 + Math.random() * 900000)}`,
          amount: 3490,
          currency: 'CLP',
          paymentMethod: transactionData.paymentMethod || 'Webpay Plus (Transbank)',
          date: now.toISOString(),
          status: 'APROBADO',
          payerEmail: transactionData.payerEmail || profile.personalInfo?.email || '',
          authorizationCode: transactionData.authorizationCode || String(Math.floor(100000 + Math.random() * 900000)),
          ...transactionData
        }

        set((state) => ({
          profiles: {
            ...state.profiles,
            [normalized]: {
              ...profile,
              plan: 'premium',
              planName: 'Suscripción Mi Vitae ($3.490 CLP/mes)',
              planStatus: 'active',
              upgradedAt: now.toISOString(),
              planExpiresAt: expiresAt.toISOString(),
              lastTransaction: transaction,
              transactionsHistory: [
                ...(profile.transactionsHistory || []),
                transaction
              ]
            }
          },
          activeUsername: normalized
        }))

        if (isSupabaseConfigured) {
          const updated = get().profiles[normalized]
          if (updated) saveProfileToSupabase(updated)
          saveTransactionToSupabase({ ...transaction, username: normalized })
        }
        return transaction
      },

      // Reset mock profiles to defaults while preserving real custom user profiles
      resetToDefaults: () => {
        const currentProfiles = get().profiles
        const preservedUserProfiles = {}
        const mockKeys = ['carlos_dev', 'antonia_ux', 'valeria_psico', 'rodrigo_ops', 'abogado_consultor']

        Object.keys(currentProfiles).forEach((key) => {
          if (!mockKeys.includes(key)) {
            preservedUserProfiles[key] = currentProfiles[key]
          }
        })

        set({
          profiles: {
            ...INITIAL_MOCK_PROFILES,
            ...preservedUserProfiles
          },
          activeUsername: 'carlos_dev'
        })
      }
    }),
    {
      name: 'mi-vitae-profiles-storage',
      storage: createJSONStorage(() => localStorage),
      version: 1,
      // Merge with INITIAL_MOCK_PROFILES if missing
      merge: (persistedState, currentState) => {
        return {
          ...currentState,
          ...persistedState,
          isGlobalLoading: false,
          loadingMessage: '',
          isDashboardSaving: false,
          dashboardSaveTrigger: 0,
          dashboardResetTrigger: 0,
          profiles: {
            ...INITIAL_MOCK_PROFILES,
            ...(persistedState?.profiles || {})
          }
        }
      }
    }
  )
)
