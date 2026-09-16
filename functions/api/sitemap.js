/**
 * Cloudflare Pages Function: Dynamic XML Sitemap for Google Search Console & SEO
 * Endpoint: GET /sitemap.xml (or /api/sitemap)
 *
 * Generates an up-to-date sitemap combining root landing page, demo archetypes,
 * and live registered user portfolios from Supabase.
 */

const DEMO_ARCHETYPES = [
  'carlos_dev',
  'antonia_ux',
  'valeria_psico',
  'rodrigo_ops',
  'abogado_consultor'
]

export async function onRequestGet(context) {
  const { env } = context

  const appUrl = (env?.APP_URL || 'https://mi-vitae.wearesamod.com').replace(/\/$/, '')
  const supabaseUrl = env?.VITE_SUPABASE_URL || env?.SUPABASE_URL || 'https://ewptcglzykqvnvxxwwhm.supabase.co'
  const supabaseAnonKey = env?.VITE_SUPABASE_ANON_KEY || 'sb_publishable_umvJDktvEJKBaLpUlSJ7gA_Dr0Zcz54'

  const todayIso = new Date().toISOString().split('T')[0]
  const userEntries = new Map()

  // 1. Add demo archetypes
  for (const username of DEMO_ARCHETYPES) {
    userEntries.set(username, {
      loc: `${appUrl}/${username}`,
      lastmod: todayIso,
      changefreq: 'weekly',
      priority: '0.8'
    })
  }

  // 2. Fetch all public profiles directly from Supabase REST API (secured by public SELECT RLS)
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/profiles?select=username,updated_at&order=updated_at.desc`, {
      method: 'GET',
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Accept': 'application/json'
      }
    })

    if (response.ok) {
      const profiles = await response.json()
      if (Array.isArray(profiles)) {
        for (const p of profiles) {
          const u = (p?.username || '').trim().toLowerCase()
          // Skip internal/reserved usernames
          if (!u || ['dashboard', 'admin', 'login', 'register', 'auth', 'api'].includes(u)) continue

          const lastmod = p.updated_at ? p.updated_at.split('T')[0] : todayIso
          userEntries.set(u, {
            loc: `${appUrl}/${encodeURIComponent(u)}`,
            lastmod,
            changefreq: 'weekly',
            priority: '0.9'
          })
        }
      }
    }
  } catch (err) {
    console.warn('[Sitemap] Supabase profile fetch failed, using fallback entries:', err)
  }

  // 3. Build valid XML structure
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'

  // Root landing page
  xml += '  <url>\n'
  xml += `    <loc>${appUrl}/</loc>\n`
  xml += `    <lastmod>${todayIso}</lastmod>\n`
  xml += '    <changefreq>daily</changefreq>\n'
  xml += '    <priority>1.0</priority>\n'
  xml += '  </url>\n'

  // Profile URLs
  for (const entry of userEntries.values()) {
    xml += '  <url>\n'
    xml += `    <loc>${entry.loc}</loc>\n`
    xml += `    <lastmod>${entry.lastmod}</lastmod>\n`
    xml += `    <changefreq>${entry.changefreq}</changefreq>\n`
    xml += `    <priority>${entry.priority}</priority>\n`
    xml += '  </url>\n'
  }

  xml += '</urlset>'

  return new Response(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600'
    }
  })
}
