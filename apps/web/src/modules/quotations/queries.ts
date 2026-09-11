import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createQuotation,
  discardQuotation,
  fetchNegotiatingRequests,
  fetchNegotiatorOptions,
  fetchSupplierOptions,
  sendBackToDispatch,
  updateNegotiationNotes,
  updateNegotiator,
} from './api'
import type { QuotationFormValues } from './types'

export function useNegotiatingRequests() {
  return useQuery({ queryKey: ['negotiating-requests'], queryFn: fetchNegotiatingRequests })
}

export function useSupplierOptions() {
  return useQuery({ queryKey: ['quotation-supplier-options'], queryFn: fetchSupplierOptions })
}

export function useNegotiatorOptions() {
  return useQuery({ queryKey: ['negotiator-options'], queryFn: fetchNegotiatorOptions })
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

export function useUpdateNegotiator() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ requestId, negotiatorId }: { requestId: string; negotiatorId: string | null }) =>
      updateNegotiator(requestId, negotiatorId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['negotiating-requests'] })
    },
  })
}

export function useUpdateNegotiationNotes() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ requestId, notes }: { requestId: string; notes: string }) =>
      updateNegotiationNotes(requestId, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['negotiating-requests'] })
    },
  })
}

export function useSendBackToDispatch() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (requestId: string) => sendBackToDispatch(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['negotiating-requests'] })
      queryClient.invalidateQueries({ queryKey: ['requests'] })
    },
  })
}
