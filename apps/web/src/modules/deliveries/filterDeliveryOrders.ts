import type { DeliveryOrderRow } from './types'

export interface FilterDeliveryOrdersOptions {
  search: string
  unitId: string | null
}

export function filterDeliveryOrders(
  orders: DeliveryOrderRow[],
  { search, unitId }: FilterDeliveryOrdersOptions,
): DeliveryOrderRow[] {
  const normalizedSearch = search.trim().toLowerCase()

  return orders.filter((order) => {
    if (unitId && order.unitId !== unitId) return false
    if (normalizedSearch) {
      const matchesOrderNumber = order.orderNumber.toLowerCase().includes(normalizedSearch)
      const matchesSupplier = order.supplierNames.some((name) => name.toLowerCase().includes(normalizedSearch))
      if (!matchesOrderNumber && !matchesSupplier) return false
    }
    return true
  })
}
