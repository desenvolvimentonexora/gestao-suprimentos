import { corsHeaders, jsonResponse } from '../_shared/cors.ts'
import { lookupContact } from '../_shared/companySearchProvider.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return jsonResponse({ error: 'Não autenticado.' }, 401)

    const { cnpj } = await req.json()
    if (!cnpj) return jsonResponse({ error: 'cnpj é obrigatório.' }, 400)

    const contact = await lookupContact(cnpj)
    return jsonResponse(contact, 200)
  } catch (error) {
    return jsonResponse({ error: error instanceof Error ? error.message : 'Erro desconhecido.' }, 500)
  }
})
