import { supabase } from '../../lib/supabase'
import type {
  ImportColumnMapping,
  MaterialOption,
  MaterialWithSupplierCount,
  RequestFormValues,
  RequestRow,
  RequestStatus,
  UnitOption,
} from './types'

const IMPORT_TYPE_REQUESTS = 'requests'

export async function fetchRequests(): Promise<RequestRow[]> {
  const { data, error } = await supabase
    .from('requests')
    .select(
      'id, status, needed_by, external_ref, sequence_number, created_at, subject_category, notes, negotiating_started_at, dispatch_blocked_reason, units(id, name), negotiator:users!negotiator_id(id, full_name), request_items(id, material_variant_id, quantity, unit_of_measure, status_code, authorized_at, pendente, motivo_pendencia, deleted_at, material_variants(code, description, materials(name))), quotations(id, deleted_at)',
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
    quotationsCount: row.quotations.filter((quotation) => !quotation.deleted_at).length,
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
      'id, code, materials(name, category_id, supply_categories(name)), supplier_materials(supplier_id)',
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

export async function createRequest(tenantId: string, values: RequestFormValues): Promise<void> {
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
