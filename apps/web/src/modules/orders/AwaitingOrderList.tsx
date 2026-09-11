import { Button, Card } from '../../components'
import { formatCurrency } from '../../lib/formatters'
import type { ReleasedComparisonRow } from './types'

export interface AwaitingOrderListProps {
  rows: ReleasedComparisonRow[]
  onGenerateOrder: (comparisonId: string) => void
}

export function AwaitingOrderList({ rows, onGenerateOrder }: AwaitingOrderListProps) {
  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold text-ink">Comparações liberadas, aguardando pedido</h2>
      {rows.length === 0 ? (
        <p className="text-sm text-ink-muted">Nenhuma comparação liberada aguardando pedido.</p>
      ) : (
        rows.map((row) => (
          <Card key={row.comparisonId} className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-ink">{row.unitName}</p>
              <p className="text-xs text-ink-muted">{row.externalRef ?? '—'}</p>
            </div>
            <p className="text-sm font-medium text-ink">{formatCurrency(row.totalValue, 'BRL')}</p>
            <Button onClick={() => onGenerateOrder(row.comparisonId)}>Gerar pedido</Button>
          </Card>
        ))
      )}
    </div>
  )
}
