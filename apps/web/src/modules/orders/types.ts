export type OrderStatus = 'issued' | 'cancelled'

export interface ReleasedComparisonRow {
  comparisonId: string
  requestId: string
  unitId: string
  unitName: string
  externalRef: string | null
  totalValue: number
}

export interface OrderDraftItem {
  requestItemId: string
  quotationItemId: string
  materialId: string
  materialName: string
  quantity: number
  unitOfMeasure: string | null
  supplierId: string
  supplierName: string
  unitPrice: number
}

export interface OrderRow {
  id: string
  orderNumber: string
  unitName: string
  supplierNames: string[]
  totalValue: number
  expectedDeliveryDate: string | null
  status: OrderStatus
}

export interface CreateOrderValues {
  orderNumber: string
  expectedDeliveryDate: string
}
