import { Button } from '../../components'
import type { ComparisonQuotationRow, ComparisonRequestItemRow } from './types'

export interface ComparisonTableProps {
  requestItems: ComparisonRequestItemRow[]
  quotations: ComparisonQuotationRow[]
  winningQuotationId: string | null
  onSelectWinner: (quotationId: string) => void
  onSendToApproval: () => void
  canSendToApproval: boolean
}

export function ComparisonTable({
  requestItems,
  quotations,
  winningQuotationId,
  onSelectWinner,
  onSendToApproval,
  canSendToApproval,
}: ComparisonTableProps) {
  function priceFor(quotation: ComparisonQuotationRow, requestItemId: string) {
    return quotation.prices.find((price) => price.requestItemId === requestItemId)?.unitPrice ?? null
  }

  function cheapestPriceFor(requestItemId: string): number | null {
    const prices = quotations
      .map((quotation) => priceFor(quotation, requestItemId))
      .filter((price): price is number => price !== null)
    return prices.length > 0 ? Math.min(...prices) : null
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-line text-ink-muted">
              <th className="py-2 pr-4 font-medium">Item</th>
              {quotations.map((quotation) => (
                <th key={quotation.quotationId} className="py-2 pr-4 font-medium">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="winning-quotation"
                      checked={winningQuotationId === quotation.quotationId}
                      onChange={() => onSelectWinner(quotation.quotationId)}
                    />
                    {quotation.supplierName}
                  </label>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {requestItems.map((item) => {
              const cheapest = cheapestPriceFor(item.id)
              return (
                <tr key={item.id} className="border-b border-line">
                  <td className="py-2 pr-4 text-ink">
                    {item.materialName}
                    <span className="text-ink-muted"> — {item.quantity} {item.unitOfMeasure ?? ''}</span>
                  </td>
                  {quotations.map((quotation) => {
                    const price = priceFor(quotation, item.id)
                    const isCheapest = price !== null && cheapest !== null && price === cheapest
                    return (
                      <td
                        key={quotation.quotationId}
                        data-testid={`price-${quotation.quotationId}-${item.id}`}
                        className={`py-2 pr-4 ${isCheapest ? 'bg-badge-available/20 font-medium text-ink' : 'text-ink-muted'}`}
                      >
                        {price === null
                          ? '—'
                          : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                              price,
                            )}
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <Button onClick={onSendToApproval} disabled={!canSendToApproval}>
        Enviar para aprovação
      </Button>
    </div>
  )
}
