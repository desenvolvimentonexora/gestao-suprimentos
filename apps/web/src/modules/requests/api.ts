import { supabase } from '../../lib/supabase'
import type {
  ExtractedRequestData,
  ImportColumnMapping,
  MaterialOption,
  MaterialWithSupplierCount,
  RequestAttachmentRow,
  RequestFormValues,
  RequestRow,
  RequestStatus,
  UnitOption,
} from './types'

const IMPORT_TYPE_REQUESTS = 'requests'
const SIGNED_URL_EXPIRES_IN_SECONDS = 60 * 10

export async function fetchRequests(): Promise<RequestRow[]> {
  const { data, error } = await supabase
    .from('requests')
    .select(
      'id, status, needed_by, external_ref, sequence_number, created_at, subject_category, notes, negotiating_started_at, dispatch_blocked_reason, units(id, name), negotiator:users!negotiator_id(id, full_name), request_items(id, material_variant_id, quantity, unit_of_measure, status_code, authorized_at, pendente, motivo_pendencia, deleted_at, material_variants(code, description, materials(name))), quotations(id, status, deleted_at)',
    )
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (error) throw error

  return data.map((row) => ({
    id: row.id,
    unitId: row.units?.id ?? '',
    unitName: row.units?.name ?? '',
    status: row.status as RequestStatus,
    neededBy: row.needed_by,
    externalRef: row.external_ref,
    sequenceNumber: row.sequence_number,
    createdAt: row.created_at,
    subjectCategory: row.subject_category,
    notes: row.notes,
    negotiatorId: row.negotiator?.id ?? null,
    negotiatorName: row.negotiator?.full_name ?? null,
    negotiatingStartedAt: row.negotiating_started_at,
    dispatchBlockedReason: row.dispatch_blocked_reason,
    // Só cotações recebidas contam pra liberar o "Enviar para negociação" —
    // uma cotação criada mas travada em 'pending' (falha no meio do
    // processamento automático) não deve contar como se já tivesse chegado.
    quotationsCount: row.quotations.filter((quotation) => !quotation.deleted_at && quotation.status === 'received')
      .length,
    items: row.request_items
      .filter((item) => !item.deleted_at)
      .map((item) => ({
        id: item.id,
        materialId: item.material_variant_id,
        materialName: item.material_variants?.materials?.name ?? '',
        materialCode: item.material_variants?.code ?? null,
        materialDescription: item.material_variants?.description ?? null,
        quantity: Number(item.quantity),
        unitOfMeasure: item.unit_of_measure,
        statusCode: item.status_code,
        authorizedAt: item.authorized_at,
        pendente: item.pendente,
        motivoPendencia: item.motivo_pendencia,
      })),
  }))
}

export async function updateRequestNotes(requestId: string, notes: string): Promise<void> {
  const { error } = await supabase
    .from('requests')
    .update({ notes: notes || null })
    .eq('id', requestId)
  if (error) throw error
}

export async function fetchMaterialsWithSupplierCount(): Promise<MaterialWithSupplierCount[]> {
  const { data, error } = await supabase
    .from('material_variants')
    .select(
      'id, code, description, materials(name, category_id, supply_categories(name)), supplier_materials(supplier_id)',
    )
    .is('deleted_at', null)
    .order('code')
  if (error) throw error
  return data.map((row) => {
    const supplierIds = row.supplier_materials.map((link) => link.supplier_id)
    return {
      id: row.id,
      name: row.materials?.name ?? '',
      code: row.code,
      description: row.description,
      categoryId: row.materials?.category_id ?? '',
      categoryName: row.materials?.supply_categories?.name ?? 'Outros',
      supplierCount: supplierIds.length,
      supplierIds,
    }
  })
}

export interface DispatchDetailsValues {
  unitId: string
  subjectCategory: string
  notes: string
}

export async function dispatchRequest(requestId: string, values: DispatchDetailsValues): Promise<void> {
  const { error } = await supabase
    .from('requests')
    .update({
      unit_id: values.unitId,
      subject_category: values.subjectCategory || null,
      notes: values.notes || null,
      status: 'negotiating',
    })
    .eq('id', requestId)
  if (error) throw error
}

export async function fetchUnitOptions(): Promise<UnitOption[]> {
  const { data, error } = await supabase
    .from('units')
    .select('id, name')
    .is('deleted_at', null)
    .order('name')
  if (error) throw error
  return data
}

export async function fetchMaterialOptions(): Promise<MaterialOption[]> {
  const { data, error } = await supabase
    .from('material_variants')
    .select('id, code, description, materials(name)')
    .is('deleted_at', null)
    .order('code')
  if (error) throw error
  return data.map((row) => ({
    id: row.id,
    materialName: row.materials?.name ?? '',
    code: row.code,
    description: row.description,
  }))
}

