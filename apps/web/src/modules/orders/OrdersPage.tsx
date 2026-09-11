import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AwaitingOrderList } from './AwaitingOrderList'
import { IssuedOrdersList } from './IssuedOrdersList'
import { OrderFormModal } from './OrderFormModal'
import {
  useCancelOrder,
  useComparisonOrderDraft,
  useCreateOrder,
  useNextOrderNumberSuggestion,
  useOrders,
  useReleasedAwaitingOrder,
} from './queries'
import type { CreateOrderValues } from './types'

export interface OrdersPageProps {
  tenantId: string
}

export function OrdersPage({ tenantId }: OrdersPageProps) {
  const [selectedComparisonId, setSelectedComparisonId] = useState<string | null>(null)

  const awaitingOrderQuery = useReleasedAwaitingOrder()
  const ordersQuery = useOrders()
  const createOrder = useCreateOrder(tenantId)
  const cancelOrder = useCancelOrder()

  const selectedComparison =
    awaitingOrderQuery.data?.find((row) => row.comparisonId === selectedComparisonId) ?? null
  const draftQuery = useComparisonOrderDraft(selectedComparisonId)
  const suggestionQuery = useNextOrderNumberSuggestion(tenantId, Boolean(selectedComparisonId))

  const isDraftReady = Boolean(selectedComparison) && Boolean(draftQuery.data) && Boolean(suggestionQuery.data)

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
    <div className="min-h-screen bg-bg">
      <div className="bg-gradient-to-b from-primary-dark to-primary px-6 py-8">
        <div className="mx-auto max-w-6xl">
          <Link to="/suprimentos/equalizacao" className="text-sm text-on-primary hover:underline">
            ← Equalização
          </Link>
          <h1 className="mt-4 text-2xl font-semibold text-on-primary">Pedidos</h1>
        </div>
      </div>

      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-8">
        <AwaitingOrderList rows={awaitingOrderQuery.data ?? []} onGenerateOrder={setSelectedComparisonId} />
        <IssuedOrdersList
          rows={ordersQuery.data ?? []}
          onCancelOrder={(orderId) => cancelOrder.mutate(orderId)}
        />
      </div>

      {selectedComparison && isDraftReady && (
        <OrderFormModal
          isOpen
          onClose={() => setSelectedComparisonId(null)}
          unitName={selectedComparison.unitName}
          items={draftQuery.data ?? []}
          suggestedOrderNumber={suggestionQuery.data ?? ''}
          onSubmit={handleSubmit}
          isSubmitting={createOrder.isPending}
        />
      )}
    </div>
  )
}
