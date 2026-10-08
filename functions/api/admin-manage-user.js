/**
 * Cloudflare Pages Function: Admin User Management Endpoint
 * Endpoint: POST /api/admin-manage-user
 * 
 * Secure administrative mutations (plan changes, lifetime upgrades, user deletions)
 * executed server-side with SUPABASE_SERVICE_ROLE_KEY to bypass Row Level Security (RLS).
 */

const CANONICAL_ADMIN_SECRET = 'TeAmoSambi!@123a'
const CANONICAL_ADMIN_EMAIL = 'jericesb5@gmail.com'

export async function onRequestPost(context) {
  const { request, env } = context

  // 1. Set JSON headers
  const jsonHeaders = {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store, no-cache, must-revalidate'
  }

  try {
    const body = await request.json().catch(() => ({}))
    const { action, username, plan, adminSecret, adminPassword } = body

    // 2. Validate Admin Authorization Secret
    const providedSecret = adminSecret || adminPassword || request.headers.get('x-admin-secret')
    if (providedSecret !== CANONICAL_ADMIN_SECRET) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'No autorizado. Credenciales de administrador inválidas.' 
      }), {
        status: 401,
        headers: jsonHeaders
      })
    }

    if (!username || typeof username !== 'string') {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'El parámetro username es requerido.' 
      }), {
        status: 400,
        headers: jsonHeaders
      })
    }

    const cleanUsername = username.toLowerCase().trim()
    const supabaseUrl = env.SUPABASE_URL || env.VITE_SUPABASE_URL || 'https://ewptcglzykqvnvxxwwhm.supabase.co'
    const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseServiceKey) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'SUPABASE_SERVICE_ROLE_KEY no está configurada en las variables de entorno de Cloudflare.' 
      }), {
        status: 500,
        headers: jsonHeaders
      })
    }

    const serviceHeaders = {
      'apikey': supabaseServiceKey,
      'Authorization': `Bearer ${supabaseServiceKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    }

    // =========================================================================
    // ACTION: UPDATE PLAN
    // =========================================================================
    if (action === 'update_plan') {
      const isLifetime = plan === 'lifetime'
      const isPremium = plan === 'premium' || isLifetime
      const isInactive = plan === 'inactive'

      let planExpiresAt
      let planStatus = 'active'
      let planName = '1er Mes Gratis ($0 CLP)'
      let dbPlan = plan || 'free_trial'

      if (isLifetime) {
        dbPlan = 'premium'
        planName = 'Plan Pro (De por vida)'
        planStatus = 'active'
        planExpiresAt = '2099-12-31T23:59:59.000Z'
      } else if (plan === 'premium') {
        dbPlan = 'premium'
        planName = 'Suscripción Mi Vitae ($3.490 CLP/mes)'
        planStatus = 'active'
        planExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      } else if (isInactive) {
        dbPlan = 'free_trial'
        planName = 'Plan Inactivo'
        planStatus = 'expired'
        planExpiresAt = new Date(Date.now() - 1000).toISOString()
      } else {
        // trial / free_trial
        dbPlan = 'free_trial'
        planName = '1er Mes Gratis ($0 CLP)'
        planStatus = 'active'
        planExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      }

      const updates = {
        plan: dbPlan,
        plan_name: planName,
        plan_status: planStatus,
        plan_expires_at: planExpiresAt,
        updated_at: new Date().toISOString()
      }

      // 1. Update public.profiles via Service Role Key (bypassing RLS)
      const profileUrl = `${supabaseUrl}/rest/v1/profiles?username=eq.${encodeURIComponent(cleanUsername)}`
      const patchProfileRes = await fetch(profileUrl, {
        method: 'PATCH',
        headers: serviceHeaders,
        body: JSON.stringify(updates)
      })

      if (!patchProfileRes.ok) {
        const errorText = await patchProfileRes.text()
        return new Response(JSON.stringify({ 
          success: false, 
          error: `Error al actualizar perfil en Supabase: ${errorText}` 
        }), {
          status: 502,
          headers: jsonHeaders
        })
      }

      const updatedProfiles = await patchProfileRes.json()
      if (!Array.isArray(updatedProfiles) || updatedProfiles.length === 0) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: `No se encontró el usuario @${cleanUsername} en la base de datos.` 
        }), {
          status: 404,
          headers: jsonHeaders
        })
      }

      // 2. Also update public.subscriptions if present
      const subPayload = {
        status: planStatus,
        plan_type: dbPlan,
        expires_at: planExpiresAt,
        updated_at: new Date().toISOString()
      }

      await fetch(`${supabaseUrl}/rest/v1/subscriptions?username=eq.${encodeURIComponent(cleanUsername)}`, {
        method: 'PATCH',
        headers: serviceHeaders,
        body: JSON.stringify(subPayload)
      }).catch(() => {})

      return new Response(JSON.stringify({
        success: true,
        updated: true,
        username: cleanUsername,
        plan: dbPlan,
        planName,
        planStatus,
        planExpiresAt,
        isLifetime,
        user: updatedProfiles[0]
      }), {
        status: 200,
        headers: jsonHeaders
      })
    }

    // =========================================================================
    // ACTION: DELETE USER
    // =========================================================================
    if (action === 'delete_user') {
      // 1. Find profile ID to clean up auth user if possible
      const getProfileRes = await fetch(`${supabaseUrl}/rest/v1/profiles?username=eq.${encodeURIComponent(cleanUsername)}&select=id`, {
        method: 'GET',
        headers: {
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`
        }
      })
      const profilesFound = await getProfileRes.json().catch(() => [])
      const userId = Array.isArray(profilesFound) && profilesFound[0]?.id

      // 2. Delete from public.profiles
      const deleteProfileRes = await fetch(`${supabaseUrl}/rest/v1/profiles?username=eq.${encodeURIComponent(cleanUsername)}`, {
        method: 'DELETE',
        headers: serviceHeaders
      })

      if (!deleteProfileRes.ok) {
        const errorText = await deleteProfileRes.text()
        return new Response(JSON.stringify({ 
          success: false, 
          error: `Error al eliminar perfil de Supabase: ${errorText}` 
        }), {
          status: 502,
          headers: jsonHeaders
        })
      }

      // 3. Delete from public.subscriptions and public.feedbacks
      await fetch(`${supabaseUrl}/rest/v1/subscriptions?username=eq.${encodeURIComponent(cleanUsername)}`, {
        method: 'DELETE',
        headers: serviceHeaders
      }).catch(() => {})

      await fetch(`${supabaseUrl}/rest/v1/feedbacks?username=eq.${encodeURIComponent(cleanUsername)}`, {
        method: 'DELETE',
        headers: serviceHeaders
      }).catch(() => {})

      // 4. If user_id exists, delete from Supabase Auth admin
      if (userId) {
        await fetch(`${supabaseUrl}/auth/v1/admin/users/${userId}`, {
          method: 'DELETE',
          headers: {
            'apikey': supabaseServiceKey,
            'Authorization': `Bearer ${supabaseServiceKey}`
          }
        }).catch(() => {})
      }

      return new Response(JSON.stringify({
        success: true,
        deleted: true,
        username: cleanUsername,
        message: `Usuario @${cleanUsername} eliminado con éxito de Supabase.`
      }), {
        status: 200,
        headers: jsonHeaders
      })
    }

    return new Response(JSON.stringify({ 
      success: false, 
      error: `Acción '${action}' no reconocida. Use 'update_plan' o 'delete_user'.` 
    }), {
      status: 400,
      headers: jsonHeaders
    })

  } catch (err) {
    console.error('[Admin Manage User] Exception:', err)
    return new Response(JSON.stringify({ 
      success: false, 
      error: err.message || 'Error interno del servidor' 
    }), {
      status: 500,
      headers: jsonHeaders
    })
  }
}
