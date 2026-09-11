import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4'
import { corsHeaders, jsonResponse } from '../_shared/cors.ts'

interface DecideBody {
  comparisonId: string
  decision: 'approved' | 'rejected'
  rejectionReason?: string
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

    const body = (await req.json()) as Partial<DecideBody>
    const { comparisonId, decision, rejectionReason } = body

    if (!comparisonId || (decision !== 'approved' && decision !== 'rejected')) {
      return jsonResponse({ error: 'Parâmetros inválidos.' }, 400)
    }
    if (decision === 'rejected' && !rejectionReason) {
      return jsonResponse({ error: 'Informe o motivo da rejeição.' }, 400)
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

    const hasApprovePermission = (roleRows ?? []).some((row) =>
      (row.roles?.role_permissions ?? []).some(
        (rolePermission) => rolePermission.permissions?.key === 'comparisons.approve',
      ),
    )
    if (!hasApprovePermission) return jsonResponse({ error: 'Sem permissão para aprovar.' }, 403)

    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const adminClient = createClient(supabaseUrl, serviceRoleKey)

    const { error: rpcError } = await adminClient.rpc('fn_decide_comparison', {
      p_comparison_id: comparisonId,
      p_decision: decision,
      p_decided_by: userId,
      p_rejection_reason: rejectionReason ?? null,
    })

    if (rpcError) return jsonResponse({ error: rpcError.message }, 500)

    return jsonResponse({ ok: true }, 200)
  } catch (error) {
    return jsonResponse({ error: error instanceof Error ? error.message : 'Erro desconhecido.' }, 500)
  }
})
