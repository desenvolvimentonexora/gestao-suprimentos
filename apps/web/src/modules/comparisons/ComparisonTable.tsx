import { Fragment, useEffect, useState } from 'react'
import { TriangleAlert, Trophy } from 'lucide-react'
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
  onReviewUnmatchedItems: (quotationId: string) => void
  isEditable: boolean
}

const currencyFormatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const COLUMN_DIVIDER = 'border-l border-line'
// Verde escuro é sempre "menor preço unitário desta linha" (não a cor do
// fornecedor) — azul-marinho, à parte, é reservado pro menor total
// combinado (ver totalRowCellClasses).
const CHEAPEST_UNIT_PRICE_CLASSES = 'bg-emerald-50 text-emerald-800'
const CHEAPEST_UNIT_PRICE_TEXT = 'text-emerald-700'

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
  onReviewUnmatchedItems,
  isEditable,
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

  function cheapestSupplierFor(
    requestItemId: string,
  ): { quotationId: string; supplierName: string; unitPrice: number } | null {
    let cheapest: { quotationId: string; supplierName: string; unitPrice: number } | null = null
    for (const quotation of quotations) {
      const price = priceFor(quotation, requestItemId)
      if (price?.unitPrice == null) continue
      if (!cheapest || price.unitPrice < cheapest.unitPrice) {
        cheapest = { quotationId: quotation.quotationId, supplierName: quotation.supplierName, unitPrice: price.unitPrice }
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

  // Só a linha Total recebe o preenchimento sólido do vencedor (menor total
  // combinado) — Frete fica neutro pra todo mundo, igual Pagamento e Entrega
  // (a cor por fornecedor fica só no cabeçalho e na célula mais barata de
  // cada item).
  function totalRowCellClasses(quotationId: string): string {
    if (excludedQuotationIds.includes(quotationId)) return 'opacity-40'
    if (quotationId === winningQuotationId) return 'bg-blue-900 text-white'
    return 'text-ink'
  }

  function neutralFooterCellClasses(quotationId: string): string {
    return excludedQuotationIds.includes(quotationId) ? 'opacity-40' : 'text-ink'
  }

  return (
    <div className="flex flex-col rounded-sm border border-line bg-surface pt-4">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-line text-ink-muted">
              <th rowSpan={2} className="min-w-[240px] bg-blue-900 py-2 pr-4 pl-3 font-semibold text-white">
                Descrição
              </th>
              <th rowSpan={2} className={`${COLUMN_DIVIDER} bg-blue-900 px-3 py-2 font-semibold text-white`}>
                Und.
              </th>
              <th rowSpan={2} className={`${COLUMN_DIVIDER} bg-blue-900 px-3 py-2 font-semibold text-white`}>
                Qtde.
              </th>
              {quotations.map((quotation) => {
                const isExcluded = excludedQuotationIds.includes(quotation.quotationId)
                const isWinner = quotation.quotationId === winningQuotationId
                const color = getSupplierColor(quotation.quotationId)
                return (
                  <th
                    key={quotation.quotationId}
                    colSpan={2}
                    className={`${COLUMN_DIVIDER} px-3 py-2 font-semibold ${isExcluded ? 'bg-surface text-ink-muted opacity-40' : color.tableHeader}`}
                  >
                    <div className="relative flex items-center justify-center gap-2">
                      <span className="flex items-center gap-1">
                        {isWinner && <Trophy size={14} aria-hidden="true" />}
                        {quotation.supplierName}
                      </span>
                      <div className="absolute right-0 flex items-center gap-1">
                        {quotation.unmatchedItemsCount > 0 && (
                          <button
                            type="button"
                            onClick={() => onReviewUnmatchedItems(quotation.quotationId)}
                            className="flex items-center gap-1 rounded-sm bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-800 hover:bg-amber-200"
                          >
                            <TriangleAlert size={12} aria-hidden="true" />
                            {quotation.unmatchedItemsCount}{' '}
                            {quotation.unmatchedItemsCount === 1 ? 'item não identificado' : 'itens não identificados'}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => toggleExcluded(quotation.quotationId)}
                          disabled={!isEditable}
                          aria-label={
                            isExcluded ? `Reincluir ${quotation.supplierName}` : `Excluir ${quotation.supplierName}`
                          }
                          className="rounded-sm px-1 text-ink-muted hover:bg-white/50 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  </th>
                )
              })}
              <th
                rowSpan={2}
                className={`${COLUMN_DIVIDER} w-36 max-w-[9rem] bg-emerald-700 py-2 px-3 font-semibold text-white`}
              >
                <span className="flex items-center justify-center gap-1">
                  <Trophy size={14} aria-hidden="true" />
                  Melhor Forn.
                </span>
              </th>
            </tr>
            <tr className="border-b border-line">
              {quotations.map((quotation) => {
                const isExcluded = excludedQuotationIds.includes(quotation.quotationId)
                const color = getSupplierColor(quotation.quotationId)
                const tagClasses = isExcluded ? 'bg-surface text-ink-muted opacity-40' : color.tag
                return (
                  <Fragment key={quotation.quotationId}>
                    <th className={`${COLUMN_DIVIDER} px-3 py-1 text-right text-xs font-semibold ${tagClasses}`}>
                      V.Unit.
                    </th>
                    <th className={`${COLUMN_DIVIDER} px-3 py-1 text-right text-xs font-semibold ${tagClasses}`}>
                      Total
                    </th>
                  </Fragment>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {requestItems.map((item) => {
              const cheapest = cheapestPriceFor(item.id)
              const bestSupplier = cheapestSupplierFor(item.id)
              return (
                <tr key={item.id} className="border-b border-line">
                  <td className="min-w-[240px] py-2.5 pr-4 pl-3 text-ink">
                    {item.materialDescription ?? item.materialName}
                  </td>
                  <td className={`${COLUMN_DIVIDER} px-3 py-2.5 text-ink-muted`}>{item.unitOfMeasure ?? '—'}</td>
                  <td className={`${COLUMN_DIVIDER} px-3 py-2.5 text-ink-muted`}>{item.quantity}</td>
                  {quotations.map((quotation) => {
                    const isExcluded = excludedQuotationIds.includes(quotation.quotationId)
                    const price = priceFor(quotation, item.id)
                    const isCheapest =
                      price?.unitPrice !== null && price?.unitPrice !== undefined && price.unitPrice === cheapest
                    const itemTotal = price?.unitPrice != null ? price.unitPrice * item.quantity : null
                    const cellClasses = `${isExcluded ? 'opacity-40' : ''} ${isCheapest ? `${CHEAPEST_UNIT_PRICE_CLASSES} font-semibold` : 'text-ink-muted'}`
                    return (
                      <Fragment key={quotation.quotationId}>
                        <td
                          data-testid={`price-${quotation.quotationId}-${item.id}`}
                          className={`${COLUMN_DIVIDER} px-3 py-2.5 text-right ${cellClasses}`}
                        >
                          {price?.unitPrice == null ? '—' : currencyFormatter.format(price.unitPrice)}
                        </td>
                        <td
                          data-testid={`itemTotal-${quotation.quotationId}-${item.id}`}
                          className={`${COLUMN_DIVIDER} px-3 py-2.5 text-right ${cellClasses}`}
                        >
                          {itemTotal === null ? '—' : currencyFormatter.format(itemTotal)}
                        </td>
                      </Fragment>
                    )
                  })}
                  <td
                    data-testid={`best-${item.id}`}
                    className={`${COLUMN_DIVIDER} bg-surface px-3 py-2.5 text-right font-semibold ${bestSupplier ? CHEAPEST_UNIT_PRICE_TEXT : 'text-ink-muted'}`}
                  >
                    {bestSupplier
                      ? `${bestSupplier.supplierName} — ${currencyFormatter.format(bestSupplier.unitPrice)}`
                      : '—'}
                  </td>
                </tr>
              )
            })}

            <tr className="border-b border-line bg-bg/60">
              <td colSpan={3} className="py-2.5 pr-4 text-right text-ink-muted">
                Frete
              </td>
              {quotations.map((quotation) => (
                <td
                  key={quotation.quotationId}
                  colSpan={2}
                  className={`${COLUMN_DIVIDER} px-3 py-2 text-right ${neutralFooterCellClasses(quotation.quotationId)}`}
                >
                  {isEditable ? (
                    <input
                      type="number"
                      defaultValue={quotation.freight ?? ''}
                      aria-label={`Frete ${quotation.supplierName}`}
                      className="w-24 rounded-sm border border-line bg-surface px-2 py-1 text-right text-sm text-ink"
                      onBlur={(e) =>
                        onUpdateQuotationTerms(quotation.quotationId, {
                          freight: parseNumberInput(e.target.value),
                          paymentTerms: quotation.paymentTerms,
                          deliveryDays: quotation.deliveryDays,
                        })
                      }
                    />
                  ) : (
                    <span className="text-sm">
                      {quotation.freight != null ? currencyFormatter.format(quotation.freight) : '—'}
                    </span>
                  )}
                </td>
              ))}
              <td className={COLUMN_DIVIDER} />
            </tr>

            <tr>
              <td colSpan={3} className="py-2.5 pr-4 text-right font-medium text-ink">
                Total
              </td>
              {quotations.map((quotation) => {
                const total = getQuotationTotal(requestItems, quotation)
                return (
                  <td
                    key={quotation.quotationId}
                    data-testid={`total-${quotation.quotationId}`}
                    colSpan={2}
                    className={`${COLUMN_DIVIDER} px-3 py-2.5 text-right font-semibold ${totalRowCellClasses(quotation.quotationId)}`}
                  >
                    {total === null ? '—' : currencyFormatter.format(total)}
                  </td>
                )
              })}
              <td className={COLUMN_DIVIDER} />
            </tr>

            <tr className="border-b border-line bg-bg/60">
              <td colSpan={3} className="py-2.5 pr-4 text-right text-ink-muted">
                Pagamento
              </td>
              {quotations.map((quotation) => (
                <td key={quotation.quotationId} colSpan={2} className={`${COLUMN_DIVIDER} px-3 py-2`}>
                  {isEditable ? (
                    <input
                      type="text"
                      defaultValue={quotation.paymentTerms ?? ''}
                      aria-label={`Pagamento ${quotation.supplierName}`}
                      className="w-32 rounded-sm border border-line bg-surface px-2 py-1 text-sm text-ink"
                      onBlur={(e) =>
                        onUpdateQuotationTerms(quotation.quotationId, {
                          freight: quotation.freight,
                          paymentTerms: e.target.value.trim() === '' ? null : e.target.value,
                          deliveryDays: quotation.deliveryDays,
                        })
                      }
                    />
                  ) : (
                    <span className="text-sm text-ink">{quotation.paymentTerms || '—'}</span>
                  )}
                </td>
              ))}
              <td className={COLUMN_DIVIDER} />
            </tr>

            <tr className="border-b border-line bg-bg/60">
              <td colSpan={3} className="py-2.5 pr-4 text-right text-ink-muted">
                Entrega (dias)
              </td>
              {quotations.map((quotation) => (
                <td
                  key={quotation.quotationId}
                  colSpan={2}
                  className={`${COLUMN_DIVIDER} px-3 py-2 text-right`}
                >
                  {isEditable ? (
                    <input
                      type="number"
                      defaultValue={quotation.deliveryDays ?? ''}
                      aria-label={`Entrega ${quotation.supplierName}`}
                      className="w-20 rounded-sm border border-line bg-surface px-2 py-1 text-right text-sm text-ink"
                      onBlur={(e) =>
                        onUpdateQuotationTerms(quotation.quotationId, {
                          freight: quotation.freight,
                          paymentTerms: quotation.paymentTerms,
                          deliveryDays: parseNumberInput(e.target.value),
                        })
                      }
                    />
                  ) : (
                    <span className="text-sm text-ink">
                      {quotation.deliveryDays != null ? quotation.deliveryDays : '—'}
                    </span>
                  )}
                </td>
              ))}
              <td className={COLUMN_DIVIDER} />
            </tr>
          </tbody>
        </table>
      </div>

      {combinedBestPrice !== null && (
        <div className="rounded-b-md bg-primary px-4 py-3 text-center text-base font-semibold text-on-primary">
          🏆 Melhor preço combinado: {currencyFormatter.format(combinedBestPrice)}
        </div>
      )}
    </div>
  )
}
