import { Modal } from '../../components'
import { formatLongDate } from '../../lib/formatters'
import { DELIVERY_STATUS_BADGE_CLASSES, getDeliveryStatus } from './deliveryStatus'
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
        {orders.map((order) => (
          <li key={order.id}>
            <button
              type="button"
              onClick={() => onSelectOrder(order.id)}
              className={`w-full rounded border px-3 py-2 text-left text-sm ${DELIVERY_STATUS_BADGE_CLASSES[getDeliveryStatus(order, today)]}`}
            >
              {order.orderNumber} · {order.supplierNames.join(', ') || '—'} · {order.unitName}
            </button>
          </li>
        ))}
      </ul>
    </Modal>
  )
}
