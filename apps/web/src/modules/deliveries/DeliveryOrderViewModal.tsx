import { Modal, Spinner } from '../../components'
import { formatDate } from '../../lib/formatters'
import { computeOrderTotal } from './computeOrderTotal'
import { filterPendingItems } from './filterPendingItems'
import { formatSubpedidoLabel } from './formatSubpedidoLabel'
import type { DeliveryOrderDetail } from './types'

function formatCurrencyBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

function formatDateOnly(isoDate: string): string {
  return formatDate(new Date(`${isoDate}T00:00:00`))
}

export interface DeliveryOrderViewModalProps {
  isOpen: boolean
  order: DeliveryOrderDetail | undefined
  onClose: () => void
}

export function DeliveryOrderViewModal({ isOpen, order, onClose }: DeliveryOrderViewModalProps) {
  if (!order) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Pedido">
        <div className="flex justify-center py-6">
          <Spinner />
        </div>
      </Modal>
    )
  }

  const pendingItems = filterPendingItems(order.items)
  const total = computeOrderTotal(order.items)

  const metadata: [string, string][] = [
    ['Centro', order.unitName],
    ['Data do Pedido', formatDate(new Date(order.createdAt))],
    ['Entrega Solicitada', order.neededBy ? formatDateOnly(order.neededBy) : '—'],
    ['Entrega Pedido', formatDateOnly(order.expectedDeliveryDate)],
    ['Subpedidos', String(order.items.length)],
    ['Itens Pendentes', String(pendingItems.length)],
    ['Valor Total', formatCurrencyBRL(total)],
    ['Negociado Por', order.negotiatorName ?? '—'],
  ]

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Pedido ${order.orderNumber} — detalhado`}>
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {metadata.map(([label, value]) => (
            <div key={label}>
              <p className="text-xs text-ink-muted">{label}</p>
              <p className="text-sm font-medium text-ink">{value}</p>
            </div>
          ))}
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-ink">Insumos Pendentes</p>
          {pendingItems.length === 0 ? (
            <p className="text-sm text-ink-muted">Nenhum item pendente — todos os subpedidos já chegaram.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-ink-muted">
                    <th className="py-1 pr-3 font-medium">Subpedido</th>
                    <th className="py-1 pr-3 font-medium">Código</th>
                    <th className="py-1 pr-3 font-medium">Descrição</th>
                    <th className="py-1 pr-3 font-medium">Qtd</th>
                    <th className="py-1 pr-3 font-medium">Unidade</th>
                    <th className="py-1 pr-3 font-medium">Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item, index) => {
                    if (item.deliveredAt) return null
                    return (
                      <tr key={item.id} className="text-ink">
                        <td className="py-1 pr-3">{formatSubpedidoLabel(order.orderNumber, index)}</td>
                        <td className="py-1 pr-3">{item.materialCode ?? '—'}</td>
                        <td className="py-1 pr-3">{item.materialDescription ?? item.materialName}</td>
                        <td className="py-1 pr-3">{item.quantity}</td>
                        <td className="py-1 pr-3">{item.unitOfMeasure ?? '—'}</td>
                        <td className="py-1 pr-3">{formatCurrencyBRL(item.quantity * item.unitPrice)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}
