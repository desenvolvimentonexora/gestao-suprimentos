import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4'
import { SMTPClient } from 'https://deno.land/x/denomailer@1.6.0/mod.ts'
import { corsHeaders, jsonResponse } from '../_shared/cors.ts'
import { userHasPermission } from '../_shared/checkPermission.ts'
import { generateRequestPdf } from '../_shared/requestPdf.ts'
import {
  buildBlockedReason,
  buildDispatchEmail,
  buildSendFailureReason,
  formatRequestNumber,
  groupItemsBySupplier,
  type DispatchRequestItem,
  type SupplierEmailOption,
} from './dispatch-logic.ts'

const REQUEST_ATTACHMENTS_BUCKET = 'request-attachments'

type ReviewAction = 'request_clarification' | 'request_extension' | 'release_to_dispatch' | 'retry_dispatch'

interface ReviewBody {
  requestId: string
  action: ReviewAction
  message?: string
  newNeededBy?: string
}

interface RequestForDispatch {
  tenantId: string
  requestNumber: string
  unitName: string
  requesterName: string | null
  createdAt: string
  neededBy: string | null
  notes: string | null
  items: DispatchRequestItem[]
}

async function fetchRequestForDispatch(
  adminClient: SupabaseClient,
  requestId: string,
): Promise<RequestForDispatch> {
  const { data, error } = await adminClient
    .from('requests')
    .select(
      'tenant_id, external_ref, sequence_number, needed_by, created_at, notes, units(name), users(full_name), request_items(material_variant_id, quantity, unit_of_measure, deleted_at, material_variants(materials(name, code)))',
    )
    .eq('id', requestId)
    .single()
  if (error) throw error

  const items = (
    data.request_items as unknown as {
      material_variant_id: string
      quantity: number
      unit_of_measure: string | null
      deleted_at: string | null
      material_variants: { materials: { name: string; code: string | null } | null } | null
    }[]
  )
    .filter((item) => !item.deleted_at)
    .map((item) => ({
      materialId: item.material_variant_id,
      materialCode: item.material_variants?.materials?.code ?? null,
      materialName: item.material_variants?.materials?.name ?? '',
      quantity: item.quantity,
      unitOfMeasure: item.unit_of_measure,
    }))

  return {
    tenantId: data.tenant_id,
    requestNumber: formatRequestNumber(data.external_ref, data.sequence_number),
    unitName: (data.units as unknown as { name: string } | null)?.name ?? '',
    requesterName: (data.users as unknown as { full_name: string } | null)?.full_name ?? null,
    createdAt: data.created_at,
    neededBy: data.needed_by,
    notes: data.notes,
    items,
  }
}

function sanitizeFileNamePart(value: string): string {
  return value.replace(/[^\w-]+/g, '_')
}

// Garante que a SOL tenha um PDF anexado antes do disparo: se já tem (upload
// manual ou, no futuro, vindo de uma API do ERP), reaproveita esse original;
// senão, gera um a partir dos dados que já temos salvos (pdf-lib). Idempotente
// — uma "tentar de novo" (retry_dispatch) não gera/sobe um segundo arquivo.
async function ensureRequestAttachment(
  adminClient: SupabaseClient,
  tenantId: string,
  requestId: string,
  request: RequestForDispatch,
): Promise<{ bytes: Uint8Array; fileName: string }> {
  const { data: existing, error: existingError } = await adminClient
    .from('request_attachments')
    .select('storage_path, file_name')
    .eq('request_id', requestId)
    .limit(1)
    .maybeSingle()
  if (existingError) throw existingError

  if (existing) {
    const { data: file, error: downloadError } = await adminClient.storage
      .from(REQUEST_ATTACHMENTS_BUCKET)
      .download(existing.storage_path)
    if (downloadError || !file) {
      throw new Error('Falha ao baixar o PDF da solicitação já anexado.')
    }
    return { bytes: new Uint8Array(await file.arrayBuffer()), fileName: existing.file_name }
  }

  const fileName = `${sanitizeFileNamePart(request.requestNumber)}.pdf`
  const bytes = await generateRequestPdf({
    requestNumber: request.requestNumber,
    unitName: request.unitName,
    requesterName: request.requesterName,
    createdAt: request.createdAt,
    neededBy: request.neededBy,
    notes: request.notes,
    items: request.items,
  })
  const storagePath = `${tenantId}/${requestId}/${fileName}`

  const { error: uploadError } = await adminClient.storage
    .from(REQUEST_ATTACHMENTS_BUCKET)
    .upload(storagePath, bytes, { contentType: 'application/pdf' })
  if (uploadError) throw uploadError

  const { error: insertError } = await adminClient.from('request_attachments').insert({
    tenant_id: tenantId,
    request_id: requestId,
    file_name: fileName,
    storage_path: storagePath,
    source: 'generated',
  })
  if (insertError) throw insertError

  return { bytes, fileName }
}

