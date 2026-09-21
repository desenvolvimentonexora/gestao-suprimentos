import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4'
import { corsHeaders, jsonResponse } from '../_shared/cors.ts'
import { extractQuoteDataFromPdf } from '../_shared/ai-provider.ts'
import {
  base64UrlToBase64,
  matchExtractedItems,
  parseQuoteSubject,
  parseRequestNumber,
  type MatchedQuoteItem,
  type QuoteRequestItem,
} from './matching.ts'

// Protótipo: um tenant só (CLAUDE.md seção 1) — esta função roda por cron,
// sem usuário autenticado por trás, então não há de onde ler um tenant_id
// de sessão. Mesmo id fixo usado no seed de demonstração
// (supabase/seed/0001_demo.sql). Revisar quando a Fase 6 (segundo tenant)
// chegar.
const TENANT_ID = '00000000-0000-0000-0000-000000000001'

interface GmailHeader {
  name: string
  value: string
}

interface GmailMessagePart {
  mimeType?: string
  body?: { attachmentId?: string; size?: number }
  parts?: GmailMessagePart[]
}

interface GmailMessage {
  id: string
  payload: {
    headers: GmailHeader[]
    parts?: GmailMessagePart[]
  }
}

async function getAccessToken(): Promise<string> {
  const clientId = Deno.env.get('GMAIL_OAUTH_CLIENT_ID')!
  const clientSecret = Deno.env.get('GMAIL_OAUTH_CLIENT_SECRET')!
  const refreshToken = Deno.env.get('GMAIL_OAUTH_REFRESH_TOKEN')!

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  })
  if (!response.ok) throw new Error(`Falha ao renovar token do Gmail: ${await response.text()}`)
  const data = (await response.json()) as { access_token: string }
  return data.access_token
}

async function listCandidateMessageIds(accessToken: string): Promise<string[]> {
  const url = new URL('https://gmail.googleapis.com/gmail/v1/users/me/messages')
  url.searchParams.set('q', 'is:unread has:attachment filename:pdf')
  const response = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } })
  if (!response.ok) throw new Error(`Falha ao listar e-mails: ${await response.text()}`)
  const data = (await response.json()) as { messages?: { id: string }[] }
  return (data.messages ?? []).map((message) => message.id)
}

async function getMessage(accessToken: string, messageId: string): Promise<GmailMessage> {
  const url = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=full`
  const response = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } })
  if (!response.ok) throw new Error(`Falha ao buscar e-mail ${messageId}: ${await response.text()}`)
  return response.json()
}

function findHeader(message: GmailMessage, name: string): string | null {
  const header = message.payload.headers.find((h) => h.name.toLowerCase() === name.toLowerCase())
  return header?.value ?? null
}

function extractSenderEmail(fromHeader: string): string {
  const angleMatch = fromHeader.match(/<([^>]+)>/)
  return (angleMatch ? angleMatch[1] : fromHeader).trim().toLowerCase()
}

function findPdfAttachmentId(parts: GmailMessagePart[] | undefined): string | null {
  if (!parts) return null
  for (const part of parts) {
    if (part.mimeType === 'application/pdf' && part.body?.attachmentId) {
      return part.body.attachmentId
    }
    const nested = findPdfAttachmentId(part.parts)
    if (nested) return nested
  }
  return null
}

async function getAttachmentBase64(accessToken: string, messageId: string, attachmentId: string): Promise<string> {
  const url = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/attachments/${attachmentId}`
  const response = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } })
  if (!response.ok) throw new Error(`Falha ao baixar anexo: ${await response.text()}`)
  const data = (await response.json()) as { data: string }
  return base64UrlToBase64(data.data)
}

