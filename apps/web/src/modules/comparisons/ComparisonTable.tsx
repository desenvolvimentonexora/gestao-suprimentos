import { useEffect, useState } from 'react'
import { Button } from '../../components'
import { getCheapestQuotationId, getQuotationTotal } from './combinedPrice'
import { getSupplierColor } from './supplierColor'
import type { ComparisonQuotationRow, ComparisonRequestItemRow } from './types'

export interface QuotationTerms {
  freight: number | null
  paymentTerms: string | null
  deliveryDays: number | null
}

export interface ComparisonTableProps {
  requestItems: ComparisonRequestItemRow[]
  quotations: ComparisonQuotationRow[]
  onWinnerChange: (quotationId: string | null) => void
  onUpdateQuotationTerms: (quotationId: string, terms: QuotationTerms) => void
  onSendToApproval: () => void
  canSendToApproval: boolean
}

const currencyFormatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

function parseNumberInput(value: string): number | null {
  if (value.trim() === '') return null
  const parsed = Number(value)
  return Number.isNaN(parsed) ? null : parsed
}

export function ComparisonTable({
  requestItems,
  quotations,
  onWinnerChange,
  onUpdateQuotationTerms,
  onSendToApproval,
  canSendToApproval,
}: ComparisonTableProps) {
  const [excludedQuotationIds, setExcludedQuotationIds] = useState<string[]>([])

  function priceFor(quotation: ComparisonQuotationRow, requestItemId: string) {
    return quotation.prices.find((price) => price.requestItemId === requestItemId) ?? null
  }

  function cheapestPriceFor(requestItemId: string): number | null {
    const prices = quotations
      .map((quotation) => priceFor(quotation, requestItemId)?.unitPrice ?? null)
      .filter((price): price is number => price !== null)
    return prices.length > 0 ? Math.min(...prices) : null
  }

  const winningQuotationId = getCheapestQuotationId(requestItems, quotations, excludedQuotationIds)

  useEffect(() => {
    onWinnerChange(winningQuotationId)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- só deve disparar quando o vencedor calculado muda, não a cada render
  }, [winningQuotationId])

  function toggleExcluded(quotationId: string) {
    setExcludedQuotationIds((current) =>
      current.includes(quotationId) ? current.filter((id) => id !== quotationId) : [...current, quotationId],
    )
  }

  const winningQuotation = quotations.find((quotation) => quotation.quotationId === winningQuotationId) ?? null
  const combinedBestPrice = winningQuotation ? getQuotationTotal(requestItems, winningQuotation) : null

  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-line text-ink-muted">
              <th className="py-2 pr-4 font-medium">Item</th>
              {quotations.map((quotation) => {
                const isExcluded = excludedQuotationIds.includes(quotation.quotationId)
                const color = getSupplierColor(quotation.quotationId)
                return (
                  <th
                    key={quotation.quotationId}
                    className={`rounded-t border px-3 py-2 font-medium ${isExcluded ? 'opacity-40' : color.header}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span>{quotation.supplierName}</span>
                      <button
                        type="button"
                        onClick={() => toggleExcluded(quotation.quotationId)}
                        aria-label={
                          isExcluded ? `Reincluir ${quotation.supplierName}` : `Excluir ${quotation.supplierName}`
                        }
                        className="rounded px-1 text-ink-muted hover:bg-white/50"
                      >
                        ×
                      </button>
                    </div>
                  </th>
                )
              })}
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
                    const isCheapest =
                      price?.unitPrice !== null && price?.unitPrice !== undefined && price.unitPrice === cheapest
                    return (
                      <td
                        key={quotation.quotationId}
                        data-testid={`price-${quotation.quotationId}-${item.id}`}
                        className={`py-2 pr-4 ${isCheapest ? 'bg-badge-available/20 font-medium text-ink' : 'text-ink-muted'}`}
                      >
                        {price?.unitPrice == null ? '—' : currencyFormatter.format(price.unitPrice)}
                      </td>
                    )
                  })}
                </tr>
              )
            })}

            <tr className="border-b border-line">
              <td className="py-2 pr-4 text-ink-muted">Frete</td>
              {quotations.map((quotation) => (
                <td key={quotation.quotationId} className="py-2 pr-4">
                  <input
                    type="number"
                    defaultValue={quotation.freight ?? ''}
                    aria-label={`Frete ${quotation.supplierName}`}
                    className="w-24 rounded border border-line bg-surface px-2 py-1 text-sm text-ink"
                    onBlur={(e) =>
                      onUpdateQuotationTerms(quotation.quotationId, {
                        freight: parseNumberInput(e.target.value),
                        paymentTerms: quotation.paymentTerms,
                        deliveryDays: quotation.deliveryDays,
                      })
                    }
                  />
                </td>
              ))}
            </tr>

            <tr className="border-b border-line">
              <td className="py-2 pr-4 text-ink-muted">Pagamento</td>
              {quotations.map((quotation) => (
                <td key={quotation.quotationId} className="py-2 pr-4">
                  <input
                    type="text"
                    defaultValue={quotation.paymentTerms ?? ''}
                    aria-label={`Pagamento ${quotation.supplierName}`}
                    className="w-32 rounded border border-line bg-surface px-2 py-1 text-sm text-ink"
                    onBlur={(e) =>
                      onUpdateQuotationTerms(quotation.quotationId, {
                        freight: quotation.freight,
                        paymentTerms: e.target.value.trim() === '' ? null : e.target.value,
                        deliveryDays: quotation.deliveryDays,
                      })
                    }
                  />
                </td>
              ))}
            </tr>

            <tr className="border-b border-line">
              <td className="py-2 pr-4 text-ink-muted">Entrega (dias)</td>
              {quotations.map((quotation) => (
                <td key={quotation.quotationId} className="py-2 pr-4">
                  <input
                    type="number"
                    defaultValue={quotation.deliveryDays ?? ''}
                    aria-label={`Entrega ${quotation.supplierName}`}
                    className="w-20 rounded border border-line bg-surface px-2 py-1 text-sm text-ink"
                    onBlur={(e) =>
                      onUpdateQuotationTerms(quotation.quotationId, {
                        freight: quotation.freight,
                        paymentTerms: quotation.paymentTerms,
                        deliveryDays: parseNumberInput(e.target.value),
                      })
                    }
                  />
                </td>
              ))}
            </tr>

            <tr>
              <td className="py-2 pr-4 font-medium text-ink">Total</td>
              {quotations.map((quotation) => {
                const total = getQuotationTotal(requestItems, quotation)
                const isWinner = quotation.quotationId === winningQuotationId
                return (
                  <td
                    key={quotation.quotationId}
                    data-testid={`total-${quotation.quotationId}`}
                    className={`py-2 pr-4 font-semibold ${isWinner ? 'bg-blue-900 text-white' : 'text-ink'}`}
                  >
                    {total === null ? '—' : currencyFormatter.format(total)}
                  </td>
                )
              })}
            </tr>
          </tbody>
        </table>
      </div>

      {combinedBestPrice !== null && (
        <div className="rounded border border-line bg-badge-available/10 px-4 py-2 text-sm font-medium text-ink">
          🏆 Melhor preço combinado: {currencyFormatter.format(combinedBestPrice)}
        </div>
      )}

      <Button onClick={onSendToApproval} disabled={!canSendToApproval}>
        Enviar para aprovação
      </Button>
    </div>
  )
}
