import { supabase } from '../../lib/supabase'
import type { DeliveryOrderDetail, DeliveryOrderRow, DeliverySupplierDetail, UnitOption } from './types'

const DELIVERY_ORDER_COLUMNS =
  'id, order_number, status, expected_delivery_date, delivered_at, delivery_receipt_confirmed_at, delivery_notes, units(id, name), order_items(supplier_id, suppliers(name))'

// Pedidos cancelados ou com AR já confirmado não são "ativos" pra cobrança
// de entrega (ver deliveryStatus.ts) — filtrados aqui pra não trazer dado
// que a tela nunca vai mostrar.
export async function fetchActiveDeliveryOrders(): Promise<DeliveryOrderRow[]> {
  const { data, error } = await supabase
    .from('orders')
    .select(DELIVERY_ORDER_COLUMNS)
    .is('deleted_at', null)
    .is('delivery_receipt_confirmed_at', null)
    .not('expected_delivery_date', 'is', null)
    .neq('status', 'cancelled')
    .order('expected_delivery_date')

  if (error) throw error

  return data.map((row): DeliveryOrderRow => {
    const supplierNames = [
      ...new Set(
        row.order_items
          .map((item) => item.suppliers?.name)
          .filter((name): name is string => Boolean(name)),
      ),
    ]

    return {
      id: row.id,
      orderNumber: row.order_number,
      unitId: row.units?.id ?? '',
      unitName: row.units?.name ?? '',
      supplierNames,
      expectedDeliveryDate: row.expected_delivery_date!,
      deliveredAt: row.delivered_at,
      deliveryReceiptConfirmedAt: row.delivery_receipt_confirmed_at,
      deliveryNotes: row.delivery_notes,
      apiStatus: row.status,
    }
  })
}

export async function fetchUnitOptions(): Promise<UnitOption[]> {
  const { data, error } = await supabase.from('units').select('id, name').is('deleted_at', null).order('name')
  if (error) throw error
  return data
}

const DELIVERY_ORDER_DETAIL_COLUMNS = `
  id, order_number, status, created_at, expected_delivery_date, delivered_at, delivery_receipt_confirmed_at, delivery_notes,
  units(id, name),
  requests(needed_by, negotiator:users!negotiator_id(full_name)),
  order_items(
    id, quantity, unit_price, delivered_at, material_name_raw,
    materials(code, name, description),
    request_items(unit_of_measure),
    suppliers(id, name, city, supplier_contacts(id, name, phone, email))
  )
`

export async function fetchDeliveryOrderDetail(orderId: string): Promise<DeliveryOrderDetail> {
  const { data: row, error } = await supabase
    .from('orders')
    .select(DELIVERY_ORDER_DETAIL_COLUMNS)
    .eq('id', orderId)
    .single()

  if (error) throw error

  const suppliersById = new Map<string, DeliverySupplierDetail>()
  for (const item of row.order_items) {
    const supplier = item.suppliers
    if (supplier && !suppliersById.has(supplier.id)) {
      suppliersById.set(supplier.id, {
        id: supplier.id,
        name: supplier.name,
        city: supplier.city,
        contacts: supplier.supplier_contacts.map((contact) => ({
          id: contact.id,
          name: contact.name,
          phone: contact.phone,
          email: contact.email,
        })),
      })
    }
  }

  return {
    id: row.id,
    orderNumber: row.order_number,
    unitId: row.units?.id ?? '',
    unitName: row.units?.name ?? '',
    apiStatus: row.status,
    createdAt: row.created_at,
    expectedDeliveryDate: row.expected_delivery_date!,
    neededBy: row.requests?.needed_by ?? null,
    negotiatorName: row.requests?.negotiator?.full_name ?? null,
    deliveredAt: row.delivered_at,
    deliveryReceiptConfirmedAt: row.delivery_receipt_confirmed_at,
    deliveryNotes: row.delivery_notes,
    suppliers: [...suppliersById.values()],
    items: row.order_items.map((item) => ({
      id: item.id,
      materialCode: item.materials?.code ?? null,
      materialName: item.materials?.name ?? item.material_name_raw,
      materialDescription: item.materials?.description ?? null,
      unitOfMeasure: item.request_items?.unit_of_measure ?? null,
      quantity: Number(item.quantity),
      unitPrice: Number(item.unit_price),
      deliveredAt: item.delivered_at,
    })),
  }
}

export async function markOrderDelivered(orderId: string): Promise<void> {
  const { error } = await supabase
    .from('orders')
    .update({ delivered_at: new Date().toISOString() })
    .eq('id', orderId)
  if (error) throw error
}

export async function markOrderItemDelivered(orderItemId: string, delivered: boolean): Promise<void> {
  const { error } = await supabase
    .from('order_items')
    .update({ delivered_at: delivered ? new Date().toISOString() : null })
    .eq('id', orderItemId)
  if (error) throw error
}

export async function updateDeliveryNotes(orderId: string, notes: string): Promise<void> {
  const { error } = await supabase
    .from('orders')
    .update({ delivery_notes: notes.trim() === '' ? null : notes })
    .eq('id', orderId)
  if (error) throw error
}

export interface RescheduleDeliveryInput {
  tenantId: string
  orderId: string
  previousDate: string
  newDate: string
  reason: string
  createdBy: string
}

// Dois passos sem transação (mesmo padrão já usado em
// comparisons/api.ts:setComparisonWinner) — grava o histórico e só depois
// atualiza a data combinada que deliveryStatus.ts (Etapa 1) já lê.
export async function rescheduleDelivery(input: RescheduleDeliveryInput): Promise<void> {
  const { error: insertError } = await supabase.from('order_delivery_reschedules').insert({
    tenant_id: input.tenantId,
    order_id: input.orderId,
    previous_date: input.previousDate,
    new_date: input.newDate,
    reason: input.reason.trim() === '' ? null : input.reason,
    created_by: input.createdBy,
  })
  if (insertError) throw insertError

  const { error: updateError } = await supabase
    .from('orders')
    .update({ expected_delivery_date: input.newDate })
    .eq('id', input.orderId)
  if (updateError) throw updateError
}
