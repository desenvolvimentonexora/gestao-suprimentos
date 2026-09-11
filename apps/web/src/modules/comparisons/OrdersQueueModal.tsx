import { useState } from 'react'
import { Modal } from '../../components'
import { AwaitingOrderList } from './AwaitingOrderList'
import { OrderGenerationForm } from './OrderGenerationForm'
import {
  useComparisonOrderDraft,
  useCreateOrder,
  useNextOrderNumberSuggestion,
  useReleasedAwaitingOrder,
} from './queries'
import type { CreateOrderValues } from './types'

export interface OrdersQueueModalProps {
  isOpen: boolean
  onClose: () => void
  tenantId: string
}

export function OrdersQueueModal({ isOpen, onClose, tenantId }: OrdersQueueModalProps) {
  const [selectedComparisonId, setSelectedComparisonId] = useState<string | null>(null)

  const awaitingOrderQuery = useReleasedAwaitingOrder(isOpen)
  const selectedComparison =
    awaitingOrderQuery.data?.find((row) => row.comparisonId === selectedComparisonId) ?? null
  const draftQuery = useComparisonOrderDraft(selectedComparisonId)
  const suggestionQuery = useNextOrderNumberSuggestion(tenantId, Boolean(selectedComparisonId))
  const createOrder = useCreateOrder(tenantId)

  const isDraftReady = Boolean(draftQuery.data) && Boolean(suggestionQuery.data)

  function handleClose() {
    setSelectedComparisonId(null)
    onClose()
  }

  function handleSubmit(values: CreateOrderValues) {
    if (!selectedComparison) return
    createOrder.mutate(
      {
        comparisonId: selectedComparison.comparisonId,
        requestId: selectedComparison.requestId,
        unitId: selectedComparison.unitId,
        ...values,
      },
      { onSuccess: () => setSelectedComparisonId(null) },
    )
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={selectedComparison ? `Gerar pedido — ${selectedComparison.unitName}` : 'Fila de Pedidos'}
    >
      {!selectedComparison ? (
        <AwaitingOrderList rows={awaitingOrderQuery.data ?? []} onGenerateOrder={setSelectedComparisonId} />
      ) : isDraftReady ? (
        <OrderGenerationForm
          items={draftQuery.data ?? []}
          suggestedOrderNumber={suggestionQuery.data ?? ''}
          onBack={() => setSelectedComparisonId(null)}
          onSubmit={handleSubmit}
          isSubmitting={createOrder.isPending}
        />
      ) : (
        <p className="text-sm text-ink-muted">Carregando…</p>
      )}
    </Modal>
  )
}
