import { Button } from '../../components'
import { getCombinedBestPrice } from './combinedPrice'
import type { ComparisonQuotationRow, ComparisonRequestItemRow, ComparisonWinner } from './types'

export interface ComparisonTableProps {
  requestItems: ComparisonRequestItemRow[]
  quotations: ComparisonQuotationRow[]
  winners: ComparisonWinner[]
  onSelectWinner: (requestItemId: string, quotationItemId: string) => void
  onSendToApproval: () => void
  canSendToApproval: boolean
}

const currencyFormatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

export function ComparisonTable({
  requestItems,
  quotations,
  winners,
  onSelectWinner,
  onSendToApproval,
  canSendToApproval,
}: ComparisonTableProps) {
  function priceFor(quotation: ComparisonQuotationRow, requestItemId: string) {
    return quotation.prices.find((price) => price.requestItemId === requestItemId) ?? null
  }

  function cheapestPriceFor(requestItemId: string): number | null {
    const prices = quotations
      .map((quotation) => priceFor(quotation, requestItemId)?.unitPrice ?? null)
      .filter((price): price is number => price !== null)
    return prices.length > 0 ? Math.min(...prices) : null
  }

  function winnerSupplierFor(requestItemId: string): string | null {
    const winner = winners.find((w) => w.requestItemId === requestItemId)
    if (!winner) return null
    for (const quotation of quotations) {
      if (quotation.prices.some((price) => price.quotationItemId === winner.quotationItemId)) {
        return quotation.supplierName
      }
    }
    return null
  }

  const combinedBestPrice = getCombinedBestPrice(requestItems, quotations, winners)

  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-line text-ink-muted">
              <th className="py-2 pr-4 font-medium">Item</th>
              {quotations.map((quotation) => (
                <th key={quotation.quotationId} className="py-2 pr-4 font-medium">
                  {quotation.supplierName}
                </th>
              ))}
              <th className="py-2 pr-4 font-medium">Melhor Forn.</th>
            </tr>
          </thead>
          <tbody>
            {requestItems.map((item) => {
              const cheapest = cheapestPriceFor(item.id)
              const winnerSupplier = winnerSupplierFor(item.id)
              return (
                <tr key={item.id} className="border-b border-line">
                  <td className="py-2 pr-4 text-ink">
                    {item.materialName}
                    <span className="text-ink-muted"> — {item.quantity} {item.unitOfMeasure ?? ''}</span>
                  </td>
                  {quotations.map((quotation) => {
                    const price = priceFor(quotation, item.id)
                    const isCheapest =
                      price?.unitPrice !== null && price?.unitPrice !== undefined && price.unitPrice === cheapest
                    const isWinner =
                      price?.quotationItemId !== null &&
                      winners.some(
                        (w) => w.requestItemId === item.id && w.quotationItemId === price?.quotationItemId,
                      )
                    return (
                      <td
                        key={quotation.quotationId}
                        data-testid={`price-${quotation.quotationId}-${item.id}`}
                        className={`py-2 pr-4 ${isCheapest ? 'bg-badge-available/20 font-medium text-ink' : 'text-ink-muted'}`}
                      >
                        {price?.unitPrice == null ? (
                          '—'
                        ) : (
                          <label className="flex items-center gap-1">
                            <input
                              type="radio"
                              name={`winner-${item.id}`}
                              checked={isWinner}
                              onChange={() =>
                                price.quotationItemId && onSelectWinner(item.id, price.quotationItemId)
                              }
                              aria-label={quotation.supplierName}
                            />
                            {currencyFormatter.format(price.unitPrice)}
                          </label>
                        )}
                      </td>
                    )
                  })}
                  <td data-testid={`winner-${item.id}`} className="py-2 pr-4 text-ink">
                    {winnerSupplier ?? '—'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {combinedBestPrice !== null && (
        <div className="rounded border border-line bg-badge-available/10 px-4 py-2 text-sm font-medium text-ink">
          Melhor preço combinado: {currencyFormatter.format(combinedBestPrice)}
        </div>
      )}

      <Button onClick={onSendToApproval} disabled={!canSendToApproval}>
        Enviar para aprovação
      </Button>
    </div>
  )
}
