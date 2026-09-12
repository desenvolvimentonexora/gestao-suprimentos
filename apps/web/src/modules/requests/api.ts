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
      'id, status, needed_by, external_ref, created_at, subject_category, notes, negotiating_started_at, units(id, name), negotiator:users!negotiator_id(id, full_name), request_items(id, material_id, quantity, unit_of_measure, status_code, authorized_at, deleted_at, materials(name)), quotations(id, deleted_at)',
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
    createdAt: row.created_at,
    subjectCategory: row.subject_category,
    notes: row.notes,
    negotiatorId: row.negotiator?.id ?? null,
    negotiatorName: row.negotiator?.full_name ?? null,
    negotiatingStartedAt: row.negotiating_started_at,
    quotationsCount: row.quotations.filter((quotation) => !quotation.deleted_at).length,
    items: row.request_items
      .filter((item) => !item.deleted_at)
      .map((item) => ({
        id: item.id,
        materialId: item.material_id,
        materialName: item.materials?.name ?? '',
        quantity: Number(item.quantity),
        unitOfMeasure: item.unit_of_measure,
        statusCode: item.status_code,
        authorizedAt: item.authorized_at,
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
    .from('materials')
    .select('id, name, code, supplier_materials(count)')
    .is('deleted_at', null)
    .order('name')
  if (error) throw error
  return data.map((row) => ({
    id: row.id,
    name: row.name,
    code: row.code,
    supplierCount: row.supplier_materials[0]?.count ?? 0,
  }))
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
    .from('materials')
    .select('id, name, code')
    .is('deleted_at', null)
    .order('name')
  if (error) throw error
  return data
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
      material_id: item.materialId,
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
      material_id: item.materialId,
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
