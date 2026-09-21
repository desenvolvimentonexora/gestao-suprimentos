import type { DeliveryOrderRow } from './types'

export function groupOrdersByDate(orders: DeliveryOrderRow[]): Map<string, DeliveryOrderRow[]> {
  const map = new Map<string, DeliveryOrderRow[]>()
  for (const order of orders) {
    const list = map.get(order.expectedDeliveryDate) ?? []
    list.push(order)
    map.set(order.expectedDeliveryDate, list)
  }
  return map
}
