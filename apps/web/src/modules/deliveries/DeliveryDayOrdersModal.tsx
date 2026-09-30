import { Modal } from '../../components'
import { formatLongDate } from '../../lib/formatters'
import { DELIVERY_STATUS_BADGE_CLASSES, DELIVERY_STATUS_BORDER_CLASSES, getDeliveryStatus } from './deliveryStatus'
import type { DeliveryOrderRow } from './types'

export interface DeliveryDayOrdersModalProps {
  isOpen: boolean
  isoDate: string | null
  orders: DeliveryOrderRow[]
  today: Date
  onClose: () => void
  onSelectOrder: (orderId: string) => void
}

export function DeliveryDayOrdersModal({ isOpen, isoDate, orders, today, onClose, onSelectOrder }: DeliveryDayOrdersModalProps) {
  const title = isoDate ? `Pedidos de ${formatLongDate(new Date(`${isoDate}T00:00:00`))}` : 'Pedidos do dia'

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <ul className="flex flex-col gap-1">
        {orders.map((order) => {
          const status = getDeliveryStatus(order, today)
          return (
            <li key={order.id}>
              <button
                type="button"
                onClick={() => onSelectOrder(order.id)}
                className={`flex w-full items-center justify-between gap-2 rounded border-y border-r border-l-4 px-3 py-2 text-left text-sm ${DELIVERY_STATUS_BADGE_CLASSES[status]} ${DELIVERY_STATUS_BORDER_CLASSES[status]}`}
              >
                <span className="truncate">
                  {order.orderNumber} · {order.supplierNames.join(', ') || '—'}
                </span>
                <span className="shrink-0 rounded-full border border-current/30 bg-surface px-2 py-0.5 text-xs font-semibold">
                  {order.unitName}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </Modal>
  )
}
