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
