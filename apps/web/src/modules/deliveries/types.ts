export type DeliveryOrderApiStatus = 'issued' | 'cancelled'

export type DeliveryStatus = 'atrasado' | 'hoje' | 'no_prazo' | 'chegou_ar_pendente'

export interface DeliveryOrderRow {
  id: string
  orderNumber: string
  unitId: string
  unitName: string
  supplierNames: string[]
  expectedDeliveryDate: string
  deliveredAt: string | null
  deliveryReceiptConfirmedAt: string | null
  deliveryNotes: string | null
  apiStatus: DeliveryOrderApiStatus
}

export interface UnitOption {
  id: string
  name: string
}

export interface DeliveryOrderItemDetail {
  id: string
  materialCode: string | null
  materialName: string
  materialDescription: string | null
  unitOfMeasure: string | null
  quantity: number
  unitPrice: number
  deliveredAt: string | null
}

export interface DeliverySupplierContact {
  id: string
  name: string
  phone: string | null
  email: string | null
}

export interface DeliverySupplierDetail {
  id: string
  name: string
  city: string | null
  contacts: DeliverySupplierContact[]
}

export interface DeliveryOrderDetail {
  id: string
  orderNumber: string
  unitId: string
  unitName: string
  apiStatus: DeliveryOrderApiStatus
  createdAt: string
  expectedDeliveryDate: string
  neededBy: string | null
  negotiatorName: string | null
  deliveredAt: string | null
  deliveryReceiptConfirmedAt: string | null
  deliveryNotes: string | null
  suppliers: DeliverySupplierDetail[]
  items: DeliveryOrderItemDetail[]
}
