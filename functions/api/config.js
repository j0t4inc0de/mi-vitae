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
  const paddleClientToken = env.VITE_PADDLE_CLIENT_TOKEN || env.PADDLE_CLIENT_TOKEN || ''
  const paddlePriceId = env.VITE_PADDLE_PRICE_ID || env.PADDLE_PRICE_ID || ''
  const paddleEnv = env.VITE_PADDLE_ENV || env.PADDLE_ENVIRONMENT || 'production'

  return new Response(JSON.stringify({
    supabaseUrl,
    supabaseAnonKey,
    appUrl,
    paddleClientToken,
    paddlePriceId,
    paddleEnv,
    configured: Boolean(supabaseUrl && supabaseAnonKey)
  }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store, no-cache, must-revalidate'
    }
  })
}
