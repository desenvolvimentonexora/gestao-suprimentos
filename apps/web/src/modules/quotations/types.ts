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
  materialCode: string | null
  materialDescription: string | null
  quantity: number
  unitOfMeasure: string | null
  statusCode: string | null
  authorizedAt: string | null
}

export interface NegotiatingRequestRow {
  id: string
  unitId: string
  unitName: string
  neededBy: string | null
  neededByChanged: boolean
  externalRef: string | null
  sequenceNumber: number | null
  createdAt: string
  notes: string | null
  negotiatorId: string | null
  negotiatorName: string | null
  negotiatingStartedAt: string | null
  items: NegotiatingRequestItemRow[]
  quotations: QuotationRow[]
}

export interface NegotiatorOption {
  id: string
  name: string
}
