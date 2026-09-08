/**
 * Cloudflare Pages Function: Runtime Public Config
 * Endpoint: GET /api/config
 * 
 * Securely shares public client configuration (Supabase URL & Anon Key)
 * with the browser without requiring a rebuild.
 */

export async function onRequestGet(context) {
  const { env } = context

  const supabaseUrl = env.VITE_SUPABASE_URL || env.SUPABASE_URL || ''
  const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || ''
  const appUrl = env.APP_URL || 'https://mivitae.wearesamod.com'

  return new Response(JSON.stringify({
    supabaseUrl,
    supabaseAnonKey,
    appUrl,
    configured: Boolean(supabaseUrl && supabaseAnonKey)
  }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store, no-cache, must-revalidate'
    }
  })
}
