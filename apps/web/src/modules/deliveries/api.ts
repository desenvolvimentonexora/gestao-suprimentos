import { supabase } from '../../lib/supabase'
import type { DeliveryOrderRow, UnitOption } from './types'

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
