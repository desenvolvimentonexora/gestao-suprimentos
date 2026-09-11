export interface OrderTotalItem {
  quantity: number
  unitPrice: number
}

export function getOrderTotal(items: OrderTotalItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
}
