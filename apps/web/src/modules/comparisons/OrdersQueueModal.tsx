import { useState } from 'react'
import { Button, Modal } from '../../components'
import { AwaitingOrderList } from './AwaitingOrderList'
import { OrderImportModal } from './OrderImportModal'
import { useReleasedAwaitingOrder } from './queries'

export interface OrdersQueueModalProps {
  isOpen: boolean
  onClose: () => void
  tenantId: string
}

export function OrdersQueueModal({ isOpen, onClose, tenantId }: OrdersQueueModalProps) {
  const [importOpen, setImportOpen] = useState(false)

  const awaitingOrderQuery = useReleasedAwaitingOrder(isOpen)

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Fila de Pedidos">
      <div className="flex flex-col gap-6">
        <div className="flex justify-end">
          <Button onClick={() => setImportOpen(true)}>Importar pedidos</Button>
        </div>

        <AwaitingOrderList rows={awaitingOrderQuery.data ?? []} />
      </div>

      <OrderImportModal isOpen={importOpen} onClose={() => setImportOpen(false)} tenantId={tenantId} />
    </Modal>
  )
}
