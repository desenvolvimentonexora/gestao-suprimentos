import { supabase } from '../../lib/supabase'
import type { NegotiatingRequestRow, QuotationFormValues, QuotationStatus, SupplierOption } from './types'

export async function fetchNegotiatingRequests(): Promise<NegotiatingRequestRow[]> {
  const { data, error } = await supabase
    .from('requests')
    .select(
      'id, needed_by, external_ref, units(name), request_items(id, quantity, unit_of_measure, deleted_at, materials(name)), quotations(id, supplier_id, status, submitted_at, deleted_at, suppliers(name))',
    )
    .eq('status', 'negotiating')
    .is('deleted_at', null)
    .order('needed_by', { ascending: true, nullsFirst: false })

  if (error) throw error

  return data.map((row) => ({
    id: row.id,
    unitName: row.units?.name ?? '',
    neededBy: row.needed_by,
    externalRef: row.external_ref,
    items: row.request_items
      .filter((item) => !item.deleted_at)
      .map((item) => ({
        id: item.id,
        materialName: item.materials?.name ?? '',
        quantity: Number(item.quantity),
        unitOfMeasure: item.unit_of_measure,
      })),
    quotations: row.quotations
      .filter((quotation) => !quotation.deleted_at)
      .map((quotation) => ({
        id: quotation.id,
        supplierId: quotation.supplier_id,
        supplierName: quotation.suppliers?.name ?? '',
        status: quotation.status as QuotationStatus,
        submittedAt: quotation.submitted_at,
      })),
  }))
}

export async function fetchSupplierOptions(): Promise<SupplierOption[]> {
  const { data, error } = await supabase
    .from('suppliers')
    .select('id, name')
    .is('deleted_at', null)
    .order('name')
  if (error) throw error
  return data
}

export async function createQuotation(
  tenantId: string,
  requestId: string,
  values: QuotationFormValues,
): Promise<void> {
  const { data, error } = await supabase
    .from('quotations')
    .insert({
      tenant_id: tenantId,
      request_id: requestId,
      supplier_id: values.supplierId,
      status: 'received',
      submitted_at: new Date().toISOString(),
    })
    .select('id')
    .single()
  if (error) throw error

  const { error: itemsError } = await supabase.from('quotation_items').insert(
    values.items.map((item) => ({
      tenant_id: tenantId,
      quotation_id: data.id,
      request_item_id: item.requestItemId,
      unit_price: Number(item.unitPrice.replace(',', '.')),
      lead_time_days: item.leadTimeDays ? Number(item.leadTimeDays) : null,
    })),
  )
  if (itemsError) throw itemsError
}

export async function discardQuotation(quotationId: string): Promise<void> {
  const { error } = await supabase
    .from('quotations')
    .update({ status: 'discarded' satisfies QuotationStatus })
    .eq('id', quotationId)
  if (error) throw error
}
