import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4'
import { encodeBase64 } from 'https://deno.land/std@0.224.0/encoding/base64.ts'
import { corsHeaders, jsonResponse } from '../_shared/cors.ts'
import { extractQuoteDataFromPdf } from './ai-provider.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return jsonResponse({ error: 'Não autenticado.' }, 401)

    const { attachmentId } = await req.json()
    if (!attachmentId) return jsonResponse({ error: 'attachmentId é obrigatório.' }, 400)

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const supabase = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })

    const { data: attachment, error: attachmentError } = await supabase
      .from('quotation_attachments')
      .select('storage_path')
      .eq('id', attachmentId)
      .single()

    if (attachmentError || !attachment) {
      return jsonResponse({ error: 'Anexo não encontrado.' }, 404)
    }

    const { data: file, error: downloadError } = await supabase.storage
      .from('quotation-attachments')
      .download(attachment.storage_path)

    if (downloadError || !file) {
      return jsonResponse({ error: 'Falha ao baixar o anexo.' }, 500)
    }

    const buffer = await file.arrayBuffer()
    const base64 = encodeBase64(new Uint8Array(buffer))

    const extracted = await extractQuoteDataFromPdf(base64)
    return jsonResponse(extracted, 200)
  } catch (error) {
    return jsonResponse({ error: error instanceof Error ? error.message : 'Erro desconhecido.' }, 500)
  }
})