async function fetchSuppliersForMaterial(
  adminClient: SupabaseClient,
  materialId: string,
): Promise<SupplierEmailOption[]> {
  const { data, error } = await adminClient
    .from('suppliers')
    .select('id, name, supplier_contacts(email), supplier_materials!inner(material_variant_id)')
    .eq('supplier_materials.material_variant_id', materialId)
    .is('deleted_at', null)
  if (error) throw error

  return (data as { id: string; name: string; supplier_contacts: { email: string | null }[] }[])
    .map((row) => ({
      supplierId: row.id,
      supplierName: row.name,
      email: row.supplier_contacts[0]?.email ?? null,
    }))
    .filter((row): row is SupplierEmailOption => Boolean(row.email))
}

async function fetchUnitLabel(adminClient: SupabaseClient, tenantId: string): Promise<string> {
  const { data, error } = await adminClient
    .from('settings')
    .select('vocabulary')
    .eq('tenant_id', tenantId)
    .single()
  if (error) throw error
  const vocabulary = data.vocabulary as { unit?: string } | null
  return vocabulary?.unit ?? 'Obra'
}

async function sendDispatchEmails(
  emails: { to: string; subject: string; body: string }[],
  attachment: { bytes: Uint8Array; fileName: string },
): Promise<{ sentCount: number; failedAt: number | null }> {
  const gmailUser = Deno.env.get('GMAIL_USER')!
  const gmailAppPassword = Deno.env.get('GMAIL_APP_PASSWORD')!
  const client = new SMTPClient({
    connection: {
      hostname: 'smtp.gmail.com',
      port: 465,
      tls: true,
      auth: { username: gmailUser, password: gmailAppPassword },
    },
  })

  try {
    for (let i = 0; i < emails.length; i++) {
      const email = emails[i]
      try {
        await client.send({
          from: gmailUser,
          to: email.to,
          subject: email.subject,
          content: email.body,
          attachments: [
            {
              filename: attachment.fileName,
              contentType: 'application/pdf',
              encoding: 'binary',
              content: attachment.bytes,
            },
          ],
        })
      } catch (error) {
        console.error(`Falha ao enviar e-mail de disparo pra ${email.to}:`, error)
        return { sentCount: i, failedAt: i }
      }
    }
    return { sentCount: emails.length, failedAt: null }
  } finally {
    await client.close()
  }
}

