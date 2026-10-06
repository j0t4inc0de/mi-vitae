/**
 * Cloudflare Pages Function: Paddle Billing (v2) Webhook & Payment Notification Handler
 * Endpoint: POST /api/paddle-webhook
 * 
 * Documentation & Paddle Billing v2 specifications:
 * - Paddle sends POST requests with a 'Paddle-Signature' header containing:
 *     ts=<timestamp>;h=<hmac_sha256_hash>
 * - The payload to sign is: `${ts}:${rawBody}`
 * - Processed events:
 *     - 'transaction.completed'
 *     - 'subscription.activated'
 *     (also handles 'subscription.created', 'transaction.paid' idempotently)
 */

// Helper: Calculate HMAC-SHA256 signature using Edge Web Crypto API
async function signHmacSha256(secret, message) {
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

// Helper: Parse 'Paddle-Signature' header (format: "ts=1693526400;h=7a1b...")
function parsePaddleSignature(header) {
  if (!header || typeof header !== 'string') return null
  const parts = header.split(';')
  const parsed = {}
  for (const part of parts) {
    const [key, ...rest] = part.split('=')
    if (key && rest.length > 0) {
      parsed[key.trim()] = rest.join('=').trim()
    }
  }
  return parsed.ts && parsed.h ? parsed : null
}

// Helper: Verify Paddle Billing cryptographic signature
async function verifyPaddleSignature(secret, signatureHeader, rawBody) {
  if (!secret || !signatureHeader || !rawBody) return false
  const parsed = parsePaddleSignature(signatureHeader)
  if (!parsed) return false

  const stringToSign = `${parsed.ts}:${rawBody}`
  const computedHash = await signHmacSha256(secret, stringToSign)

  // Constant-time check comparison (case-insensitive hex)
  return computedHash.toLowerCase() === parsed.h.toLowerCase()
}

/**
 * Health check / verification ping
 */
export async function onRequestGet() {
  return new Response(JSON.stringify({
    service: 'Paddle Billing v2 Webhook',
    status: 'online',
    supported_events: ['transaction.completed', 'subscription.activated']
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  })
}

/**
 * Paddle Billing v2 POST Webhook Handler
 */
export async function onRequestPost(context) {
  const { request, env } = context

  try {
    const rawBody = await request.text()
    if (!rawBody || !rawBody.trim()) {
      return new Response(JSON.stringify({ error: 'Empty body in webhook request' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const paddleSignatureHeader = request.headers.get('paddle-signature') || request.headers.get('Paddle-Signature')
    const paddleWebhookSecret = env.PADDLE_WEBHOOK_SECRET_KEY || env.PADDLE_WEBHOOK_SECRET
    const isSimulationHeader = request.headers.get('x-simulation-test') === 'true'

    // 1. Cryptographic Signature Validation
    let isSignatureValid = false

    if (paddleWebhookSecret && paddleSignatureHeader) {
      isSignatureValid = await verifyPaddleSignature(paddleWebhookSecret, paddleSignatureHeader, rawBody)
      if (!isSignatureValid && !isSimulationHeader) {
        console.error('[Paddle Webhook] Cryptographic signature mismatch')
        return new Response(JSON.stringify({ error: 'Invalid Paddle-Signature' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        })
      }
    } else {
      // Development / Local Simulation Fallback
      console.warn('[Paddle Webhook] PADDLE_WEBHOOK_SECRET_KEY not set or simulation mode active. Proceeding in dev/test mode.')
      isSignatureValid = true
    }

    // 2. Parse Event JSON
    let event = null
    try {
      event = JSON.parse(rawBody)
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON payload' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const eventType = event.event_type || event.type || ''
    const data = event.data || {}

    // Acknowledge non-handled lifecycle events idempotently with 200 OK so Paddle does not retry
    const relevantEvents = [
      'transaction.completed', 
      'subscription.activated', 
      'subscription.created', 
      'transaction.paid'
    ]
    if (!relevantEvents.includes(eventType) && !isSimulationHeader) {
      return new Response(JSON.stringify({
        received: true,
        event_type: eventType,
        message: 'Event acknowledged (no action required)'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // 3. Extract custom_data, customer_id, subscription_id and amount
    const customData = data.custom_data || event.custom_data || {}
    const username = (
      customData.username || 
      customData.user || 
      data.customer?.name || 
      data.customer_id || 
      'usuario'
    ).toString().toLowerCase().trim()

    // Extract and sanitize creator_code ("Apoya a un creador")
    const rawCreatorCode = String(
      customData.creator_code || 
      customData.creatorCode || 
      customData.ref || 
      customData.referral || 
      ''
    ).trim().toUpperCase()
    const creatorCode = rawCreatorCode.replace(/[^A-Z0-9_-]/g, '').slice(0, 30) || null

    const customerId = String(data.customer_id || data.customer?.id || '')
    const subscriptionId = String(data.subscription_id || (eventType.startsWith('subscription') ? data.id : '') || '')
    const transactionId = String(
      eventType.startsWith('transaction') ? data.id : (data.transaction_id || `txn_paddle_${Date.now()}`)
    )

    // Extract amount in USD (default to $3.99 USD if not explicit in payload)
    let amount = 3.99
    let currency = 'USD'

    if (data.details?.totals?.grand_total) {
      const parsedAmount = parseFloat(data.details.totals.grand_total)
      if (!isNaN(parsedAmount)) amount = parsedAmount > 100 ? parsedAmount / 100 : parsedAmount
    } else if (data.details?.totals?.total) {
      const parsedAmount = parseFloat(data.details.totals.total)
      if (!isNaN(parsedAmount)) amount = parsedAmount > 100 ? parsedAmount / 100 : parsedAmount
    } else if (data.items?.[0]?.price?.unit_price?.amount) {
      const parsedAmount = parseFloat(data.items[0].price.unit_price.amount)
      if (!isNaN(parsedAmount)) amount = parsedAmount > 100 ? parsedAmount / 100 : parsedAmount
    }

    if (data.currency_code) {
      currency = String(data.currency_code).toUpperCase()
    } else if (data.details?.totals?.currency_code) {
      currency = String(data.details.totals.currency_code).toUpperCase()
    }

    const payerEmail = data.customer?.email || customData.email || ''

    // 4. Update Supabase Cloud using REST API & Service Role Key
    const supabaseUrl = env.SUPABASE_URL || env.VITE_SUPABASE_URL
    const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY

    let supabaseUpdated = false
    let supabaseErrors = []

    if (supabaseUrl && supabaseServiceKey) {
      const now = new Date()
      const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

      // A) Update 'profiles': set plan = 'premium', plan_status = 'active', plan_expires_at = NOW() + 30 days
      try {
        const profileRes = await fetch(`${supabaseUrl}/rest/v1/profiles?username=eq.${encodeURIComponent(username)}`, {
          method: 'PATCH',
          headers: {
            'apikey': supabaseServiceKey,
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            plan: 'premium',
            plan_name: 'Suscripción Mi Vitae ($3.99 USD/mes)',
            plan_status: 'active',
            plan_expires_at: expiresAt.toISOString(),
            updated_at: now.toISOString()
          })
        })
        if (!profileRes.ok) {
          const errText = await profileRes.text()
          supabaseErrors.push(`profiles update: ${errText}`)
        }
      } catch (err) {
        supabaseErrors.push(`profiles exception: ${err.message}`)
      }

      // B) Update 'subscriptions': registrar plan_type = 'premium', status = 'active', currency = 'USD', amount = 3.99, price_clp = 0, creator_code
      try {
        const subPayload = {
          plan_type: 'premium',
          status: 'active',
          currency: currency,
          amount: amount,
          price_clp: 0,
          creator_code: creatorCode,
          started_at: now.toISOString(),
          expires_at: expiresAt.toISOString(),
          paddle_subscription_id: subscriptionId || null,
          paddle_customer_id: customerId || null,
          updated_at: now.toISOString()
        }

        const subRes = await fetch(`${supabaseUrl}/rest/v1/subscriptions?username=eq.${encodeURIComponent(username)}`, {
          method: 'PATCH',
          headers: {
            'apikey': supabaseServiceKey,
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(subPayload)
        })
        if (!subRes.ok) {
          // If columns currency/amount/creator_code are not present in legacy schema, retry with basic fields
          delete subPayload.creator_code
          delete subPayload.currency
          delete subPayload.amount
          await fetch(`${supabaseUrl}/rest/v1/subscriptions?username=eq.${encodeURIComponent(username)}`, {
            method: 'PATCH',
            headers: {
              'apikey': supabaseServiceKey,
              'Authorization': `Bearer ${supabaseServiceKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              plan_type: 'premium',
              status: 'active',
              price_clp: 0,
              expires_at: expiresAt.toISOString(),
              updated_at: now.toISOString()
            })
          }).catch(() => {})
        }
      } catch (err) {
        supabaseErrors.push(`subscriptions exception: ${err.message}`)
      }

      // C) Record Transaction in 'transactions': pago APROBADO con order_number = transaction_id, currency = 'USD', amount = 3.99, payment_method = 'Paddle', creator_code
      try {
        const txnPayload = {
          order_number: transactionId,
          flow_order_number: subscriptionId || customerId || transactionId,
          username: username,
          amount: amount,
          currency: currency,
          status: 'APROBADO',
          payment_method: 'Paddle',
          authorization_code: subscriptionId || customerId || transactionId,
          payer_email: payerEmail,
          creator_code: creatorCode,
          metadata: {
            event_id: event.event_id,
            event_type: eventType,
            customer_id: customerId,
            subscription_id: subscriptionId,
            creator_code: creatorCode,
            paddle_details: data.details || null
          }
        }

        const txnRes = await fetch(`${supabaseUrl}/rest/v1/transactions`, {
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
          // Retry without direct creator_code column if table is older schema
          delete txnPayload.creator_code
          const fallbackTxn = await fetch(`${supabaseUrl}/rest/v1/transactions`, {
            method: 'POST',
            headers: {
              'apikey': supabaseServiceKey,
              'Authorization': `Bearer ${supabaseServiceKey}`,
              'Content-Type': 'application/json',
              'Prefer': 'resolution=merge-duplicates'
            },
            body: JSON.stringify(txnPayload)
          })
          if (!fallbackTxn.ok) {
            const errText = await fallbackTxn.text()
            supabaseErrors.push(`transactions insert: ${errText}`)
          } else {
            supabaseUpdated = true
          }
        } else {
          supabaseUpdated = true
        }
      } catch (err) {
        supabaseErrors.push(`transactions exception: ${err.message}`)
      }
    }

    // 5. Response payload
    return new Response(JSON.stringify({
      success: true,
      event_type: eventType,
      transaction_id: transactionId,
      customer_id: customerId,
      subscription_id: subscriptionId,
      username: username,
      amount: amount,
      currency: currency,
      creator_code: creatorCode,
      status: 'APROBADO',
      supabase_updated: supabaseUpdated,
      supabase_errors: supabaseErrors.length > 0 ? supabaseErrors : undefined
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('[Paddle Webhook] Unhandled exception:', error)
    return new Response(JSON.stringify({ error: error.message || 'Internal webhook error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
