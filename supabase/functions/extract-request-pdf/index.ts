import { corsHeaders, jsonResponse } from '../_shared/cors.ts'
import { extractRequestDataFromPdf } from '../_shared/ai-provider.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return jsonResponse({ error: 'Não autenticado.' }, 401)

    const { pdfBase64 } = await req.json()
    if (!pdfBase64) return jsonResponse({ error: 'pdfBase64 é obrigatório.' }, 400)

    const extracted = await extractRequestDataFromPdf(pdfBase64)
    return jsonResponse(extracted, 200)
  } catch (error) {
    return jsonResponse({ error: error instanceof Error ? error.message : 'Erro desconhecido.' }, 500)
  }
})
