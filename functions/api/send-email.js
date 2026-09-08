/**
 * Cloudflare Pages Function: Transactional Emails with Resend API
 * Endpoint: POST /api/send-email
 * 
 * Supports templates:
 * 1. 'welcome_voucher': Welcome + 1st Month Free Voucher & Public Link
 * 2. 'payment_receipt': Flow.cl official payment receipt
 * 3. 'trial_expiring': 7-day and 3-day expiration alert
 */

function generateEmailHtml({ type, data }) {
  const brandGradient = 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 50%, #06B6D4 100%)'
  const appUrl = 'https://mi-vitae.wearesamod.com'

  // TEMPLATE 1: WELCOME & 1ST MONTH FREE VOUCHER
  if (type === 'welcome_voucher') {
    const username = data.username || 'profesional'
    const name = data.name || username
    const profileUrl = `${appUrl}/${username}`
    const expiresAtFormatted = data.expiresAt ? new Date(data.expiresAt).toLocaleDateString('es-CL') : 'en 30 días'

    return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin: 0; padding: 20px; background-color: #0b0f19; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #f8fafc;">
  <div style="max-width: 580px; margin: 0 auto; background-color: #111827; border-radius: 24px; border: 1px solid #1f2937; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);">
    
    <!-- Header -->
    <div style="background: ${brandGradient}; padding: 32px 24px; text-align: center;">
      <div style="font-size: 28px; font-weight: 900; color: #ffffff; letter-spacing: -0.5px;">Mi Vitae</div>
      <div style="font-size: 13px; color: rgba(255,255,255,0.85); margin-top: 4px; font-weight: 600;">by We Are Samod</div>
    </div>

    <!-- Body -->
    <div style="padding: 32px 24px;">
      <h1 style="font-size: 22px; font-weight: 800; color: #ffffff; margin-top: 0; margin-bottom: 12px;">
        ¡Tu 1er Mes Gratis está Activo, ${name}! 🎉
      </h1>
      <p style="font-size: 14px; line-height: 1.6; color: #94a3b8; margin-bottom: 24px;">
        Te damos la bienvenida a la plataforma que transforma el currículum tradicional en un portafolio web interactivo de alto impacto. Tu presencia digital profesional ya está lista en vivo.
      </p>

      <!-- Link Box -->
      <div style="background-color: #1e293b; border-radius: 16px; border: 1px solid #334155; padding: 20px; text-align: center; margin-bottom: 24px;">
        <span style="font-size: 11px; font-weight: 700; color: #38bdf8; text-transform: uppercase; letter-spacing: 1px;">Tu Enlace Personal</span>
        <div style="font-size: 18px; font-weight: 800; color: #ffffff; margin-top: 6px; word-break: break-all;">
          ${profileUrl}
        </div>
      </div>

      <!-- Voucher Ticket -->
      <div style="background-color: #0f172a; border-radius: 16px; border: 1px dashed #475569; padding: 18px; margin-bottom: 28px;">
        <div style="display: flex; justify-content: space-between; font-size: 12px; color: #cbd5e1; margin-bottom: 8px;">
          <span><strong>Beneficio:</strong> Plan Profesional Completo</span>
          <span style="color: #34d399; font-weight: 800;">$0 CLP</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 12px; color: #94a3b8;">
          <span><strong>Válido hasta:</strong> ${expiresAtFormatted}</span>
          <span>Sin cobros sorpresa</span>
        </div>
      </div>

      <!-- CTA -->
      <div style="text-align: center; margin-bottom: 24px;">
        <a href="${appUrl}/dashboard" style="display: inline-block; background-color: #4f46e5; color: #ffffff; font-weight: 800; font-size: 14px; padding: 14px 28px; border-radius: 14px; text-decoration: none; box-shadow: 0 10px 15px -3px rgba(79, 70, 229, 0.4);">
          Abrir Mi Dashboard Studio &rarr;
        </a>
      </div>

      <p style="font-size: 12px; color: #64748b; line-height: 1.5; margin: 0; text-align: center;">
        ¿Preguntas o necesitas ayuda? Escríbenos directamente respondiendo a este email o por WhatsApp.
      </p>
    </div>

    <!-- Footer -->
    <div style="background-color: #0a0e17; padding: 18px 24px; text-align: center; font-size: 11px; color: #475569; border-top: 1px solid #1f2937;">
      &copy; ${new Date().getFullYear()} Mi Vitae &bull; We Are Samod SpA &bull; Santiago, Chile
    </div>

  </div>
</body>
</html>
    `
  }

  // TEMPLATE 2: FLOW.CL PAYMENT RECEIPT
  if (type === 'payment_receipt') {
    const orderNumber = data.orderNumber || 'ORD-0000'
    const amount = Number(data.amount || 3490).toLocaleString('es-CL')
    const paymentMethod = data.paymentMethod || 'Webpay Plus'
    const authCode = data.authorizationCode || 'N/A'

    return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin: 0; padding: 20px; background-color: #0b0f19; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #f8fafc;">
  <div style="max-width: 580px; margin: 0 auto; background-color: #111827; border-radius: 24px; border: 1px solid #1f2937; overflow: hidden;">
    <div style="background: #0f265c; padding: 24px; text-align: center;">
      <div style="font-size: 24px; font-weight: 900; color: #ffffff;">Comprobante de Pago Flow.cl</div>
      <div style="font-size: 12px; color: #38bdf8; margin-top: 4px;">Suscripción Mi Vitae Pro Activa</div>
    </div>
    <div style="padding: 28px;">
      <div style="background-color: #1e293b; border-radius: 16px; padding: 20px; margin-bottom: 20px;">
        <div style="font-size: 12px; color: #94a3b8; margin-bottom: 4px;">Orden de Compra: <strong>${orderNumber}</strong></div>
        <div style="font-size: 12px; color: #94a3b8; margin-bottom: 4px;">Medio de Pago: <strong>${paymentMethod}</strong></div>
        <div style="font-size: 12px; color: #94a3b8; margin-bottom: 12px;">Código de Autorización: <strong>${authCode}</strong></div>
        <div style="font-size: 20px; font-weight: 800; color: #34d399; border-top: 1px solid #334155; padding-top: 12px;">
          Total Pagado: $${amount} CLP
        </div>
      </div>
      <div style="text-align: center;">
        <a href="${appUrl}/dashboard" style="display: inline-block; background-color: #4f46e5; color: #ffffff; font-weight: 700; font-size: 14px; padding: 12px 24px; border-radius: 12px; text-decoration: none;">
          Ir a Mi Cuenta &rarr;
        </a>
      </div>
    </div>
  </div>
</body>
</html>
    `
  }

  // TEMPLATE 3: TRIAL EXPIRING ALERT
  if (type === 'trial_expiring') {
    const daysLeft = data.daysLeft || 3
    const username = data.username || 'profesional'

    return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin: 0; padding: 20px; background-color: #0b0f19; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #f8fafc;">
  <div style="max-width: 580px; margin: 0 auto; background-color: #111827; border-radius: 24px; border: 1px solid #1f2937; padding: 32px 24px;">
    <h2 style="color: #fbbf24; margin-top: 0;">Tu Mes de Prueba en Mi Vitae finaliza en ${daysLeft} días ⏳</h2>
    <p style="color: #94a3b8; font-size: 14px; line-height: 1.6;">
      Hola @${username}, para mantener activo tu enlace personalizado y tus visitas sin interrupción, asegura tu plan mensual por solo <strong>$3.490 CLP/mes</strong>.
    </p>
    <div style="text-align: center; margin: 24px 0;">
      <a href="${appUrl}/dashboard" style="display: inline-block; background-color: #4f46e5; color: #ffffff; font-weight: 800; font-size: 14px; padding: 14px 28px; border-radius: 14px; text-decoration: none;">
        Renovar Mi Portafolio con Flow.cl &rarr;
      </a>
    </div>
  </div>
</body>
</html>
    `
  }

  return `<p>Notificación de Mi Vitae</p>`
}

export async function onRequestPost(context) {
  const { request, env } = context

  try {
    const body = await request.json()
    const { to, subject, type = 'welcome_voucher', data = {} } = body

    if (!to) {
      return new Response(JSON.stringify({ error: 'Recipient email "to" is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const resendApiKey = env.RESEND_API_KEY
    const senderEmail = env.RESEND_FROM_EMAIL || 'Mi Vitae <contacto@wearesamod.com>'

    const htmlContent = generateEmailHtml({ type, data })
    const emailSubject = subject || (
      type === 'welcome_voucher' ? '¡Tu 1er Mes Gratis en Mi Vitae está activo! 🎉' :
      type === 'payment_receipt' ? 'Comprobante de Pago Mi Vitae (Flow.cl)' :
      'Tu mes de prueba en Mi Vitae finaliza pronto ⏳'
    )

    // If Resend API Key is set, send live email
    if (resendApiKey) {
      const resendRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: senderEmail,
          to: [to],
          subject: emailSubject,
          html: htmlContent
        })
      })

      const resendData = await resendRes.json()

      if (!resendRes.ok) {
        console.error('[Resend API Error]', resendData)
        return new Response(JSON.stringify({ error: resendData.message || 'Error sending email' }), {
          status: 502,
          headers: { 'Content-Type': 'application/json' }
        })
      }

      return new Response(JSON.stringify({ success: true, emailId: resendData.id }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Fallback simulation when API Key not set yet in environment
    console.info(`[Email Service Simulation] Sent ${type} to ${to}: ${emailSubject}`)
    return new Response(JSON.stringify({
      success: true,
      simulation: true,
      message: 'Email simulado exitosamente (configura RESEND_API_KEY para envíos reales)'
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
