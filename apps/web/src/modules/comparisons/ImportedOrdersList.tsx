import { Badge, Card } from '../../components'
import type { ImportedOrderRow } from './types'

export interface ImportedOrdersListProps {
  rows: ImportedOrderRow[]
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('pt-BR').format(new Date(`${value}T00:00:00`))
}

export function ImportedOrdersList({ rows }: ImportedOrdersListProps) {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-semibold text-ink">Pedidos importados</h3>
      {rows.length === 0 ? (
        <p className="text-sm text-ink-muted">Nenhum pedido importado ainda.</p>
      ) : (
        rows.map((row) => (
          <Card key={row.orderId} className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-ink">{row.orderNumber}</p>
              <p className="text-xs text-ink-muted">
                <span>{row.unitName}</span> · <span>{row.supplierNames.join(', ')}</span>
              </p>
            </div>
            <p className="text-sm text-ink-muted">
              {row.expectedDeliveryDate ? formatDate(row.expectedDeliveryDate) : '—'}
            </p>
            <Badge>{row.status === 'issued' ? 'Emitido' : 'Cancelado'}</Badge>
          </Card>
        ))
      )}
    </div>
  )
}
