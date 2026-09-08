/**
 * Cloudflare Pages Function: Create Flow.cl Payment Session
 * Endpoint: POST /api/create-flow-order
 * 
 * Safely initializes payment with Flow.cl API using FLOW_SECRET_KEY server-side.
 */

async function signFlowParams(secret, params) {
  const keys = Object.keys(params).sort()
  let toSign = ''
  for (const k of keys) {
    toSign += `${k}${params[k]}`
  }

  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const signatureBuffer = await crypto.subtle.sign('HMAC', key, enc.encode(toSign))
  return Array.from(new Uint8Array(signatureBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

export async function onRequestPost(context) {
  const { request, env } = context

  try {
    const body = await request.json()
    const {
      amount = 3490,
      email = 'usuario@ejemplo.com',
      username = 'usuario',
      subject = 'Suscripción Mi Vitae Pro ($3.490 CLP/mes)'
    } = body

    const flowApiKey = env.FLOW_API_KEY
    const flowSecretKey = env.FLOW_SECRET_KEY
    const isSandbox = env.FLOW_SANDBOX === 'true'
    const appUrl = env.APP_URL || 'https://mi-vitae.wearesamod.com'
    const commerceOrder = `MV-${Date.now()}-${Math.floor(Math.random() * 1000)}`

    // If no keys configured, return simulation response
    if (!flowApiKey || !flowSecretKey) {
      return new Response(JSON.stringify({
        isSimulation: true,
        commerceOrder,
        amount,
        currency: 'CLP',
        subject,
        message: 'Flow.cl en modo simulación (sin credenciales API en variables de entorno)'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const flowBaseUrl = isSandbox
      ? 'https://sandbox.flow.cl/api'
      : 'https://www.flow.cl/api'

    const params = {
      apiKey: flowApiKey,
      commerceOrder,
      subject,
      currency: 'CLP',
      amount: String(amount),
      email,
      urlConfirmation: `${appUrl}/api/flow-webhook`,
      urlReturn: `${appUrl}/dashboard?payment=complete&order=${commerceOrder}`,
      'optional[username]': username
    }

    const signature = await signFlowParams(flowSecretKey, params)

    const formData = new URLSearchParams()
    for (const [k, v] of Object.entries(params)) {
      formData.append(k, v)
    }
    formData.append('s', signature)

    const flowRes = await fetch(`${flowBaseUrl}/payment/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString()
    })

    const flowData = await flowRes.json()

    if (!flowRes.ok || !flowData.url || !flowData.token) {
      return new Response(JSON.stringify({ error: flowData.message || 'Error en pasarela Flow.cl' }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify({
      isSimulation: false,
      redirectUrl: `${flowData.url}?token=${flowData.token}`,
      token: flowData.token,
      flowOrder: flowData.flowOrder,
      commerceOrder
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
