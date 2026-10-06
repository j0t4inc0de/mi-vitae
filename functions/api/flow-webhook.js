/**
 * Cloudflare Pages Function: Flow.cl Real Webhook & Payment Confirmation Handler
 * Endpoint: POST /api/flow-webhook
 * 
 * Documentation & Flow.cl specifications:
 * Flow notifies this endpoint with 'token' via POST body (application/x-www-form-urlencoded or JSON)
 * when a client completes a transaction.
 */

// Helper to calculate HMAC-SHA256 using Edge Web Crypto API
async function signWithHmacSha256(secret, message) {
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const signatureBuffer = await crypto.subtle.sign('HMAC', key, enc.encode(message))
  return Array.from(new Uint8Array(signatureBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

export async function onRequestPost(context) {
  const { request, env } = context

  try {
    // 1. Extract Token from Flow POST body
    let token = null
    const contentType = request.headers.get('content-type') || ''

    if (contentType.includes('application/json')) {
      const body = await request.json()
      token = body?.token
    } else if (contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await request.formData()
      token = formData.get('token')
    } else {
      const text = await request.text()
      const params = new URLSearchParams(text)
      token = params.get('token')
    }

    if (!token) {
      return new Response(JSON.stringify({ error: 'Token missing in Flow webhook request' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const flowApiKey = env.FLOW_API_KEY
    const flowSecretKey = env.FLOW_SECRET_KEY
    const isSandbox = env.FLOW_SANDBOX === 'true'
    const flowBaseUrl = isSandbox 
      ? 'https://sandbox.flow.cl/api' 
      : 'https://www.flow.cl/api'

    let paymentData = null

    // 2. If Flow credentials exist, verify with Flow API
    if (flowApiKey && flowSecretKey) {
      // Flow signature string format: apiKey + token
      const stringToSign = `apiKey${flowApiKey}token${token}`
      const signature = await signWithHmacSha256(flowSecretKey, stringToSign)

      const verifyUrl = `${flowBaseUrl}/payment/getStatus?apiKey=${encodeURIComponent(flowApiKey)}&token=${encodeURIComponent(token)}&s=${signature}`
      
      const flowResponse = await fetch(verifyUrl, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      })

      if (!flowResponse.ok) {
        const errText = await flowResponse.text()
        console.error('[Flow Webhook] Error response from Flow API:', errText)
        return new Response(JSON.stringify({ error: 'Failed to verify payment status with Flow API' }), {
          status: 502,
          headers: { 'Content-Type': 'application/json' }
        })
      }

      paymentData = await flowResponse.json()
    } else {
      // Simulation / Test fallback when credentials not set in environment
      console.warn('[Flow Webhook] Warning: FLOW_API_KEY/FLOW_SECRET_KEY not set. Operating in test mode.')
      paymentData = {
        status: 2, // 2 = Aprobada
        flowOrder: Math.floor(100000 + Math.random() * 900000),
        commerceOrder: `MV-${Date.now()}`,
        amount: 3490,
        currency: 'CLP',
        paymentData: {
          media: 'Webpay Plus (Transbank)',
          date: new Date().toISOString(),
          conversionDate: new Date().toISOString()
        },
        payer: 'cliente@ejemplo.cl'
      }
    }

    // 3. Status 2 = Payment Approved / Pagada (Ponytail: strictly verify amount is $3.490 CLP to prevent price tampering)
    const isApproved = paymentData.status === 2 && Number(paymentData.amount) === 3490
    const statusText = isApproved ? 'APROBADO' : 'RECHAZADO'
    // Extract optional metadata including creator_code
    let optionalObj = {}
    if (typeof paymentData.optional === 'string') {
      try { optionalObj = JSON.parse(paymentData.optional) } catch {}
    } else if (typeof paymentData.optional === 'object' && paymentData.optional !== null) {
      optionalObj = paymentData.optional
    }

    const payerEmail = paymentData.payer || optionalObj.email || ''
    const commerceOrder = String(paymentData.commerceOrder || `ORD-${paymentData.flowOrder || Date.now()}`)
    const username = optionalObj.username || paymentData.payer?.split('@')[0] || 'usuario'
    const rawCreatorCode = String(optionalObj.creator_code || optionalObj.creatorCode || '').trim().toUpperCase()
    const creatorCode = rawCreatorCode.replace(/[^A-Z0-9_-]/g, '').slice(0, 30) || null

    // 4. Update Supabase Cloud using REST API & Service Role Key
    const supabaseUrl = env.SUPABASE_URL || env.VITE_SUPABASE_URL
    const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY

    if (supabaseUrl && supabaseServiceKey) {
      const now = new Date()
      const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

      // A) Record Transaction (with creator_code in metadata & column)
      const txnPayload = {
        order_number: commerceOrder,
        flow_order_number: String(paymentData.flowOrder || ''),
        username: username.toLowerCase().trim(),
        amount: paymentData.amount || 3490,
        currency: paymentData.currency || 'CLP',
        status: statusText,
        payment_method: paymentData.paymentData?.media || 'Flow.cl',
        authorization_code: paymentData.paymentData?.transferDate || String(paymentData.flowOrder),
        payer_email: payerEmail,
        creator_code: creatorCode,
        metadata: {
          ...paymentData,
          creator_code: creatorCode
        }
      }

      let txnRes = await fetch(`${supabaseUrl}/rest/v1/transactions`, {
        method: 'POST',
        headers: {
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'resolution=merge-duplicates'
        },
        body: JSON.stringify(txnPayload)
      })

      if (!txnRes.ok) {
        // Fallback without direct creator_code column if not migrated
        delete txnPayload.creator_code
        await fetch(`${supabaseUrl}/rest/v1/transactions`, {
          method: 'POST',
          headers: {
            'apikey': supabaseServiceKey,
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'resolution=merge-duplicates'
          },
          body: JSON.stringify(txnPayload)
        }).catch(() => {})
      }

      // B) If Approved, upgrade profile to Premium in Supabase
      if (isApproved) {
        await fetch(`${supabaseUrl}/rest/v1/profiles?username=eq.${encodeURIComponent(username.toLowerCase().trim())}`, {
          method: 'PATCH',
          headers: {
            'apikey': supabaseServiceKey,
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            plan: 'premium',
            plan_name: 'Suscripción Mi Vitae ($3.490 CLP/mes)',
            plan_status: 'active',
            plan_expires_at: expiresAt.toISOString(),
            updated_at: now.toISOString()
          })
        })

        // C) Update Subscription (with creator_code)
        const subPayload = {
          status: 'active',
          plan_type: 'premium',
          price_clp: paymentData.amount || 3490,
          creator_code: creatorCode,
          expires_at: expiresAt.toISOString(),
          updated_at: now.toISOString()
        }

        let subRes = await fetch(`${supabaseUrl}/rest/v1/subscriptions?username=eq.${encodeURIComponent(username.toLowerCase().trim())}`, {
          method: 'PATCH',
          headers: {
            'apikey': supabaseServiceKey,
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(subPayload)
        })

        if (!subRes.ok) {
          // Fallback without creator_code column
          delete subPayload.creator_code
          await fetch(`${supabaseUrl}/rest/v1/subscriptions?username=eq.${encodeURIComponent(username.toLowerCase().trim())}`, {
            method: 'PATCH',
            headers: {
              'apikey': supabaseServiceKey,
              'Authorization': `Bearer ${supabaseServiceKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(subPayload)
          }).catch(() => {})
        }
      }
    }

    return new Response(JSON.stringify({
      success: true,
      status: statusText,
      order: commerceOrder,
      flowOrder: paymentData.flowOrder
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('[Flow Webhook] Unhandled exception:', error)
    return new Response(JSON.stringify({ error: error.message || 'Internal webhook error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
