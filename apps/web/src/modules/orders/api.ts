import { supabase } from '../../lib/supabase'
import { getOrderTotal } from './getOrderTotal'
import { suggestOrderNumber } from './suggestOrderNumber'
import type { CreateOrderValues, OrderDraftItem, OrderRow, ReleasedComparisonRow } from './types'

export async function fetchReleasedAwaitingOrder(): Promise<ReleasedComparisonRow[]> {
  const { data: comparisons, error } = await supabase
    .from('comparisons')
    .select('id, requests(id, external_ref, unit_id, units(name))')
    .eq('status', 'released')
    .is('deleted_at', null)
  if (error) throw error

  const { data: existingOrders, error: ordersError } = await supabase
    .from('orders')
    .select('comparison_id')
    .is('deleted_at', null)
  if (ordersError) throw ordersError

  const orderedComparisonIds = new Set(existingOrders.map((order) => order.comparison_id))
  const awaiting = comparisons.filter((comparison) => !orderedComparisonIds.has(comparison.id))
  const comparisonIds = awaiting.map((comparison) => comparison.id)

  const { data: winnerRows, error: winnersError } = await supabase
    .from('comparison_winners')
    .select('comparison_id, request_items(quantity), quotation_items(unit_price)')
    .in('comparison_id', comparisonIds.length > 0 ? comparisonIds : [''])
  if (winnersError) throw winnersError

  const itemsByComparisonId = new Map<string, { quantity: number; unitPrice: number }[]>()
  for (const row of winnerRows) {
    const list = itemsByComparisonId.get(row.comparison_id) ?? []
    list.push({
      quantity: Number(row.request_items?.quantity ?? 0),
      unitPrice: Number(row.quotation_items?.unit_price ?? 0),
    })
    itemsByComparisonId.set(row.comparison_id, list)
  }

  return awaiting.map((comparison) => ({
    comparisonId: comparison.id,
    requestId: comparison.requests?.id ?? '',
    unitId: comparison.requests?.unit_id ?? '',
    unitName: comparison.requests?.units?.name ?? '',
    externalRef: comparison.requests?.external_ref ?? null,
    totalValue: getOrderTotal(itemsByComparisonId.get(comparison.id) ?? []),
  }))
}

export async function fetchComparisonOrderDraft(comparisonId: string): Promise<OrderDraftItem[]> {
  const { data, error } = await supabase
    .from('comparison_winners')
    .select(
      'request_item_id, quotation_item_id, request_items(material_id, quantity, unit_of_measure, materials(name)), quotation_items(unit_price, quotations(supplier_id, suppliers(name)))',
    )
    .eq('comparison_id', comparisonId)
  if (error) throw error

  return data.map((row) => ({
    requestItemId: row.request_item_id,
    quotationItemId: row.quotation_item_id,
    materialId: row.request_items?.material_id ?? '',
    materialName: row.request_items?.materials?.name ?? '',
    quantity: Number(row.request_items?.quantity ?? 0),
    unitOfMeasure: row.request_items?.unit_of_measure ?? null,
    supplierId: row.quotation_items?.quotations?.supplier_id ?? '',
    supplierName: row.quotation_items?.quotations?.suppliers?.name ?? '',
    unitPrice: Number(row.quotation_items?.unit_price ?? 0),
  }))
}

export async function fetchNextOrderNumberSuggestion(tenantId: string): Promise<string> {
  const { count, error } = await supabase
    .from('orders')
    .select('id', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
  if (error) throw error
  return suggestOrderNumber((count ?? 0) + 1)
}

export interface CreateOrderInput extends CreateOrderValues {
  tenantId: string
  comparisonId: string
  requestId: string
  unitId: string
}

export async function createOrder(input: CreateOrderInput): Promise<string> {
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      tenant_id: input.tenantId,
      comparison_id: input.comparisonId,
      request_id: input.requestId,
      unit_id: input.unitId,
      order_number: input.orderNumber,
      expected_delivery_date: input.expectedDeliveryDate || null,
    })
    .select('id')
    .single()
  if (orderError) throw orderError

  const draftItems = await fetchComparisonOrderDraft(input.comparisonId)

  const { error: itemsError } = await supabase.from('order_items').insert(
    draftItems.map((item) => ({
      tenant_id: input.tenantId,
      order_id: order.id,
      request_item_id: item.requestItemId,
      material_id: item.materialId,
      supplier_id: item.supplierId,
      quantity: item.quantity,
      unit_price: item.unitPrice,
    })),
  )
  if (itemsError) throw itemsError

  return order.id
}

export async function fetchOrders(): Promise<OrderRow[]> {
  const { data, error } = await supabase
    .from('orders')
    .select(
      'id, order_number, status, expected_delivery_date, units(name), order_items(quantity, unit_price, suppliers(name))',
    )
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
  if (error) throw error

  return data.map((row) => ({
    id: row.id,
    orderNumber: row.order_number,
    unitName: row.units?.name ?? '',
    supplierNames: [
      ...new Set(row.order_items.map((item) => item.suppliers?.name).filter((name): name is string => Boolean(name))),
    ],
    totalValue: getOrderTotal(
      row.order_items.map((item) => ({ quantity: Number(item.quantity), unitPrice: Number(item.unit_price) })),
    ),
    expectedDeliveryDate: row.expected_delivery_date,
    status: row.status as OrderRow['status'],
  }))
}

export async function cancelOrder(orderId: string): Promise<void> {
  const { error } = await supabase.from('orders').update({ status: 'cancelled' }).eq('id', orderId)
  if (error) throw error
}
