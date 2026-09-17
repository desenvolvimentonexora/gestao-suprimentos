import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4'
import { corsHeaders, jsonResponse } from '../_shared/cors.ts'
import { userHasPermission } from '../_shared/checkPermission.ts'

interface UpdateSettingsBody {
  theme?: Record<string, string>
  brand?: Record<string, string>
  vocabulary?: Record<string, string>
  modules?: string[]
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return jsonResponse({ error: 'Não autenticado.' }, 401)

    const body = (await req.json()) as UpdateSettingsBody
    const { theme, brand, vocabulary, modules } = body

    if (!theme && !brand && !vocabulary && !modules) {
      return jsonResponse({ error: 'Nada para salvar.' }, 400)
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })

    const { data: userData, error: userError } = await callerClient.auth.getUser()
    if (userError || !userData.user) return jsonResponse({ error: 'Não autenticado.' }, 401)
    const userId = userData.user.id

    const hasPermission = await userHasPermission(callerClient, userId, 'admin.full_access')
    if (!hasPermission) return jsonResponse({ error: 'Sem permissão para editar a configuração.' }, 403)

    const { data: profile, error: profileError } = await callerClient
      .from('users')
      .select('tenant_id')
      .eq('id', userId)
      .single()
    if (profileError || !profile) return jsonResponse({ error: 'Usuário não encontrado.' }, 404)

    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const adminClient = createClient(supabaseUrl, serviceRoleKey)

    const updates: Record<string, unknown> = {}
    if (theme) updates.theme = theme
    if (brand) updates.brand = brand
    if (vocabulary) updates.vocabulary = vocabulary
    if (modules) updates.modules = modules

    const { error: updateError } = await adminClient
      .from('settings')
      .update(updates)
      .eq('tenant_id', profile.tenant_id)

    if (updateError) return jsonResponse({ error: updateError.message }, 500)

    return jsonResponse({ ok: true }, 200)
  } catch (error) {
    return jsonResponse({ error: error instanceof Error ? error.message : 'Erro desconhecido.' }, 500)
  }
})
