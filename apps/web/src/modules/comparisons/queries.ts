import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  confirmExtractedItems,
  createPdfQuotation,
  decideComparison,
  fetchComparableRequests,
  fetchPendingApprovals,
  fetchSupplierOptions,
  getOrCreateDraftComparison,
  runExtraction,
  sendToApproval,
  setWinningQuotation,
  uploadQuotationAttachment,
  type DecideComparisonInput,
} from './api'
import type { ExtractedItemReview } from './types'

export function useComparableRequests() {
  return useQuery({ queryKey: ['comparable-requests'], queryFn: fetchComparableRequests })
}

export function useSupplierOptions() {
  return useQuery({ queryKey: ['comparison-supplier-options'], queryFn: fetchSupplierOptions })
}

export function usePendingApprovals(enabled: boolean) {
  return useQuery({ queryKey: ['pending-approvals'], queryFn: fetchPendingApprovals, enabled })
}

export function useGetOrCreateDraftComparison(tenantId: string) {
  return useMutation({
    mutationFn: (requestId: string) => getOrCreateDraftComparison(tenantId, requestId),
  })
}

export function useCreatePdfQuotation(tenantId: string) {
  return useMutation({
    mutationFn: ({ requestId, supplierId }: { requestId: string; supplierId: string }) =>
      createPdfQuotation(tenantId, requestId, supplierId),
  })
}

export function useUploadQuotationAttachment(tenantId: string) {
  return useMutation({
    mutationFn: ({ quotationId, file }: { quotationId: string; file: File }) =>
      uploadQuotationAttachment(tenantId, quotationId, file),
  })
}

export function useRunExtraction() {
  return useMutation({
    mutationFn: (attachmentId: string) => runExtraction(attachmentId),
  })
}

export function useConfirmExtractedItems(tenantId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      comparisonId,
      quotationId,
      reviewedItems,
    }: {
      comparisonId: string
      quotationId: string
      reviewedItems: ExtractedItemReview[]
    }) => confirmExtractedItems(tenantId, comparisonId, quotationId, reviewedItems),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comparable-requests'] })
    },
  })
}

export function useSetWinningQuotation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ comparisonId, quotationId }: { comparisonId: string; quotationId: string }) =>
      setWinningQuotation(comparisonId, quotationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comparable-requests'] })
    },
  })
}

export function useSendToApproval() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (comparisonId: string) => sendToApproval(comparisonId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comparable-requests'] })
      queryClient.invalidateQueries({ queryKey: ['pending-approvals'] })
    },
  })
}

export function useDecideComparison() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: DecideComparisonInput) => decideComparison(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-approvals'] })
      queryClient.invalidateQueries({ queryKey: ['comparable-requests'] })
      queryClient.invalidateQueries({ queryKey: ['negotiating-requests'] })
    },
  })
}
