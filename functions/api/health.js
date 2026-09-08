/**
 * Cloudflare Pages Function: Health Check & System Info
 * Endpoint: GET /api/health
 */

export async function onRequestGet(context) {
  const { env } = context

  return new Response(JSON.stringify({
    status: 'online',
    platform: 'Cloudflare Pages & Functions',
    timestamp: new Date().toISOString(),
    environment: env.ENVIRONMENT || 'production',
    services: {
      supabase: Boolean(env.SUPABASE_URL || env.VITE_SUPABASE_URL),
      flow: Boolean(env.FLOW_API_KEY && env.FLOW_SECRET_KEY),
      resend: Boolean(env.RESEND_API_KEY),
      r2: Boolean(env.AVATARS_BUCKET)
    }
  }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store'
    }
  })
}
