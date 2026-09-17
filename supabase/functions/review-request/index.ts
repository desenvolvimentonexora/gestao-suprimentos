import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4'
import { corsHeaders, jsonResponse } from '../_shared/cors.ts'

type ReviewAction = 'request_clarification' | 'request_extension' | 'release_to_dispatch'

interface ReviewBody {
  requestId: string
  action: ReviewAction
  message?: string
  newNeededBy?: string
}

interface PermissionRow {
  roles: {
    role_permissions: {
      permissions: { key: string } | null
    }[]
  } | null
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return jsonResponse({ error: 'Não autenticado.' }, 401)

    const body = (await req.json()) as Partial<ReviewBody>
    const { requestId, action, message, newNeededBy } = body

    if (
      !requestId ||
      (action !== 'request_clarification' && action !== 'request_extension' && action !== 'release_to_dispatch')
    ) {
      return jsonResponse({ error: 'Parâmetros inválidos.' }, 400)
    }
    if (action === 'request_extension' && !newNeededBy) {
      return jsonResponse({ error: 'Informe a nova data de entrega proposta.' }, 400)
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })

    const { data: userData, error: userError } = await callerClient.auth.getUser()
    if (userError || !userData.user) return jsonResponse({ error: 'Não autenticado.' }, 401)
    const userId = userData.user.id

    const { data: roleRows, error: permError } = await callerClient
      .from('user_roles')
      .select('roles(role_permissions(permissions(key)))')
      .eq('user_id', userId)
      .returns<PermissionRow[]>()

    if (permError) return jsonResponse({ error: 'Falha ao verificar permissão.' }, 500)

    const hasAnalyzePermission = (roleRows ?? []).some((row) =>
      (row.roles?.role_permissions ?? []).some(
        (rolePermission) => rolePermission.permissions?.key === 'requests.analyze',
      ),
    )
    if (!hasAnalyzePermission) return jsonResponse({ error: 'Sem permissão para analisar solicitações.' }, 403)

    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const adminClient = createClient(supabaseUrl, serviceRoleKey)

    const rpcCall =
      action === 'request_clarification'
        ? adminClient.rpc('fn_request_clarification', {
            p_request_id: requestId,
            p_reviewer_id: userId,
            p_message: message ?? null,
          })
        : action === 'request_extension'
          ? adminClient.rpc('fn_request_extension', {
              p_request_id: requestId,
              p_reviewer_id: userId,
              p_new_needed_by: newNeededBy,
              p_reason: message ?? null,
            })
          : adminClient.rpc('fn_release_request_to_dispatch', {
              p_request_id: requestId,
              p_reviewer_id: userId,
            })

    const { error: rpcError } = await rpcCall
    if (rpcError) return jsonResponse({ error: rpcError.message }, 500)

    return jsonResponse({ ok: true }, 200)
  } catch (error) {
    return jsonResponse({ error: error instanceof Error ? error.message : 'Erro desconhecido.' }, 500)
  }
})
