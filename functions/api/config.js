/**
 * Cloudflare Pages Function: Runtime Public Config
 * Endpoint: GET /api/config
 * 
 * Securely shares public client configuration (Supabase URL & Anon Key)
 * with the browser without requiring a rebuild.
 */

export async function onRequestGet(context) {
  const { env } = context

  const supabaseUrl = env.VITE_SUPABASE_URL || env.SUPABASE_URL || 'https://ewptcglzykqvnvxxwwhm.supabase.co'
  const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_umvJDktvEJKBaLpUlSJ7gA_Dr0Zcz54'
  const appUrl = env.APP_URL || 'https://mivitae.wearesamod.com'
  const paypalClientId = env.VITE_PAYPAL_CLIENT_ID || env.PAYPAL_CLIENT_ID || ''
  const paypalEnv = env.VITE_PAYPAL_ENV || env.PAYPAL_ENVIRONMENT || 'production'

  return new Response(JSON.stringify({
    supabaseUrl,
    supabaseAnonKey,
    appUrl,
    paypalClientId,
    paypalEnv,
    configured: Boolean(supabaseUrl && supabaseAnonKey)
  }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store, no-cache, must-revalidate'
    }
  })
}
