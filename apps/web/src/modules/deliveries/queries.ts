import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  fetchActiveDeliveryOrders,
  fetchDeliveryOrderDetail,
  fetchUnitOptions,
  markOrderDelivered,
  markOrderItemDelivered,
  rescheduleDelivery,
  updateDeliveryNotes,
  type RescheduleDeliveryInput,
} from './api'

export function useActiveDeliveryOrders() {
  return useQuery({ queryKey: ['active-delivery-orders'], queryFn: fetchActiveDeliveryOrders })
}

export function useUnitOptions() {
  return useQuery({ queryKey: ['unit-options'], queryFn: fetchUnitOptions })
}

export function useDeliveryOrderDetail(orderId: string | null) {
  return useQuery({
    queryKey: ['delivery-order-detail', orderId],
    queryFn: () => fetchDeliveryOrderDetail(orderId!),
    enabled: Boolean(orderId),
  })
}

function useInvalidateDeliveryOrder(orderId: string) {
  const queryClient = useQueryClient()
  return () => {
    queryClient.invalidateQueries({ queryKey: ['active-delivery-orders'] })
    queryClient.invalidateQueries({ queryKey: ['delivery-order-detail', orderId] })
  }
}

export function useMarkOrderDelivered(orderId: string) {
  const invalidate = useInvalidateDeliveryOrder(orderId)
  return useMutation({
    mutationFn: () => markOrderDelivered(orderId),
    onSuccess: invalidate,
  })
}

export function useMarkOrderItemDelivered(orderId: string) {
  const invalidate = useInvalidateDeliveryOrder(orderId)
  return useMutation({
    mutationFn: ({ orderItemId, delivered }: { orderItemId: string; delivered: boolean }) =>
      markOrderItemDelivered(orderItemId, delivered),
    onSuccess: invalidate,
  })
}

export function useUpdateDeliveryNotes(orderId: string) {
  const invalidate = useInvalidateDeliveryOrder(orderId)
  return useMutation({
    mutationFn: (notes: string) => updateDeliveryNotes(orderId, notes),
    onSuccess: invalidate,
  })
}

export function useRescheduleDelivery(orderId: string) {
  const invalidate = useInvalidateDeliveryOrder(orderId)
  return useMutation({
    mutationFn: (input: RescheduleDeliveryInput) => rescheduleDelivery(input),
    onSuccess: invalidate,
  })
}
