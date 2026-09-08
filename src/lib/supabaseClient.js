import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  !supabaseUrl.includes('xyzcompany') && 
  supabaseUrl.startsWith('https://')
)

if (!isSupabaseConfigured) {
  console.info(
    'ℹ️ [Mi Vitae] Supabase no está configurado aún o usa valores por defecto. ' +
    'Para conectar tu backend real, define VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en el archivo .env'
  )
}

// Supabase client instance
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    })
  : null

/**
 * Sign up a new user with Supabase Auth and initialize user profile
 */
export async function signUpWithSupabase({ email, password, username, fullName }) {
  if (!isSupabaseConfigured || !supabase) {
    return {
      success: false,
      isMock: true,
      error: 'Supabase no está configurado. Por favor ingresa tus credenciales en el archivo .env.'
    }
  }

  // 1. Sign up user in Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
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

  // 2. Insert profile record in 'profiles' table if user was created
  if (userId) {
    const { error: profileError } = await supabase
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
        created_at: new Date().toISOString()
      }, { onConflict: 'username' })

    if (profileError) {
      console.warn('Advertencia al insertar perfil en Supabase:', profileError.message)
    }
  }

  return { 
    success: true, 
    user: authData.user, 
    session: authData.session 
  }
}

/**
 * Sign in existing user with Supabase Auth
 */
export async function signInWithSupabase({ email, password }) {
  if (!isSupabaseConfigured || !supabase) {
    return {
      success: false,
      isMock: true,
      error: 'Supabase no está configurado. Por favor ingresa tus credenciales en el archivo .env.'
    }
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
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
}

/**
 * Sign out from Supabase Auth
 */
export async function signOutFromSupabase() {
  if (isSupabaseConfigured && supabase) {
    await supabase.auth.signOut()
  }
}
