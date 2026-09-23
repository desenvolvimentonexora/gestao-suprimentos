import { formatSubpedidoLabel } from './formatSubpedidoLabel'
import type { DeliveryOrderItemDetail } from './types'

export interface DeliveryPartialChecklistProps {
  orderNumber: string
  items: DeliveryOrderItemDetail[]
  isSaving: boolean
  onToggleItem: (orderItemId: string, delivered: boolean) => void
}

// Marca a entrega item a item, sem exigir que todos os itens do pedido
// estejam entregues pra fechar — "Pedido Chegou" (delivered_at do pedido) é
// uma ação separada, não amarrada a este checklist.
export function DeliveryPartialChecklist({ orderNumber, items, isSaving, onToggleItem }: DeliveryPartialChecklistProps) {
  return (
    <ul className="flex flex-col gap-2 rounded border border-line bg-bg p-3">
      {items.map((item, index) => (
        <li key={item.id} className="flex items-center gap-2 text-sm text-ink">
          <input
            type="checkbox"
            id={`partial-item-${item.id}`}
            checked={Boolean(item.deliveredAt)}
            disabled={isSaving}
            onChange={(e) => onToggleItem(item.id, e.target.checked)}
          />
          <label htmlFor={`partial-item-${item.id}`} className="flex-1">
            {formatSubpedidoLabel(orderNumber, index)} ·{' '}
            {item.materialCode ?? item.materialName}
          </label>
        </li>
      ))}
    </ul>
  )
}
