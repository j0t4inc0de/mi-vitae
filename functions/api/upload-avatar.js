/**
 * Cloudflare Pages Function: Upload Avatar / Portfolio Assets to Cloudflare R2
 * Endpoint: POST /api/upload-avatar
 * 
 * Direct R2 integration with 0 egress fees.
 */

export async function onRequestPost(context) {
  const { request, env } = context

  try {
    const contentType = request.headers.get('content-type') || ''
    let fileData = null
    let filename = `avatar-${Date.now()}`
    let mimeType = 'image/jpeg'

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData()
      const file = formData.get('file')
      const username = formData.get('username') || 'user'

      if (!file) {
        return new Response(JSON.stringify({ error: 'No file found in request' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        })
      }

      fileData = await file.arrayBuffer()
      mimeType = file.type || 'image/jpeg'
      const ext = mimeType.split('/')[1] || 'jpg'
      filename = `avatars/${username}-${Date.now()}.${ext}`
    } else if (contentType.includes('application/json')) {
      const body = await request.json()
      const { base64, username = 'user', extension = 'jpg' } = body

      if (!base64) {
        return new Response(JSON.stringify({ error: 'Missing base64 data' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        })
      }

      const raw = base64.replace(/^data:image\/\w+;base64,/, '')
      const binary = atob(raw)
      const bytes = new Uint8Array(binary.length)
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i)
      }
      fileData = bytes.buffer
      filename = `avatars/${username}-${Date.now()}.${extension}`
      mimeType = `image/${extension}`
    } else {
      return new Response(JSON.stringify({ error: 'Unsupported Content-Type' }), {
        status: 415,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // 1. If Cloudflare R2 bucket is bound to Pages project
    if (env.AVATARS_BUCKET) {
      await env.AVATARS_BUCKET.put(filename, fileData, {
        httpMetadata: { contentType: mimeType }
      })

      const publicDomain = env.R2_PUBLIC_DOMAIN || 'https://assets.wearesamod.com'
      const publicUrl = `${publicDomain}/${filename}`

      return new Response(JSON.stringify({
        success: true,
        url: publicUrl,
        key: filename
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // 2. Simulated CDN fallback for local development or preview deployments
    const mockCdnUrl = `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80`
    return new Response(JSON.stringify({
      success: true,
      simulated: true,
      url: mockCdnUrl,
      key: filename,
      message: 'R2 Bucket no asignado aún en wrangler.toml / Cloudflare. Se retorna URL de demostración.'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message || 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
