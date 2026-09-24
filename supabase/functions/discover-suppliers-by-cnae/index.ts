import { corsHeaders, jsonResponse } from '../_shared/cors.ts'
import { discoverByCnae } from '../_shared/companySearchProvider.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return jsonResponse({ error: 'Não autenticado.' }, 401)

    const { cnae, uf } = await req.json()
    if (!cnae || !uf) return jsonResponse({ error: 'cnae e uf são obrigatórios.' }, 400)

    const candidates = await discoverByCnae(cnae, uf)
    return jsonResponse(candidates, 200)
  } catch (error) {
    return jsonResponse({ error: error instanceof Error ? error.message : 'Erro desconhecido.' }, 500)
  }
})
