/**
 * Frontend Email Service: Communicates with Cloudflare Function /api/send-email
 */

export async function sendTransactionalEmail({ to, subject, type, data = {} }) {
  if (!to) return { success: false, error: 'Missing recipient email' }

  try {
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to, subject, type, data })
    })

    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      return { success: false, error: err.error || 'Failed to send email' }
    }

    return await response.json()
  } catch (err) {
    // Graceful fallback (e.g. offline dev mode)
    console.warn('[EmailService] Notice: Could not contact /api/send-email:', err.message)
    return { success: true, simulated: true }
  }
}

export async function sendWelcomeEmail({ to, username, name, expiresAt }) {
  return sendTransactionalEmail({
    to,
    type: 'welcome_voucher',
    data: { username, name, expiresAt }
  })
}

export async function sendPaymentReceiptEmail({ to, orderNumber, amount, paymentMethod, authorizationCode }) {
  return sendTransactionalEmail({
    to,
    type: 'payment_receipt',
    data: { orderNumber, amount, paymentMethod, authorizationCode }
  })
}
