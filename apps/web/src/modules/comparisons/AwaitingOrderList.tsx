import { CheckCircle2 } from 'lucide-react'
import { Card, ComingSoonButton } from '../../components'
import { formatCurrency, formatDateTime } from '../../lib/formatters'
import { formatSolNumber } from './formatSolNumber'
import type { ReleasedComparisonRow } from './types'

export interface AwaitingOrderListProps {
  rows: ReleasedComparisonRow[]
}

export function AwaitingOrderList({ rows }: AwaitingOrderListProps) {
  return (
    <div className="flex flex-col gap-4">
      <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700">
        <CheckCircle2 size={14} aria-hidden="true" />
        {rows.length} liberadas aguardando pedido
      </span>

      <div className="flex items-center gap-1.5 text-xs font-semibold uppercase text-ink-muted">
        <CheckCircle2 size={14} aria-hidden="true" />
        Liberadas · Pronto para pedido
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-ink-muted">Nenhuma comparação liberada aguardando pedido.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {rows.map((row) => (
            <Card
              key={row.comparisonId}
              className="flex flex-col gap-3 border-l-4 border-l-emerald-500 sm:flex-row sm:items-start sm:justify-between"
            >
              <div className="flex flex-1 flex-col gap-1">
                <p className="font-semibold text-ink">
                  {formatSolNumber(row.externalRef, row.sequenceNumber)}   {row.unitName}
                </p>

                {row.submittedByName && row.submittedAt && (
                  <p className="text-xs text-ink-muted">
                    por {row.submittedByName} em {formatDateTime(new Date(row.submittedAt))}
                  </p>
                )}

                <p className="text-sm text-ink">
                  {formatCurrency(row.totalValue, 'BRL')} • {row.itemCount} {row.itemCount === 1 ? 'item' : 'itens'} •{' '}
                  {row.supplierCount} {row.supplierCount === 1 ? 'fornecedor' : 'fornecedores'}
                </p>

                {row.releasedByName && row.releasedAt && (
                  <p className="text-sm text-emerald-700">
                    ✔ Liberada p/ pedido por {row.releasedByName} em {formatDateTime(new Date(row.releasedAt))}
                  </p>
                )}

                {row.note && <p className="text-sm text-blue-700">💬 Obs.: {row.note}</p>}
              </div>

              <ComingSoonButton label="Ver" variant="info" />
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
