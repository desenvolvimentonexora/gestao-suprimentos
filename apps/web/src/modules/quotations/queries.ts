import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createQuotation, discardQuotation, fetchNegotiatingRequests, fetchSupplierOptions } from './api'
import type { QuotationFormValues } from './types'

export function useNegotiatingRequests() {
  return useQuery({ queryKey: ['negotiating-requests'], queryFn: fetchNegotiatingRequests })
}

export function useSupplierOptions() {
  return useQuery({ queryKey: ['quotation-supplier-options'], queryFn: fetchSupplierOptions })
}

export function useCreateQuotation(tenantId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ requestId, values }: { requestId: string; values: QuotationFormValues }) =>
      createQuotation(tenantId, requestId, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['negotiating-requests'] })
    },
  })
}

export function useDiscardQuotation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (quotationId: string) => discardQuotation(quotationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['negotiating-requests'] })
    },
  })
}
