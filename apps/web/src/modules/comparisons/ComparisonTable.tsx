import { Fragment, useEffect, useState } from 'react'
import { Card } from '../../components'
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
}

const currencyFormatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const COLUMN_DIVIDER = 'border-l border-line'

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

  function cheapestSupplierFor(requestItemId: string): { supplierName: string; unitPrice: number } | null {
    let cheapest: { supplierName: string; unitPrice: number } | null = null
    for (const quotation of quotations) {
      const price = priceFor(quotation, requestItemId)
      if (price?.unitPrice == null) continue
      if (!cheapest || price.unitPrice < cheapest.unitPrice) {
        cheapest = { supplierName: quotation.supplierName, unitPrice: price.unitPrice }
      }
    }
    return cheapest
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
    <Card className="flex flex-col gap-4">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-line text-ink-muted">
              <th rowSpan={2} className="py-2 pr-4 font-medium">
                Descrição
              </th>
              <th rowSpan={2} className={`${COLUMN_DIVIDER} px-3 py-2 font-medium`}>
                Und.
              </th>
              <th rowSpan={2} className={`${COLUMN_DIVIDER} px-3 py-2 font-medium`}>
                Qtde.
              </th>
              {quotations.map((quotation) => {
                const isExcluded = excludedQuotationIds.includes(quotation.quotationId)
                const color = getSupplierColor(quotation.quotationId)
                return (
                  <th
                    key={quotation.quotationId}
                    colSpan={2}
                    className={`${COLUMN_DIVIDER} px-3 py-2 font-medium ${isExcluded ? 'bg-surface text-ink-muted opacity-40' : color.header}`}
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
              <th rowSpan={2} className={`${COLUMN_DIVIDER} py-2 px-3 font-medium`}>
                Melhor Forn.
              </th>
            </tr>
            <tr className="border-b border-line text-ink-muted">
              {quotations.map((quotation) => (
                <Fragment key={quotation.quotationId}>
                  <th className={`${COLUMN_DIVIDER} px-3 py-1 text-xs font-medium`}>V.Unit.</th>
                  <th className="px-3 py-1 text-xs font-medium">Total</th>
                </Fragment>
              ))}
            </tr>
          </thead>
          <tbody>
            {requestItems.map((item) => {
              const cheapest = cheapestPriceFor(item.id)
              const bestSupplier = cheapestSupplierFor(item.id)
              return (
                <tr key={item.id} className="border-b border-line">
                  <td className="py-2.5 pr-4 text-ink">{item.materialName}</td>
                  <td className={`${COLUMN_DIVIDER} px-3 py-2.5 text-ink-muted`}>{item.unitOfMeasure ?? '—'}</td>
                  <td className={`${COLUMN_DIVIDER} px-3 py-2.5 text-ink-muted`}>{item.quantity}</td>
                  {quotations.map((quotation) => {
                    const isExcluded = excludedQuotationIds.includes(quotation.quotationId)
                    const price = priceFor(quotation, item.id)
                    const isCheapest =
                      price?.unitPrice !== null && price?.unitPrice !== undefined && price.unitPrice === cheapest
                    const itemTotal = price?.unitPrice != null ? price.unitPrice * item.quantity : null
                    const cellClasses = `${isExcluded ? 'opacity-40' : ''} ${isCheapest ? 'bg-badge-available/30 font-semibold text-ink' : 'text-ink-muted'}`
                    return (
                      <Fragment key={quotation.quotationId}>
                        <td
                          data-testid={`price-${quotation.quotationId}-${item.id}`}
                          className={`${COLUMN_DIVIDER} px-3 py-2.5 ${cellClasses}`}
                        >
                          {price?.unitPrice == null ? '—' : currencyFormatter.format(price.unitPrice)}
                        </td>
                        <td
                          data-testid={`itemTotal-${quotation.quotationId}-${item.id}`}
                          className={`px-3 py-2.5 ${cellClasses}`}
                        >
                          {itemTotal === null ? '—' : currencyFormatter.format(itemTotal)}
                        </td>
                      </Fragment>
                    )
                  })}
                  <td
                    data-testid={`best-${item.id}`}
                    className={`${COLUMN_DIVIDER} bg-ink px-3 py-2.5 font-medium text-white`}
                  >
                    {bestSupplier
                      ? `${bestSupplier.supplierName} — ${currencyFormatter.format(bestSupplier.unitPrice)}`
                      : '—'}
                  </td>
                </tr>
              )
            })}

            <tr className="border-b border-line bg-bg/60">
              <td colSpan={3} className="py-2.5 pr-4 text-ink-muted">
                Frete
              </td>
              {quotations.map((quotation) => (
                <td key={quotation.quotationId} colSpan={2} className={`${COLUMN_DIVIDER} px-3 py-2`}>
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
              <td className={COLUMN_DIVIDER} />
            </tr>

            <tr>
              <td colSpan={3} className="py-2.5 pr-4 font-medium text-ink">
                Total
              </td>
              {quotations.map((quotation) => {
                const total = getQuotationTotal(requestItems, quotation)
                const isWinner = quotation.quotationId === winningQuotationId
                return (
                  <td
                    key={quotation.quotationId}
                    data-testid={`total-${quotation.quotationId}`}
                    colSpan={2}
                    className={`${COLUMN_DIVIDER} px-3 py-2.5 font-semibold ${isWinner ? 'rounded bg-blue-900 text-white' : 'text-ink'}`}
                  >
                    {total === null ? '—' : currencyFormatter.format(total)}
                  </td>
                )
              })}
              <td className={COLUMN_DIVIDER} />
            </tr>

            <tr className="border-b border-line bg-bg/60">
              <td colSpan={3} className="py-2.5 pr-4 text-ink-muted">
                Pagamento
              </td>
              {quotations.map((quotation) => (
                <td key={quotation.quotationId} colSpan={2} className={`${COLUMN_DIVIDER} px-3 py-2`}>
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
              <td className={COLUMN_DIVIDER} />
            </tr>

            <tr className="border-b border-line bg-bg/60">
              <td colSpan={3} className="py-2.5 pr-4 text-ink-muted">
                Entrega (dias)
              </td>
              {quotations.map((quotation) => (
                <td key={quotation.quotationId} colSpan={2} className={`${COLUMN_DIVIDER} px-3 py-2`}>
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
              <td className={COLUMN_DIVIDER} />
            </tr>
          </tbody>
        </table>
      </div>

      {combinedBestPrice !== null && (
        <div className="rounded bg-primary px-4 py-3 text-base font-semibold text-on-primary">
          🏆 Melhor preço combinado: {currencyFormatter.format(combinedBestPrice)}
        </div>
      )}
    </Card>
  )
}
