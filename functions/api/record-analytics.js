/**
 * Cloudflare Pages Function: Atomic Analytics Recorder Endpoint
 * Endpoint: POST /api/record-analytics
 * 
 * Safely increments analytics counters (views, contactClicks, cvDownloads / qrScans)
 * on public.profiles without being blocked by Supabase Row Level Security (RLS)
 * for anonymous mobile visitors or unauthenticated users.
 */

export async function onRequestPost(context) {
  const { request, env } = context

  const jsonHeaders = {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store, no-cache, must-revalidate',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  }

  try {
    const body = await request.json().catch(() => ({}))
    const { username, metric } = body

    if (!username || typeof username !== 'string') {
      return new Response(JSON.stringify({ error: 'Username is required' }), {
        status: 400,
        headers: jsonHeaders
      })
    }

    const cleanUsername = username.toLowerCase().trim()

    // Validate supported metrics
    const allowedMetrics = ['views', 'contactClicks', 'cvDownloads', 'qrScans', 'qr']
    if (!metric || !allowedMetrics.includes(metric)) {
      return new Response(JSON.stringify({ error: 'Invalid or unsupported metric name' }), {
        status: 400,
        headers: jsonHeaders
      })
    }

    // Map 'qr' to 'qrScans' / 'cvDownloads'
    const targetMetric = (metric === 'qr' || metric === 'qrScans') ? 'cvDownloads' : metric

    const supabaseUrl = env?.SUPABASE_URL || env?.VITE_SUPABASE_URL || 'https://ewptcglzykqvnvxxwwhm.supabase.co'
    const supabaseServiceKey = env?.SUPABASE_SERVICE_ROLE_KEY
    const supabaseAnonKey = env?.SUPABASE_ANON_KEY || env?.VITE_SUPABASE_ANON_KEY || 'sb_publishable_umvJDktvEJKBaLpUlSJ7gA_Dr0Zcz54'

    // Priority 1: Use SUPABASE_SERVICE_ROLE_KEY to perform atomic read & patch bypassing RLS
    if (supabaseServiceKey) {
      try {
        const profileRes = await fetch(
          `${supabaseUrl}/rest/v1/profiles?username=eq.${encodeURIComponent(cleanUsername)}&select=analytics`,
          {
            headers: {
              'apikey': supabaseServiceKey,
              'Authorization': `Bearer ${supabaseServiceKey}`
            }
          }
        )

        if (profileRes.ok) {
          const profiles = await profileRes.json()
          if (profiles && profiles.length > 0) {
            const currentAnalytics = profiles[0]?.analytics || { views: 0, contactClicks: 0, cvDownloads: 0, qrScans: 0 }
            
            const currentCount = Number(currentAnalytics[targetMetric] || 0)
            const newCount = currentCount + 1

            const updatedAnalytics = {
              ...currentAnalytics,
              [targetMetric]: newCount
            }

            // Keep cvDownloads and qrScans synchronized for backward and forward compatibility
            if (targetMetric === 'cvDownloads' || metric === 'qr' || metric === 'qrScans') {
              const maxQr = Math.max(Number(currentAnalytics.cvDownloads || 0), Number(currentAnalytics.qrScans || 0)) + 1
              updatedAnalytics.cvDownloads = maxQr
              updatedAnalytics.qrScans = maxQr
            }

            const patchRes = await fetch(
              `${supabaseUrl}/rest/v1/profiles?username=eq.${encodeURIComponent(cleanUsername)}`,
              {
                method: 'PATCH',
                headers: {
                  'apikey': supabaseServiceKey,
                  'Authorization': `Bearer ${supabaseServiceKey}`,
                  'Content-Type': 'application/json',
                  'Prefer': 'return=representation'
                },
                body: JSON.stringify({
                  analytics: updatedAnalytics,
                  updated_at: new Date().toISOString()
                })
              }
            )

            if (patchRes.ok) {
              const patchedData = await patchRes.json()
              return new Response(JSON.stringify({
                success: true,
                analytics: patchedData?.[0]?.analytics || updatedAnalytics,
                method: 'service_role'
              }), {
                status: 200,
                headers: jsonHeaders
              })
            }
          }
        }
      } catch (err) {
        console.warn('[record-analytics] Service role patch failed, falling back:', err)
      }
    }

    // Priority 2: Attempt RPC public.increment_analytics with anon key
    try {
      const rpcMetric = (metric === 'qr') ? 'cvDownloads' : metric
      const rpcRes = await fetch(`${supabaseUrl}/rest/v1/rpc/increment_analytics`, {
        method: 'POST',
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          target_username: cleanUsername,
          metric_name: rpcMetric
        })
      })

      if (rpcRes.ok) {
        const rpcData = await rpcRes.json()
        return new Response(JSON.stringify({
          success: true,
          analytics: rpcData,
          method: 'rpc'
        }), {
          status: 200,
          headers: jsonHeaders
        })
      }
    } catch (rpcErr) {
      console.warn('[record-analytics] RPC call failed:', rpcErr)
    }

    return new Response(JSON.stringify({
      success: false,
      error: 'Could not record analytics: no service role key or RPC function available'
    }), {
      status: 500,
      headers: jsonHeaders
    })

  } catch (error) {
    return new Response(JSON.stringify({
      error: error.message || 'Internal server error recording analytics'
    }), {
      status: 500,
      headers: jsonHeaders
    })
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    }
  })
}
