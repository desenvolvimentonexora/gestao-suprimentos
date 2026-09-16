export type ComparisonStatus =
  | 'draft'
  | 'pending_approval'
  | 'approved'
  | 'pending_release'
  | 'released'
  | 'rejected'

export interface ComparisonRequestItemRow {
  id: string
  materialName: string
  quantity: number
  unitOfMeasure: string | null
}

export interface ComparisonQuotationItemPrice {
  requestItemId: string
  quotationItemId: string | null
  unitPrice: number | null
  leadTimeDays: number | null
}

export interface ComparisonQuotationRow {
  quotationId: string
  supplierName: string
  freight: number | null
  paymentTerms: string | null
  deliveryDays: number | null
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

export interface ExtractedQuoteData {
  items: ExtractedQuoteItem[]
  freight: number | null
  paymentTerms: string | null
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

export interface PendingReleaseRow {
  comparisonId: string
  unitName: string
  externalRef: string | null
  requestId: string
}

export interface HistoryRow {
  comparisonId: string
  unitName: string
  externalRef: string | null
  status: ComparisonStatus
  rejectionReason: string | null
  releasedAt: string | null
  order: { orderNumber: string; status: OrderStatus } | null
}

export interface ReleasedComparisonRow {
  comparisonId: string
  requestId: string
  unitId: string
  unitName: string
  externalRef: string | null
  totalValue: number
}

export type OrderStatus = 'issued' | 'cancelled'

// Pedido é emitido no ERP do cliente, não no nosso sistema — o comprador
// importa aqui o Excel do pedido de compra que o ERP gerou. Cada linha
// da planilha traz o número da SOL (external_ref) para casar com a
// comparação já liberada correspondente.
export interface OrderImportColumnMapping {
  externalRef: string
  orderNumber: string
  supplier: string
  material: string
  materialCode: string
  quantity: string
  unitPrice: string
  expectedDeliveryDate: string
}

export interface OrderImportRowError {
  row: number
  reason: string
}

export interface OrderImportItemRow {
  supplierId: string
  materialId: string | null
  materialNameRaw: string
  requestItemId: string | null
  quantity: number
  unitPrice: number
}

export interface OrderImportGroup {
  comparisonId: string
  requestId: string
  unitId: string
  orderNumber: string
  expectedDeliveryDate: string | null
  items: OrderImportItemRow[]
}

export interface OrderImportParseResult {
  successes: OrderImportGroup[]
  errors: OrderImportRowError[]
}

export interface OrderImportComparisonOption {
  comparisonId: string
  requestId: string
  unitId: string
  externalRef: string
  hasOrder: boolean
}

export interface OrderImportMaterialOption {
  id: string
  name: string
  code: string | null
}

export interface OrderImportRequestItemOption {
  id: string
  requestId: string
  materialId: string
}

export interface OrderImportContext {
  comparisons: OrderImportComparisonOption[]
  suppliers: SupplierOption[]
  materials: OrderImportMaterialOption[]
  requestItems: OrderImportRequestItemOption[]
}

