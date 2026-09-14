import type { ComparisonQuotationRow, ComparisonRequestItemRow } from './types'

export function getQuotationTotal(
  requestItems: ComparisonRequestItemRow[],
  quotation: ComparisonQuotationRow,
): number | null {
  let total = quotation.freight ?? 0

  for (const item of requestItems) {
    const price = quotation.prices.find((p) => p.requestItemId === item.id)
    if (!price || price.unitPrice === null) return null
    total += price.unitPrice * item.quantity
  }

  return total
}

export function getCheapestQuotationId(
  requestItems: ComparisonRequestItemRow[],
  quotations: ComparisonQuotationRow[],
  excludedQuotationIds: string[],
): string | null {
  let cheapest: { quotationId: string; total: number } | null = null

  for (const quotation of quotations) {
    if (excludedQuotationIds.includes(quotation.quotationId)) continue
    const total = getQuotationTotal(requestItems, quotation)
    if (total === null) continue
    if (!cheapest || total < cheapest.total) {
      cheapest = { quotationId: quotation.quotationId, total }
    }
  }

  return cheapest?.quotationId ?? null
}
