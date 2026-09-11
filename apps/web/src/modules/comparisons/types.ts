export type ComparisonStatus = 'draft' | 'pending_approval' | 'approved' | 'rejected'

export interface ComparisonRequestItemRow {
  id: string
  materialName: string
  quantity: number
  unitOfMeasure: string | null
}

export interface ComparisonQuotationItemPrice {
  requestItemId: string
  unitPrice: number | null
  leadTimeDays: number | null
}

export interface ComparisonQuotationRow {
  quotationId: string
  supplierName: string
  prices: ComparisonQuotationItemPrice[]
}

export interface ComparableRequestRow {
  requestId: string
  unitName: string
  externalRef: string | null
  comparisonId: string | null
  comparisonStatus: ComparisonStatus | null
  winningQuotationId: string | null
  requestItems: ComparisonRequestItemRow[]
  quotations: ComparisonQuotationRow[]
}

export interface ExtractedQuoteItem {
  description: string
  quantity: number | null
  unitPrice: number
  leadTimeDays: number | null
}

export interface ExtractedItemReview extends ExtractedQuoteItem {
  requestItemId: string | null
  confidence: number
}

export interface SupplierOption {
  id: string
  name: string
}

export interface PendingApprovalRow {
  comparisonId: string
  unitName: string
  externalRef: string | null
  requestId: string
}
