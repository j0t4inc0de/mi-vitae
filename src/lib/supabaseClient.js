import { createClient } from '@supabase/supabase-js'

let currentUrl = (typeof window !== 'undefined' && window.__ENV__?.VITE_SUPABASE_URL) || import.meta.env?.VITE_SUPABASE_URL || ''
let currentAnonKey = (typeof window !== 'undefined' && window.__ENV__?.VITE_SUPABASE_ANON_KEY) || import.meta.env?.VITE_SUPABASE_ANON_KEY || ''

export let isSupabaseConfigured = false
export let supabase = null

function applyClient(url, key) {
  if (url && key && !url.includes('xyzcompany') && url.startsWith('https://')) {
    currentUrl = url
    currentAnonKey = key
    supabase = createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    })
    isSupabaseConfigured = true
    return true
  }
  return false
}

// Initial sync attempt
applyClient(currentUrl, currentAnonKey)

let initPromise = null

/**
 * Ensures Supabase is initialized by querying /api/config if not loaded via build env
 */
export async function initSupabase() {
  if (isSupabaseConfigured && supabase) return true

  if (!initPromise) {
    initPromise = (async () => {
      // 1. Check window.__ENV__
      if (typeof window !== 'undefined' && window.__ENV__?.VITE_SUPABASE_URL && window.__ENV__?.VITE_SUPABASE_ANON_KEY) {
        if (applyClient(window.__ENV__.VITE_SUPABASE_URL, window.__ENV__.VITE_SUPABASE_ANON_KEY)) {
          return true
        }
      }

      // 2. Fetch /api/config from serverless Edge function
      if (typeof window !== 'undefined' && window.location?.origin) {
        try {
          const res = await fetch(`${window.location.origin}/api/config`)
          if (res.ok) {
            const data = await res.json()
            if (data.supabaseUrl && data.supabaseAnonKey) {
              if (applyClient(data.supabaseUrl, data.supabaseAnonKey)) {
                return true
              }
            }
          }
        } catch {
          // Graceful fallback
        }
      }
      return isSupabaseConfigured
    })()
  }

  return await initPromise
}

// Kick off auto-initialization in browser immediately
if (typeof window !== 'undefined') {
  initSupabase()
}

/**
 * Sign up a new user with Supabase Auth and initialize user profile
 */
export async function signUpWithSupabase({ email, password, username, fullName }) {
  await initSupabase()

  if (!isSupabaseConfigured || !supabase) {
    return {
      success: false,
      isMock: true,
      error: 'Supabase no está configurado. Operando en modo local.'
    }
  }

  try {
    // 1. Sign up user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          username: username.toLowerCase().trim(),
          full_name: fullName.trim()
        }
      }
    })

    if (authError) {
      return { success: false, error: authError.message }
    }

    const userId = authData.user?.id

    // 2. The trigger `on_auth_user_created` creates the profile automatically in postgres.
    // We also do an upsert as safety guarantee in case triggers are disabled:
    if (userId) {
      await supabase
        .from('profiles')
        .upsert({
          id: userId,
          username: username.toLowerCase().trim(),
          personal_info: {
            name: fullName.trim(),
            email: email.trim(),
            title: 'Profesional en Mi Vitae',
            bio: 'Bienvenido a mi portafolio profesional en línea.',
            availableForWork: true
          },
          theme: 'tech',
          plan: 'free_trial',
          plan_name: '1er Mes Gratis ($0 CLP)',
          plan_status: 'active',
          updated_at: new Date().toISOString()
        }, { onConflict: 'username' })
    }

    return { 
      success: true, 
      user: authData.user, 
      session: authData.session 
    }
  } catch (err) {
    return { success: false, error: err.message || 'Error al conectar con Supabase Auth' }
  }
}

/**
 * Sign in existing user with Supabase Auth
 */
export async function signInWithSupabase({ email, password }) {
  await initSupabase()

  if (!isSupabaseConfigured || !supabase) {
    return {
      success: false,
      isMock: true,
      error: 'Supabase no está configurado. Operando en modo local.'
    }
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password
    })

    if (error) {
      return { success: false, error: error.message }
    }

    // Fetch user profile from database
    let profile = null
    if (data.user?.id) {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single()

      profile = profileData
    }

    return {
      success: true,
      user: data.user,
      session: data.session,
      profile
    }
  } catch (err) {
    return { success: false, error: err.message || 'Error al iniciar sesión' }
  }
}

/**
 * Sign out from Supabase Auth
 */
export async function signOutFromSupabase() {
  await initSupabase()
  if (isSupabaseConfigured && supabase) {
    await supabase.auth.signOut()
  }
}

/**
 * Fetch a profile by username from Supabase
 */