export async function createRequest(tenantId: string, values: RequestFormValues): Promise<string> {
  const { data, error } = await supabase
    .from('requests')
    .insert({
      tenant_id: tenantId,
      unit_id: values.unitId,
      needed_by: values.neededBy || null,
      external_ref: values.externalRef || null,
    })
    .select('id')
    .single()
  if (error) throw error

  const { error: itemsError } = await supabase.from('request_items').insert(
    values.items.map((item) => ({
      tenant_id: tenantId,
      request_id: data.id,
      material_variant_id: item.materialId,
      quantity: item.quantity,
      unit_of_measure: item.unitOfMeasure || null,
    })),
  )
  if (itemsError) throw itemsError

  return data.id
}

export async function updateRequest(
  tenantId: string,
  requestId: string,
  values: RequestFormValues,
): Promise<void> {
  const { error } = await supabase
    .from('requests')
    .update({
      unit_id: values.unitId,
      needed_by: values.neededBy || null,
      external_ref: values.externalRef || null,
    })
    .eq('id', requestId)
  if (error) throw error

  const { error: deleteError } = await supabase
    .from('request_items')
    .update({ deleted_at: new Date().toISOString() })
    .eq('request_id', requestId)
  if (deleteError) throw deleteError

  const { error: itemsError } = await supabase.from('request_items').insert(
    values.items.map((item) => ({
      tenant_id: tenantId,
      request_id: requestId,
      material_variant_id: item.materialId,
      quantity: item.quantity,
      unit_of_measure: item.unitOfMeasure || null,
    })),
  )
  if (itemsError) throw itemsError
}

export async function fetchImportMapping(): Promise<ImportColumnMapping | null> {
  const { data, error } = await supabase
    .from('import_mappings')
    .select('column_mapping')
    .eq('import_type', IMPORT_TYPE_REQUESTS)
    .maybeSingle()
  if (error) throw error
  return (data?.column_mapping as ImportColumnMapping | undefined) ?? null
}

export async function saveImportMapping(tenantId: string, mapping: ImportColumnMapping): Promise<void> {
  const { error } = await supabase
    .from('import_mappings')
    .upsert(
      {
        tenant_id: tenantId,
        import_type: IMPORT_TYPE_REQUESTS,
        column_mapping: mapping as unknown as Record<string, string>,
      },
      { onConflict: 'tenant_id,import_type' },
    )
  if (error) throw error
}

export async function bulkCreateRequests(tenantId: string, requests: RequestFormValues[]): Promise<void> {
  for (const values of requests) {
    await createRequest(tenantId, values)
  }
}

export async function updateRequestStatus(requestId: string, status: RequestStatus): Promise<void> {
  const { error } = await supabase.from('requests').update({ status }).eq('id', requestId)
  if (error) throw error
}

export async function cancelRequest(requestId: string): Promise<void> {
  await updateRequestStatus(requestId, 'cancelled')
}

// A Edge Function review-request devolve { error: "mensagem" } no corpo da
// resposta quando a regra de negócio no banco recusa a ação (ex.: liberar
// com pendência aberta). O supabase-js não expõe esse corpo em error.message
// por padrão — precisa ler o Response guardado em error.context.
async function parseReviewError(error: unknown): Promise<Error> {
  if (error && typeof error === 'object' && 'context' in error) {
    const context = (error as { context?: unknown }).context
    if (context instanceof Response) {
      try {
        const body = (await context.clone().json()) as { error?: unknown }
        if (typeof body.error === 'string') return new Error(body.error)
      } catch {
        // resposta sem corpo JSON, cai no fallback abaixo
      }
    }
  }
  return error instanceof Error ? error : new Error('Não foi possível concluir a ação. Tente novamente.')
}

export async function requestExtension(
  requestId: string,
  newNeededBy: string,
  reason: string,
): Promise<void> {
  const { error } = await supabase.functions.invoke('review-request', {
    body: { requestId, action: 'request_extension', newNeededBy, message: reason },
  })
  if (error) throw await parseReviewError(error)
}

export async function releaseRequestToDispatch(requestId: string): Promise<{ dispatched: boolean }> {
  const { data, error } = await supabase.functions.invoke('review-request', {
    body: { requestId, action: 'release_to_dispatch' },
  })
  if (error) throw await parseReviewError(error)
  return { dispatched: Boolean((data as { dispatched?: boolean } | null)?.dispatched) }
}

