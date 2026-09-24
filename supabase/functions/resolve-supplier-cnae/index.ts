import { corsHeaders, jsonResponse } from '../_shared/cors.ts'
import { resolveCnae } from '../_shared/cnaeResolver.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return jsonResponse({ error: 'Não autenticado.' }, 401)

    const { cnpj } = await req.json()
    if (!cnpj) return jsonResponse({ error: 'cnpj é obrigatório.' }, 400)

    const resolved = await resolveCnae(cnpj)
    if (!resolved) {
      return jsonResponse({ error: 'CNPJ não encontrado na Receita Federal.' }, 404)
    }

    return jsonResponse(resolved, 200)
  } catch (error) {
    return jsonResponse({ error: error instanceof Error ? error.message : 'Erro desconhecido.' }, 500)
  }
})
