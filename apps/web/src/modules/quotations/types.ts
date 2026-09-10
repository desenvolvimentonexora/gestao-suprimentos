export type QuotationStatus = 'pending' | 'received' | 'discarded'

export interface SupplierOption {
  id: string
  name: string
}

export interface QuotationItemFormValues {
  requestItemId: string
  unitPrice: string
  leadTimeDays: string
}

export interface QuotationFormValues {
  supplierId: string
  items: QuotationItemFormValues[]
}

export interface QuotationRow {
  id: string
  supplierId: string
  supplierName: string
  status: QuotationStatus
  submittedAt: string | null
}

export interface NegotiatingRequestItemRow {
  id: string
  materialName: string
  quantity: number
  unitOfMeasure: string | null
}

export interface NegotiatingRequestRow {
  id: string
  unitName: string
  neededBy: string | null
  externalRef: string | null
  items: NegotiatingRequestItemRow[]
  quotations: QuotationRow[]
}
