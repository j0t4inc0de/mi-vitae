/**
 * Cloudflare Worker Entry Point: Static Assets + Serverless API Router
 * Compatible with Cloudflare Workers (CI/CD) and Wrangler 4+
 */
import { onRequestPost as handleFlowWebhook } from './functions/api/flow-webhook.js'
import { onRequestPost as handleCreateFlowOrder } from './functions/api/create-flow-order.js'
import { onRequestPost as handleSendEmail } from './functions/api/send-email.js'
import { onRequestPost as handleUploadAvatar } from './functions/api/upload-avatar.js'
import { onRequestGet as handleHealth } from './functions/api/health.js'
import { onRequestGet as handleConfig } from './functions/api/config.js'
import { onRequestGet as handleSitemap } from './functions/api/sitemap.js'

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url)
    const pathname = url.pathname

    // Route API requests to serverless handlers
    if (pathname === '/api/config') {
      return handleConfig({ request, env })
    }
    if (pathname === '/api/flow-webhook') {
      return handleFlowWebhook({ request, env })
    }
    if (pathname === '/api/create-flow-order') {
      return handleCreateFlowOrder({ request, env })
    }
    if (pathname === '/api/send-email') {
      return handleSendEmail({ request, env })
    }
    if (pathname === '/api/upload-avatar') {
      return handleUploadAvatar({ request, env })
    }
    if (pathname === '/api/health') {
      return handleHealth({ request, env })
    }
    if (pathname === '/sitemap.xml' || pathname === '/api/sitemap') {
      return handleSitemap({ request, env })
    }

    // Google Search Console automatic HTML verification file handler
    if (/^\/google[a-zA-Z0-9_-]+\.html$/.test(pathname)) {
      const filename = pathname.slice(1)
      return new Response(`google-site-verification: ${filename}`, {
        status: 200,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'public, max-age=86400'
        }
      })
    }

    // Serve static assets with Single Page Application fallback (React SPA)
    if (env.ASSETS) {
      const response = await env.ASSETS.fetch(request)
      const contentType = response.headers.get('content-type') || ''

      // Inject runtime client environment variables into HTML without rebuilding
      if (contentType.includes('text/html') && typeof HTMLRewriter !== 'undefined') {
        const clientEnv = {
          VITE_SUPABASE_URL: env.VITE_SUPABASE_URL || env.SUPABASE_URL || 'https://ewptcglzykqvnvxxwwhm.supabase.co',
          VITE_SUPABASE_ANON_KEY: env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_umvJDktvEJKBaLpUlSJ7gA_Dr0Zcz54',
          APP_URL: env.APP_URL || 'https://mi-vitae.wearesamod.com'
        }

        return new HTMLRewriter()
          .on('head', {
            element(e) {
              if (env.GOOGLE_SITE_VERIFICATION) {
                e.append(`<meta name="google-site-verification" content="${env.GOOGLE_SITE_VERIFICATION}" />`, { html: true })
              }
              e.append(`<script>window.__ENV__ = ${JSON.stringify(clientEnv)};</script>`, { html: true })
            }
          })
          .transform(response)
      }

      return response
    }

    return new Response('Not Found', { status: 404 })
  }
}