export async function retryDispatch(requestId: string): Promise<{ dispatched: boolean }> {
  const { data, error } = await supabase.functions.invoke('review-request', {
    body: { requestId, action: 'retry_dispatch' },
  })
  if (error) throw await parseReviewError(error)
  return { dispatched: Boolean((data as { dispatched?: boolean } | null)?.dispatched) }
}

export async function sendRequestToNegotiation(requestId: string): Promise<void> {
  const { error } = await supabase.functions.invoke('review-request', {
    body: { requestId, action: 'send_to_negotiation' },
  })
  if (error) throw await parseReviewError(error)
}

export async function fetchRequestAttachments(requestId: string): Promise<RequestAttachmentRow[]> {
  const [solResult, quotationResult] = await Promise.all([
    supabase.from('request_attachments').select('id, file_name').eq('request_id', requestId),
    supabase
      .from('quotation_attachments')
      .select('id, file_name, quotation_id, quotations!inner(request_id, status, suppliers(name))')
      .eq('quotations.request_id', requestId)
      .neq('quotations.status', 'discarded'),
  ])
  if (solResult.error) throw solResult.error
  if (quotationResult.error) throw quotationResult.error

  const solRows: RequestAttachmentRow[] = solResult.data.map((row) => ({
    id: row.id,
    fileName: row.file_name,
    kind: 'sol',
    supplierName: null,
    quotationId: null,
  }))

  const quotationRows: RequestAttachmentRow[] = quotationResult.data.map((row) => ({
    id: row.id,
    fileName: row.file_name,
    kind: 'quotation',
    supplierName: row.quotations?.suppliers?.name ?? null,
    quotationId: row.quotation_id,
  }))

  return [...solRows, ...quotationRows]
}

// Mesmo padrão de apps/web/src/modules/quotations/api.ts (discardQuotation)
// — duplicado aqui porque módulo não importa de módulo. Usado pela lixeira
// no popup de arquivos: marca a cotação como descartada (soft, nunca
// DELETE), e ela some da lista porque fetchRequestAttachments já filtra
// quotations com status 'discarded'.
export async function discardQuotationAttachment(quotationId: string): Promise<void> {
  const { error } = await supabase.from('quotations').update({ status: 'discarded' }).eq('id', quotationId)
  if (error) throw error
}

export async function fetchRequestAttachmentUrl(attachment: {
  id: string
  kind: 'sol' | 'quotation'
}): Promise<string | null> {
  if (attachment.kind === 'sol') {
    const { data: row, error } = await supabase
      .from('request_attachments')
      .select('storage_path')
      .eq('id', attachment.id)
      .maybeSingle()
    if (error) throw error
    if (!row) return null

    const { data: signed, error: signError } = await supabase.storage
      .from('request-attachments')
      .createSignedUrl(row.storage_path, SIGNED_URL_EXPIRES_IN_SECONDS)
    if (signError) throw signError
    return signed?.signedUrl ?? null
  }

  const { data: row, error } = await supabase
    .from('quotation_attachments')
    .select('storage_path')
    .eq('id', attachment.id)
    .maybeSingle()
  if (error) throw error
  if (!row) return null

  const { data: signed, error: signError } = await supabase.storage
    .from('quotation-attachments')
    .createSignedUrl(row.storage_path, SIGNED_URL_EXPIRES_IN_SECONDS)
  if (signError) throw signError
  return signed?.signedUrl ?? null
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      resolve(result.slice(result.indexOf(',') + 1))
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

export async function extractRequestPdf(file: File): Promise<ExtractedRequestData> {
  const pdfBase64 = await fileToBase64(file)
  const { data, error } = await supabase.functions.invoke('extract-request-pdf', { body: { pdfBase64 } })
  if (error) throw await parseReviewError(error)
  return data as ExtractedRequestData
}

// Anexa o PDF original da SOL (fonte, não gerado por nós) depois que a
// requisição já foi criada — mesmo bucket/tabela usados pelo PDF gerado no
// Disparo (review-request), só com source diferente.
export async function attachUploadedRequestPdf(tenantId: string, requestId: string, file: File): Promise<void> {
  const storagePath = `${tenantId}/${requestId}/${file.name}`

  const { error: uploadError } = await supabase.storage
    .from('request-attachments')
    .upload(storagePath, file, { contentType: 'application/pdf' })
  if (uploadError) throw uploadError

  const { error: insertError } = await supabase.from('request_attachments').insert({
    tenant_id: tenantId,
    request_id: requestId,
    file_name: file.name,
    storage_path: storagePath,
    source: 'uploaded',
  })
  if (insertError) throw insertError
}
