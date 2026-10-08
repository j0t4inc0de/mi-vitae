/**
 * Cloudflare Pages Function: Admin User Management Endpoint
 * Endpoint: POST /api/admin-manage-user
 * 
 * Secure administrative mutations (plan changes, lifetime upgrades, user deletions)
 * executed server-side with SUPABASE_SERVICE_ROLE_KEY to bypass Row Level Security (RLS).
 * Authenticated via server-side ADMIN_SECRET or Supabase Auth Admin JWT token.
 */

export async function onRequestPost(context) {
  const { request, env } = context

  // 1. Set JSON headers
  const jsonHeaders = {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store, no-cache, must-revalidate'
  }

  try {
    const body = await request.json().catch(() => ({}))
    const { action, username, plan, adminSecret, adminPassword, adminEmail } = body

    const expectedAdminSecret = env.ADMIN_SECRET || env.ADMIN_PASSWORD || 'TeAmoSambi!@123a'
    const canonicalAdminEmail = (env.ADMIN_EMAIL || 'jericesb5@gmail.com').toLowerCase().trim()
    const supabaseUrl = env.SUPABASE_URL || env.VITE_SUPABASE_URL || 'https://ewptcglzykqvnvxxwwhm.supabase.co'
    const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY

    // 2. Authorization Check (Secret token OR Supabase Auth JWT Bearer)
    let isAuthorized = false
    let authorizedBy = ''

    const providedSecret = adminSecret || adminPassword || request.headers.get('x-admin-secret')
    if (providedSecret && providedSecret === expectedAdminSecret) {
      isAuthorized = true
      authorizedBy = 'secret'
    }

    // Check Bearer JWT from Supabase Auth if provided
    const authHeader = request.headers.get('authorization') || ''
    if (!isAuthorized && authHeader.startsWith('Bearer ') && supabaseServiceKey) {
      const token = authHeader.replace('Bearer ', '').trim()
      try {
        const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
          headers: {
            'apikey': supabaseServiceKey,
            'Authorization': `Bearer ${token}`
          }
        })
        if (userRes.ok) {
          const userData = await userRes.json()
          const userEmail = (userData?.email || '').toLowerCase().trim()
          const role = userData?.app_metadata?.role || userData?.user_metadata?.role
          if (userEmail === canonicalAdminEmail || role === 'admin' || userEmail.endsWith('@wearesamod.com')) {
            isAuthorized = true
            authorizedBy = `jwt:${userEmail}`
          }
        }
      } catch (_) {}
    }

    // =========================================================================
    // ACTION: VERIFY ADMIN LOGIN
    // =========================================================================
    if (action === 'verify_admin') {
      const cleanEmail = (adminEmail || body.email || '').toLowerCase().trim()
      const isEmailValid = cleanEmail === canonicalAdminEmail || cleanEmail.endsWith('@wearesamod.com')

      if (isAuthorized && (isEmailValid || authorizedBy.startsWith('jwt:'))) {
        return new Response(JSON.stringify({ 
          success: true, 
          authorized: true, 
          email: cleanEmail || canonicalAdminEmail 
        }), {
          status: 200,
          headers: jsonHeaders
        })
      }

      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Credenciales de administrador inválidas.' 
      }), {
        status: 401,
        headers: jsonHeaders
      })
    }

    // For all mutation actions, authorization is mandatory
    if (!isAuthorized) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'No autorizado. Se requieren credenciales de administrador válidas.' 
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

    // =========================================================================
    // ACTION: ASSIGN CREATOR CODE (CRUD: Asociar código a un perfil registrado)
    // =========================================================================
    if (action === 'assign_creator_code') {
      const { creatorCode, isLifetime } = body
      const cleanCreatorCode = String(creatorCode || '')
        .trim()
        .toUpperCase()
        .replace(/[^A-Z0-9_-]/g, '')
        .slice(0, 30)

      if (!cleanCreatorCode) {
        return new Response(JSON.stringify({
          success: false,
          error: 'El código de creador es requerido y debe contener caracteres válidos (A-Z, 0-9, _, -).'
        }), { status: 400, headers: jsonHeaders })
      }

      // 1. Fetch current profile
      const getProfileRes = await fetch(`${supabaseUrl}/rest/v1/profiles?username=eq.${encodeURIComponent(cleanUsername)}&select=id,personal_info,plan,plan_name,plan_status,plan_expires_at`, {
        method: 'GET',
        headers: {
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`
        }
      })
      const profilesFound = await getProfileRes.json().catch(() => [])
      if (!Array.isArray(profilesFound) || profilesFound.length === 0) {
        return new Response(JSON.stringify({
          success: false,
          error: `No se encontró el usuario @${cleanUsername} en Supabase.`
        }), { status: 404, headers: jsonHeaders })
      }

      const existingProfile = profilesFound[0]
      const currentPersonalInfo = existingProfile.personal_info || {}
      const updatedPersonalInfo = {
        ...currentPersonalInfo,
        creator_code: cleanCreatorCode
      }

      const profileUpdates = {
        personal_info: updatedPersonalInfo,
        updated_at: new Date().toISOString()
      }

      if (isLifetime) {
        profileUpdates.plan = 'premium'
        profileUpdates.plan_name = 'Plan Pro (De por vida)'
        profileUpdates.plan_status = 'active'
        profileUpdates.plan_expires_at = '2099-12-31T23:59:59.000Z'
      }

      const patchRes = await fetch(`${supabaseUrl}/rest/v1/profiles?username=eq.${encodeURIComponent(cleanUsername)}`, {
        method: 'PATCH',
        headers: serviceHeaders,
        body: JSON.stringify(profileUpdates)
      })

      if (!patchRes.ok) {
        const errorText = await patchRes.text()
        return new Response(JSON.stringify({
          success: false,
          error: `Error al asignar código en Supabase: ${errorText}`
        }), { status: 502, headers: jsonHeaders })
      }

      const updated = await patchRes.json()
      return new Response(JSON.stringify({
        success: true,
        updated: true,
        username: cleanUsername,
        creatorCode: cleanCreatorCode,
        isLifetime: Boolean(isLifetime),
        profile: updated[0]
      }), { status: 200, headers: jsonHeaders })
    }

    // =========================================================================
    // ACTION: REMOVE CREATOR CODE (CRUD: Desvincular código de creador)
    // =========================================================================
    if (action === 'remove_creator_code') {
      const getProfileRes = await fetch(`${supabaseUrl}/rest/v1/profiles?username=eq.${encodeURIComponent(cleanUsername)}&select=id,personal_info`, {
        method: 'GET',
        headers: {
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`
        }
      })
      const profilesFound = await getProfileRes.json().catch(() => [])
      if (!Array.isArray(profilesFound) || profilesFound.length === 0) {
        return new Response(JSON.stringify({
          success: false,
          error: `No se encontró el usuario @${cleanUsername} en Supabase.`
        }), { status: 404, headers: jsonHeaders })
      }

      const currentPersonalInfo = profilesFound[0].personal_info || {}
      delete currentPersonalInfo.creator_code
      delete currentPersonalInfo.creatorCode

      const patchRes = await fetch(`${supabaseUrl}/rest/v1/profiles?username=eq.${encodeURIComponent(cleanUsername)}`, {
        method: 'PATCH',
        headers: serviceHeaders,
        body: JSON.stringify({
          personal_info: currentPersonalInfo,
          updated_at: new Date().toISOString()
        })
      })

      if (!patchRes.ok) {
        const errorText = await patchRes.text()
        return new Response(JSON.stringify({
          success: false,
          error: `Error al remover código en Supabase: ${errorText}`
        }), { status: 502, headers: jsonHeaders })
      }

      return new Response(JSON.stringify({
        success: true,
        removed: true,
        username: cleanUsername
      }), { status: 200, headers: jsonHeaders })
    }

    return new Response(JSON.stringify({ 
      success: false, 
      error: `Acción '${action}' no reconocida. Use 'verify_admin', 'update_plan', 'delete_user', 'assign_creator_code' o 'remove_creator_code'.` 
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
