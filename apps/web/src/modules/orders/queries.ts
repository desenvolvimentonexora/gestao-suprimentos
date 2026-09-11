import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  cancelOrder,
  createOrder,
  fetchComparisonOrderDraft,
  fetchNextOrderNumberSuggestion,
  fetchOrders,
  fetchReleasedAwaitingOrder,
  type CreateOrderInput,
} from './api'

export function useReleasedAwaitingOrder() {
  return useQuery({ queryKey: ['released-awaiting-order'], queryFn: fetchReleasedAwaitingOrder })
}

export function useComparisonOrderDraft(comparisonId: string | null) {
  return useQuery({
    queryKey: ['comparison-order-draft', comparisonId],
    queryFn: () => fetchComparisonOrderDraft(comparisonId!),
    enabled: Boolean(comparisonId),
  })
}

export function useNextOrderNumberSuggestion(tenantId: string, enabled: boolean) {
  return useQuery({
    queryKey: ['next-order-number', tenantId],
    queryFn: () => fetchNextOrderNumberSuggestion(tenantId),
    enabled,
  })
}

export function useCreateOrder(tenantId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: Omit<CreateOrderInput, 'tenantId'>) => createOrder({ tenantId, ...input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['released-awaiting-order'] })
      queryClient.invalidateQueries({ queryKey: ['orders'] })
    },
  })
}

export function useOrders() {
  return useQuery({ queryKey: ['orders'], queryFn: fetchOrders })
}

export function useCancelOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (orderId: string) => cancelOrder(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
    },
  })
}
