import { useState } from 'react'
import { Button, Modal, Spinner } from '../../components'
import { formatLongDate } from '../../lib/formatters'
import { validateReschedule } from './validateReschedule'
import type { DeliveryOrderDetail } from './types'

export interface DeliveryRescheduleModalProps {
  isOpen: boolean
  order: DeliveryOrderDetail | undefined
  isSaving: boolean
  onClose: () => void
  onConfirm: (values: { newDate: string; reason: string }) => void
}

export function DeliveryRescheduleModal({ isOpen, order, isSaving, onClose, onConfirm }: DeliveryRescheduleModalProps) {
  const [newDate, setNewDate] = useState('')
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)

  if (!order) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Reagendar entrega">
        <div className="flex justify-center py-6">
          <Spinner />
        </div>
      </Modal>
    )
  }

  const supplierNames = order.suppliers.map((supplier) => supplier.name).join(', ')

  function handleConfirm() {
    if (!order) return
    const validationError = validateReschedule({ newDate, reason }, order.expectedDeliveryDate)
    if (validationError) {
      setError(validationError)
      return
    }
    setError(null)
    onConfirm({ newDate, reason })
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Reagendar entrega">
      <div className="flex flex-col gap-4">
        <p className="text-sm text-ink-muted">
          {order.orderNumber} ({order.items.length} {order.items.length === 1 ? 'subpedido' : 'subpedidos'}) ·{' '}
          {supplierNames || '—'}
        </p>

        <p className="text-sm text-ink">
          Data atual de entrega: {formatLongDate(new Date(`${order.expectedDeliveryDate}T00:00:00`))}
        </p>

        <div className="flex flex-col gap-1">
          <label htmlFor="reschedule-new-date" className="text-sm font-medium text-ink">
            Nova Data de Entrega
          </label>
          <input
            id="reschedule-new-date"
            type="date"
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
            className="rounded border border-line bg-surface px-3 py-2 text-sm text-ink"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="reschedule-reason" className="text-sm font-medium text-ink">
            Motivo (opcional)
          </label>
          <textarea
            id="reschedule-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            className="rounded border border-line bg-surface px-3 py-2 text-sm text-ink"
          />
        </div>

        {error && <p className="text-sm text-red-700">{error}</p>}

        <div className="flex justify-end gap-2 border-t border-line pt-3">
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={isSaving}>
            Confirmar Reagendamento
          </Button>
        </div>
      </div>
    </Modal>
  )
}
