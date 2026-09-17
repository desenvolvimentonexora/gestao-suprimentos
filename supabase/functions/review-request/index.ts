import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4'
import { SMTPClient } from 'https://deno.land/x/denomailer@1.6.0/mod.ts'
import { corsHeaders, jsonResponse } from '../_shared/cors.ts'
import { userHasPermission } from '../_shared/checkPermission.ts'
import {
  buildBlockedReason,
  buildDispatchEmail,
  buildSendFailureReason,
  formatRequestNumber,
  groupItemsBySupplier,
  type DispatchRequestItem,
  type SupplierEmailOption,
} from './dispatch-logic.ts'

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
  neededBy: string | null
  items: DispatchRequestItem[]
}

async function fetchRequestForDispatch(
  adminClient: SupabaseClient,
  requestId: string,
): Promise<RequestForDispatch> {
  const { data, error } = await adminClient
    .from('requests')
    .select(
      'tenant_id, external_ref, sequence_number, needed_by, units(name), request_items(material_id, quantity, unit_of_measure, deleted_at, materials(name))',
    )
    .eq('id', requestId)
    .single()
  if (error) throw error

  const items = (
    data.request_items as unknown as {
      material_id: string
      quantity: number
      unit_of_measure: string | null
      deleted_at: string | null
      materials: { name: string } | null
    }[]
  )
    .filter((item) => !item.deleted_at)
    .map((item) => ({
      materialId: item.material_id,
      materialName: item.materials?.name ?? '',
      quantity: item.quantity,
      unitOfMeasure: item.unit_of_measure,
    }))

  return {
    tenantId: data.tenant_id,
    requestNumber: formatRequestNumber(data.external_ref, data.sequence_number),
    unitName: (data.units as unknown as { name: string } | null)?.name ?? '',
    neededBy: data.needed_by,
    items,
  }
}

async function fetchSuppliersForMaterial(
  adminClient: SupabaseClient,
  materialId: string,
): Promise<SupplierEmailOption[]> {
  const { data, error } = await adminClient
    .from('suppliers')
    .select('id, name, supplier_contacts(email), supplier_materials!inner(material_id)')
    .eq('supplier_materials.material_id', materialId)
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

async function sendDispatchEmails(
  emails: { to: string; subject: string; body: string }[],
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
        await client.send({ from: gmailUser, to: email.to, subject: email.subject, content: email.body })
      } catch {
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

  const uniqueMaterialIds = [...new Set(request.items.map((item) => item.materialId))]
  const suppliersByMaterialId = new Map<string, SupplierEmailOption[]>()
  for (const materialId of uniqueMaterialIds) {
    suppliersByMaterialId.set(materialId, await fetchSuppliersForMaterial(adminClient, materialId))
  }

  const groupResult = groupItemsBySupplier(request.items, suppliersByMaterialId)
  if (!groupResult.ok) {
    await adminClient
      .from('requests')
      .update({ dispatch_blocked_reason: buildBlockedReason(groupResult.missingMaterialNames) })
      .eq('id', requestId)
    return { dispatched: false }
  }

  const emails = groupResult.groups.map((group) =>
    buildDispatchEmail(group, {
      requestNumber: request.requestNumber,
      unitName: request.unitName,
      neededBy: request.neededBy,
    }),
  )
  const { failedAt } = await sendDispatchEmails(emails)

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
      material_id: item.materialId,
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

      const { dispatched } = await attemptAutoDispatch(adminClient, requestId, userId)
      return jsonResponse({ ok: true, dispatched }, 200)
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
