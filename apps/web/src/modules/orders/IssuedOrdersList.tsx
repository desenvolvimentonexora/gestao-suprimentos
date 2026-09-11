import { Button } from '../../components'
import { formatCurrency, formatDate } from '../../lib/formatters'
import type { OrderRow } from './types'

export interface IssuedOrdersListProps {
  rows: OrderRow[]
  onCancelOrder: (orderId: string) => void
}

const STATUS_LABEL: Record<OrderRow['status'], string> = {
  issued: 'Emitido',
  cancelled: 'Cancelado',
}

export function IssuedOrdersList({ rows, onCancelOrder }: IssuedOrdersListProps) {
  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold text-ink">Pedidos emitidos</h2>
      {rows.length === 0 ? (
        <p className="text-sm text-ink-muted">Nenhum pedido emitido ainda.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-line text-ink-muted">
                <th className="py-2 pr-4 font-medium">Número</th>
                <th className="py-2 pr-4 font-medium">Unidade</th>
                <th className="py-2 pr-4 font-medium">Fornecedor(es)</th>
                <th className="py-2 pr-4 font-medium">Valor</th>
                <th className="py-2 pr-4 font-medium">Previsão</th>
                <th className="py-2 pr-4 font-medium">Status</th>
                <th className="py-2 pr-4 font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-line">
                  <td className="py-2 pr-4 text-ink">{row.orderNumber}</td>
                  <td className="py-2 pr-4 text-ink">{row.unitName}</td>
                  <td className="py-2 pr-4 text-ink">{row.supplierNames.join(', ')}</td>
                  <td className="py-2 pr-4 text-ink">{formatCurrency(row.totalValue, 'BRL')}</td>
                  <td className="py-2 pr-4 text-ink">
                    {row.expectedDeliveryDate
                      ? formatDate(new Date(`${row.expectedDeliveryDate}T00:00:00`))
                      : '—'}
                  </td>
                  <td className="py-2 pr-4 text-ink">{STATUS_LABEL[row.status]}</td>
                  <td className="py-2 pr-4">
                    {row.status === 'issued' && (
                      <Button variant="secondary" onClick={() => onCancelOrder(row.id)}>
                        Cancelar
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