async function attemptAutoDispatch(
  adminClient: SupabaseClient,
  requestId: string,
  reviewerId: string,
): Promise<{ dispatched: boolean }> {
  const request = await fetchRequestForDispatch(adminClient, requestId)
  const unitLabel = await fetchUnitLabel(adminClient, request.tenantId)

  const uniqueMaterialIds = [...new Set(request.items.map((item) => item.materialId))]
  const supplierListsByMaterial = await Promise.all(
    uniqueMaterialIds.map((materialId) => fetchSuppliersForMaterial(adminClient, materialId)),
  )
  const suppliersByMaterialId = new Map(
    uniqueMaterialIds.map((materialId, index) => [materialId, supplierListsByMaterial[index]]),
  )

  const groupResult = groupItemsBySupplier(request.items, suppliersByMaterialId)
  if (!groupResult.ok) {
    await adminClient
      .from('requests')
      .update({ dispatch_blocked_reason: buildBlockedReason(groupResult.missingMaterialNames) })
      .eq('id', requestId)
    return { dispatched: false }
  }

  const attachment = await ensureRequestAttachment(adminClient, request.tenantId, requestId, request)

  const emails = groupResult.groups.map((group) =>
    buildDispatchEmail(group, {
      requestNumber: request.requestNumber,
      unitLabel,
      unitName: request.unitName,
      neededBy: request.neededBy,
    }),
  )
  const { failedAt } = await sendDispatchEmails(emails, attachment)

  if (failedAt !== null) {
    const failedGroup = groupResult.groups[failedAt]
    const alreadySent = groupResult.groups.slice(0, failedAt).map((group) => group.supplierName)
    await adminClient
      .from('requests')
      .update({ dispatch_blocked_reason: buildSendFailureReason(failedGroup.supplierName, alreadySent) })
      .eq('id', requestId)
    return { dispatched: false }
  }

  const recipients = groupResult.groups.flatMap((group) =>
    group.items.map((item) => ({
      tenant_id: request.tenantId,
      request_id: requestId,
      supplier_id: group.supplierId,
      material_variant_id: item.materialId,
      email: group.email,
    })),
  )
  const { error: recipientsError } = await adminClient.from('request_dispatch_recipients').insert(recipients)
  if (recipientsError) throw recipientsError

  const { error: negotiatingError } = await adminClient.rpc('fn_mark_request_negotiating', {
    p_request_id: requestId,
    p_reviewer_id: reviewerId,
  })
  if (negotiatingError) throw negotiatingError

  return { dispatched: true }
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

    const validActions: ReviewAction[] = [
      'request_clarification',
      'request_extension',
      'release_to_dispatch',
      'retry_dispatch',
    ]
    if (!requestId || !action || !validActions.includes(action)) {
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

    const hasAnalyzePermission = await userHasPermission(callerClient, userId, 'requests.analyze')
    if (!hasAnalyzePermission) return jsonResponse({ error: 'Sem permissão para analisar solicitações.' }, 403)

    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const adminClient = createClient(supabaseUrl, serviceRoleKey)

    if (action === 'release_to_dispatch' || action === 'retry_dispatch') {
      if (action === 'release_to_dispatch') {
        const { error: releaseError } = await adminClient.rpc('fn_release_request_to_dispatch', {
          p_request_id: requestId,
          p_reviewer_id: userId,
        })
        if (releaseError) return jsonResponse({ error: releaseError.message }, 500)
      }

      const { data: currentRequest, error: statusError } = await adminClient
        .from('requests')
        .select('status')
        .eq('id', requestId)
        .is('deleted_at', null)
        .single()
      if (statusError) return jsonResponse({ error: statusError.message }, 500)
      if (currentRequest.status !== 'released_to_dispatch') {
        return jsonResponse({ error: 'A requisição não está liberada pro Disparo.' }, 400)
      }

      try {
        const { dispatched } = await attemptAutoDispatch(adminClient, requestId, userId)
        return jsonResponse({ ok: true, dispatched }, 200)
      } catch (error) {
        // A liberação (se solicitada) já foi confirmada nesse ponto — uma falha
        // aqui é só do despacho automático, não deve virar "não foi possível liberar".
        console.error('attemptAutoDispatch falhou:', error)
        return jsonResponse({ ok: true, dispatched: false }, 200)
      }
    }

    const rpcCall =
      action === 'request_clarification'
        ? adminClient.rpc('fn_request_clarification', {
            p_request_id: requestId,
            p_reviewer_id: userId,
            p_message: message ?? null,
          })
        : adminClient.rpc('fn_request_extension', {
            p_request_id: requestId,
            p_reviewer_id: userId,
            p_new_needed_by: newNeededBy,
            p_reason: message ?? null,
          })

    const { error: rpcError } = await rpcCall
    if (rpcError) return jsonResponse({ error: rpcError.message }, 500)

    return jsonResponse({ ok: true }, 200)
  } catch (error) {
    return jsonResponse({ error: error instanceof Error ? error.message : 'Erro desconhecido.' }, 500)
  }
})
