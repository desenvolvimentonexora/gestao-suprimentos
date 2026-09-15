import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4'
import { corsHeaders, jsonResponse } from '../_shared/cors.ts'
import { userHasPermission } from '../_shared/checkPermission.ts'

interface UpdateUserBody {
  userId: string
  roleId?: string
  isActive?: boolean
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return jsonResponse({ error: 'Não autenticado.' }, 401)

    const body = (await req.json()) as Partial<UpdateUserBody>
    const { userId: targetUserId, roleId, isActive } = body

    if (!targetUserId || (roleId === undefined && isActive === undefined)) {
      return jsonResponse({ error: 'Parâmetros inválidos.' }, 400)
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })

    const { data: userData, error: userError } = await callerClient.auth.getUser()
    if (userError || !userData.user) return jsonResponse({ error: 'Não autenticado.' }, 401)
    const callerId = userData.user.id

    const hasPermission = await userHasPermission(callerClient, callerId, 'admin.full_access')
    if (!hasPermission) return jsonResponse({ error: 'Sem permissão para editar usuários.' }, 403)

    const { data: profile, error: profileError } = await callerClient
      .from('users')
      .select('tenant_id')
      .eq('id', callerId)
      .single()
    if (profileError || !profile) return jsonResponse({ error: 'Usuário não encontrado.' }, 404)

    const { data: targetUser, error: targetUserError } = await callerClient
      .from('users')
      .select('id')
      .eq('id', targetUserId)
      .eq('tenant_id', profile.tenant_id)
      .maybeSingle()
    if (targetUserError) return jsonResponse({ error: targetUserError.message }, 500)
    if (!targetUser) return jsonResponse({ error: 'Usuário não encontrado neste cliente.' }, 404)

    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const adminClient = createClient(supabaseUrl, serviceRoleKey)

    if (isActive !== undefined) {
      const { error: activeError } = await adminClient
        .from('users')
        .update({ is_active: isActive })
        .eq('id', targetUserId)
      if (activeError) return jsonResponse({ error: activeError.message }, 500)
    }

    if (roleId) {
      const { data: role, error: roleError } = await callerClient
        .from('roles')
        .select('id')
        .eq('id', roleId)
        .eq('tenant_id', profile.tenant_id)
        .is('deleted_at', null)
        .maybeSingle()
      if (roleError) return jsonResponse({ error: roleError.message }, 500)
      if (!role) return jsonResponse({ error: 'Papel inválido para este cliente.' }, 400)

      const { error: deleteRolesError } = await adminClient
        .from('user_roles')
        .delete()
        .eq('user_id', targetUserId)
      if (deleteRolesError) return jsonResponse({ error: deleteRolesError.message }, 500)

      const { error: insertRoleError } = await adminClient.from('user_roles').insert({
        user_id: targetUserId,
        role_id: roleId,
        tenant_id: profile.tenant_id,
      })
      if (insertRoleError) return jsonResponse({ error: insertRoleError.message }, 500)
    }

    return jsonResponse({ ok: true }, 200)
  } catch (error) {
    return jsonResponse({ error: error instanceof Error ? error.message : 'Erro desconhecido.' }, 500)
  }
})
