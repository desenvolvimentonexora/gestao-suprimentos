import type { ComparisonQuotationRow, ComparisonRequestItemRow, ComparisonWinner } from './types'

export function suggestCheapestWinners(
  requestItems: ComparisonRequestItemRow[],
  quotations: ComparisonQuotationRow[],
): ComparisonWinner[] {
  const winners: ComparisonWinner[] = []

  for (const item of requestItems) {
    let cheapest: { quotationItemId: string; unitPrice: number } | null = null

    for (const quotation of quotations) {
      const price = quotation.prices.find((p) => p.requestItemId === item.id)
      if (!price || price.unitPrice === null || !price.quotationItemId) continue
      if (!cheapest || price.unitPrice < cheapest.unitPrice) {
        cheapest = { quotationItemId: price.quotationItemId, unitPrice: price.unitPrice }
      }
    }

    if (cheapest) {
      winners.push({ requestItemId: item.id, quotationItemId: cheapest.quotationItemId })
    }
  }

  return winners
}

export function getCombinedBestPrice(
  requestItems: ComparisonRequestItemRow[],
  quotations: ComparisonQuotationRow[],
  winners: ComparisonWinner[],
): number | null {
  if (winners.length < requestItems.length) return null

  let total = 0
  for (const item of requestItems) {
    const winner = winners.find((w) => w.requestItemId === item.id)
    if (!winner) return null

    let unitPrice: number | null = null
    for (const quotation of quotations) {
      const price = quotation.prices.find((p) => p.quotationItemId === winner.quotationItemId)
      if (price) {
        unitPrice = price.unitPrice
        break
      }
    }
    if (unitPrice === null) return null

    total += unitPrice * item.quantity
  }

  return total
}
