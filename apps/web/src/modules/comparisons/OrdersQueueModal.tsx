import { Send } from 'lucide-react'
import { Modal } from '../../components'
import { AwaitingOrderList } from './AwaitingOrderList'
import { useReleasedAwaitingOrder } from './queries'

export interface OrdersQueueModalProps {
  isOpen: boolean
  onClose: () => void
}

export function OrdersQueueModal({ isOpen, onClose }: OrdersQueueModalProps) {
  const awaitingOrderQuery = useReleasedAwaitingOrder(isOpen)

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Fila de Pedidos" icon={Send} titleClassName="text-emerald-700">
      <div className="flex flex-col gap-6">
        <AwaitingOrderList rows={awaitingOrderQuery.data ?? []} />
      </div>
    </Modal>
  )
}