export async function fetchProfileFromSupabase(username) {
  await initSupabase()
  if (!isSupabaseConfigured || !supabase || !username) return null

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('username', username.toLowerCase().trim())
      .single()

    if (error) {
      return null
    }

    return {
      username: data.username,
      theme: data.theme || 'tech',
      plan: data.plan || 'free_trial',
      planName: data.plan_name || '1er Mes Gratis ($0 CLP)',
      planStatus: data.plan_status || 'active',
      personalInfo: data.personal_info || {},
      floatingButton: data.floating_button || {},
      socialLinks: data.social_links || [],
      experience: data.experience || [],
      education: data.education || [],
      projects: data.projects || [],
      skills: data.skills || [],
      certifications: data.certifications || [],
      languages: data.languages || [],
      qrCode: data.qr_code || {},
      analytics: data.analytics || { views: 0, contactClicks: 0, cvDownloads: 0 },
      trialActivatedAt: data.trial_activated_at,
      planExpiresAt: data.plan_expires_at,
      createdAt: data.created_at
    }
  } catch {
    return null
  }
}

/**
 * Save / Update a profile in Supabase
 */
export async function saveProfileToSupabase(profile) {
  await initSupabase()
  if (!isSupabaseConfigured || !supabase || !profile?.username) return false

  try {
    const dbPayload = {
      username: profile.username.toLowerCase().trim(),
      theme: profile.theme,
      plan: profile.plan,
      plan_name: profile.planName,
      plan_status: profile.planStatus || 'active',
      personal_info: profile.personalInfo || {},
      floating_button: profile.floatingButton || {},
      social_links: profile.socialLinks || [],
      experience: profile.experience || [],
      education: profile.education || [],
      projects: profile.projects || [],
      skills: profile.skills || [],
      certifications: profile.certifications || [],
      languages: profile.languages || [],
      qr_code: profile.qrCode || {},
      analytics: profile.analytics || {},
      updated_at: new Date().toISOString()
    }

    const { error } = await supabase
      .from('profiles')
      .upsert(dbPayload, { onConflict: 'username' })

    if (error) {
      console.warn('[Supabase] Error saving profile:', error.message)
      return false
    }
    return true
  } catch (err) {
    console.warn('[Supabase] Exception saving profile:', err)
    return false
  }
}

/**
 * Check username availability in Supabase
 */
export async function checkUsernameAvailableInSupabase(username) {
  await initSupabase()
  if (!isSupabaseConfigured || !supabase || !username) return true

  try {
    const { count, error } = await supabase
      .from('profiles')
      .select('username', { count: 'exact', head: true })
      .eq('username', username.toLowerCase().trim())

    if (error) return true
    return count === 0
  } catch {
    return true
  }
}

/**
 * Save user feedback survey
 */
export async function saveFeedbackToSupabase(feedbackData) {
  await initSupabase()
  if (!isSupabaseConfigured || !supabase) return false

  try {
    const { error } = await supabase
      .from('feedbacks')
      .insert({
        username: feedbackData.username || null,
        professional_area: feedbackData.professionalArea || null,
        cv_obstacle: feedbackData.cvObstacle || null,
        referral_source: feedbackData.referralSource || null,
        rating: feedbackData.rating || 5,
        notes: feedbackData.notes || null,
        metadata: feedbackData.metadata || {}
      })

    if (error) {
      console.warn('[Supabase] Error saving feedback:', error.message)
      return false
    }
    return true
  } catch {
    return false
  }
}

/**
 * Save payment transaction
 */
export async function saveTransactionToSupabase(transactionData) {
  await initSupabase()
  if (!isSupabaseConfigured || !supabase) return false

  try {
    const { error } = await supabase
      .from('transactions')
      .insert({
        order_number: transactionData.orderNumber || transactionData.transactionId,
        flow_order_number: transactionData.flowOrder || null,
        username: transactionData.username || null,
        amount: transactionData.amount || 3490,
        currency: transactionData.currency || 'CLP',
        status: transactionData.status || 'APROBADO',
        payment_method: transactionData.paymentMethod || null,
        authorization_code: transactionData.authorizationCode || null,
        payer_email: transactionData.payerEmail || null,
        metadata: transactionData
      })

    if (error) {
      console.warn('[Supabase] Error saving transaction:', error.message)
      return false
    }
    return true
  } catch {
    return false
  }
}

/**
 * Atomic counter increment for analytics in Supabase
 */
export async function incrementAnalyticsInSupabase(username, metricName) {
  await initSupabase()
  if (!isSupabaseConfigured || !supabase || !username) return null

  try {
    const { data, error } = await supabase.rpc('increment_analytics', {
      target_username: username.toLowerCase().trim(),
      metric_name: metricName
    })

    if (error) return null
    return data
  } catch {
    return null
  }
}