async function markMessageAsRead(accessToken: string, messageId: string): Promise<void> {
  const url = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/modify`
  const response = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ removeLabelIds: ['UNREAD'] }),
  })
  if (!response.ok) throw new Error(`Falha ao marcar e-mail como lido: ${await response.text()}`)
}

interface IngestionExtra {
  requestId?: string
  supplierId?: string
  quotationId?: string
}

async function recordIngestion(
  adminClient: SupabaseClient,
  messageId: string,
  fromEmail: string,
  subject: string,
  status: 'matched' | 'unmatched' | 'error',
  detail: string | null,
  extra?: IngestionExtra,
): Promise<void> {
  await adminClient.from('email_ingestions').upsert(
    {
      tenant_id: TENANT_ID,
      gmail_message_id: messageId,
      from_email: fromEmail,
      subject,
      request_id: extra?.requestId ?? null,
      supplier_id: extra?.supplierId ?? null,
      quotation_id: extra?.quotationId ?? null,
      status,
      detail,
    },
    { onConflict: 'tenant_id,gmail_message_id' },
  )
}

async function processMessage(adminClient: SupabaseClient, accessToken: string, messageId: string): Promise<void> {
  const { data: existing } = await adminClient
    .from('email_ingestions')
    .select('id, status')
    .eq('tenant_id', TENANT_ID)
    .eq('gmail_message_id', messageId)
    .maybeSingle()
  if (existing?.status === 'matched') return

  const message = await getMessage(accessToken, messageId)
  const fromEmail = extractSenderEmail(findHeader(message, 'From') ?? '')
  const subject = findHeader(message, 'Subject') ?? ''

  const parsedNumber = parseQuoteSubject(subject)
  if (!parsedNumber) {
    await recordIngestion(adminClient, messageId, fromEmail, subject, 'unmatched', 'Assunto não bate com o padrão "Cotação — {número}".')
    return
  }

  const requestNumber = parseRequestNumber(parsedNumber)
  if (!requestNumber) {
    await recordIngestion(adminClient, messageId, fromEmail, subject, 'unmatched', 'Número da SOL vazio após o assunto.')
    return
  }

  const baseRequestQuery = adminClient.from('requests').select('id').eq('tenant_id', TENANT_ID).is('deleted_at', null)
  const { data: requestRow } =
    'externalRef' in requestNumber
      ? await baseRequestQuery.eq('external_ref', requestNumber.externalRef).maybeSingle()
      : await baseRequestQuery.eq('sequence_number', requestNumber.sequenceNumber).maybeSingle()

  if (!requestRow) {
    await recordIngestion(adminClient, messageId, fromEmail, subject, 'unmatched', `SOL não encontrada para "${parsedNumber}".`)
    return
  }

  const { data: recipientRows } = await adminClient
    .from('request_dispatch_recipients')
    .select('supplier_id, email')
    .eq('request_id', requestRow.id)

  const recipientRow = (recipientRows ?? []).find((row) => row.email.toLowerCase() === fromEmail) ?? null

  if (!recipientRow) {
    await recordIngestion(
      adminClient,
      messageId,
      fromEmail,
      subject,
      'unmatched',
      `Remetente ${fromEmail} não bate com nenhum destinatário conhecido dessa SOL.`,
      { requestId: requestRow.id },
    )
    return
  }

  const attachmentId = findPdfAttachmentId(message.payload.parts)
  if (!attachmentId) {
    await recordIngestion(adminClient, messageId, fromEmail, subject, 'unmatched', 'Sem anexo PDF identificável no e-mail.', {
      requestId: requestRow.id,
      supplierId: recipientRow.supplier_id,
    })
    return
  }

  try {
    const pdfBase64 = await getAttachmentBase64(accessToken, messageId, attachmentId)

    const { data: requestItemsData, error: itemsError } = await adminClient
      .from('request_items')
      .select('id, quantity, unit_of_measure, deleted_at, materials(name)')
      .eq('request_id', requestRow.id)
      .is('deleted_at', null)
    if (itemsError) throw itemsError

    const requestItemsRows = requestItemsData as unknown as {
      id: string
      quantity: number
      unit_of_measure: string | null
      materials: { name: string } | null
    }[]

    const requestItems: QuoteRequestItem[] = requestItemsRows.map((item) => ({
      id: item.id,
      materialName: item.materials?.name ?? '',
      quantity: Number(item.quantity),
      unitOfMeasure: item.unit_of_measure,
    }))

    const { data: existingComparison } = await adminClient
      .from('comparisons')
      .select('id')
      .eq('request_id', requestRow.id)
      .is('deleted_at', null)
      .in('status', ['draft', 'pending_approval'])
      .maybeSingle()

    let comparisonId = existingComparison?.id as string | undefined
    if (!comparisonId) {
      const { data: createdComparison, error: comparisonError } = await adminClient
        .from('comparisons')
        .insert({ tenant_id: TENANT_ID, request_id: requestRow.id })
        .select('id')
        .single()
      if (comparisonError) throw comparisonError
      comparisonId = createdComparison.id
    }

    const { data: quotationRow, error: quotationError } = await adminClient
      .from('quotations')
      .insert({
        tenant_id: TENANT_ID,
        request_id: requestRow.id,
        supplier_id: recipientRow.supplier_id,
        status: 'pending',
        source: 'email_auto',
      })
      .select('id')
      .single()
    if (quotationError) throw quotationError
    const quotationId = quotationRow.id as string

    const storagePath = `${TENANT_ID}/${quotationId}/${Date.now()}-cotacao.pdf`
    const pdfBytes = Uint8Array.from(atob(pdfBase64), (char) => char.charCodeAt(0))
    const { error: uploadError } = await adminClient.storage
      .from('quotation-attachments')
      .upload(storagePath, pdfBytes, { contentType: 'application/pdf' })
    if (uploadError) throw uploadError

    const { error: attachmentError } = await adminClient.from('quotation_attachments').insert({
      tenant_id: TENANT_ID,
      quotation_id: quotationId,
      file_name: 'cotacao.pdf',
      storage_path: storagePath,
    })
    if (attachmentError) throw attachmentError

    const extracted = await extractQuoteDataFromPdf(pdfBase64)
    const reviewedItems = matchExtractedItems(extracted.items, requestItems)
    const matchedByRequestItemId = new Map<string, MatchedQuoteItem & { requestItemId: string }>()
    for (const item of reviewedItems) {
      if (item.requestItemId === null) continue
      const current = matchedByRequestItemId.get(item.requestItemId)
      if (!current || item.confidence > current.confidence) {
        matchedByRequestItemId.set(item.requestItemId, { ...item, requestItemId: item.requestItemId })
      }
    }
    const matchedItems = [...matchedByRequestItemId.values()]

    const { data: insertedItems, error: quotationItemsError } = await adminClient
      .from('quotation_items')
      .insert(
        matchedItems.map((item) => ({
          tenant_id: TENANT_ID,
          quotation_id: quotationId,
          request_item_id: item.requestItemId,
          unit_price: item.unitPrice,
          lead_time_days: item.leadTimeDays,
        })),
      )
      .select('id, request_item_id')
    if (quotationItemsError) throw quotationItemsError

    const { error: linesError } = await adminClient.from('comparison_lines').insert(
      insertedItems.map((inserted, index) => ({
        tenant_id: TENANT_ID,
        comparison_id: comparisonId,
        request_item_id: inserted.request_item_id,
        quotation_item_id: inserted.id,
        extracted_by_ai: true,
        ai_confidence: matchedItems[index]?.confidence ?? null,
      })),
    )
    if (linesError) throw linesError

    const { error: updateQuotationError } = await adminClient
      .from('quotations')
      .update({
        status: 'received',
        submitted_at: new Date().toISOString(),
        freight_amount: extracted.freight,
        payment_terms: extracted.paymentTerms,
      })
      .eq('id', quotationId)
    if (updateQuotationError) throw updateQuotationError

    await recordIngestion(adminClient, messageId, fromEmail, subject, 'matched', null, {
      requestId: requestRow.id,
      supplierId: recipientRow.supplier_id,
      quotationId,
    })
  } catch (error) {
    await recordIngestion(
      adminClient,
      messageId,
      fromEmail,
      subject,
      'error',
      error instanceof Error ? error.message : 'Erro desconhecido.',
      { requestId: requestRow.id, supplierId: recipientRow.supplier_id },
    )
    // Não marca como lido — a próxima execução tenta de novo. A trava de
    // idempotência (checagem em email_ingestions, no topo desta função) só
    // vale depois que ESSE insert de status 'error' acontecer; ver a
    // limitação registrada na spec sobre falha parcial.
    throw error
  }

  await markMessageAsRead(accessToken, messageId)
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const adminClient = createClient(supabaseUrl, serviceRoleKey)

    const accessToken = await getAccessToken()
    const messageIds = await listCandidateMessageIds(accessToken)

    let processed = 0
    let failed = 0
    for (const messageId of messageIds) {
      try {
        await processMessage(adminClient, accessToken, messageId)
        processed++
      } catch (error) {
        failed++
        console.error(`Falha ao processar e-mail ${messageId}:`, error)
      }
    }

    return jsonResponse({ ok: true, candidates: messageIds.length, processed, failed }, 200)
  } catch (error) {
    return jsonResponse({ error: error instanceof Error ? error.message : 'Erro desconhecido.' }, 500)
  }
})
