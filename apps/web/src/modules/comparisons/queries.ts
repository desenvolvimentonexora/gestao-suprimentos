import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  confirmExtractedItems,
  createOrder,
  createPdfQuotation,
  decideComparison,
  fetchComparableRequests,
  fetchComparisonOrderDraft,
  fetchHistory,
  fetchNextOrderNumberSuggestion,
  fetchPendingApprovals,
  fetchPendingReleases,
  fetchReleasedAwaitingOrder,
  fetchSupplierOptions,
  getOrCreateDraftComparison,
  releaseComparison,
  runExtraction,
  sendToApproval,
  setFinancialChargeRequested,
  setItemWinner,
  uploadQuotationAttachment,
  type CreateOrderInput,
  type DecideComparisonInput,
  type ReleaseComparisonInput,
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

export function usePendingReleases(enabled: boolean) {
  return useQuery({ queryKey: ['pending-releases'], queryFn: fetchPendingReleases, enabled })
}

export function useHistory(enabled: boolean) {
  return useQuery({ queryKey: ['comparisons-history'], queryFn: fetchHistory, enabled })
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

export function useSetItemWinner(tenantId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      comparisonId,
      requestItemId,
      quotationItemId,
    }: {
      comparisonId: string
      requestItemId: string
      quotationItemId: string
    }) => setItemWinner(tenantId, comparisonId, requestItemId, quotationItemId),
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
      queryClient.invalidateQueries({ queryKey: ['pending-releases'] })
      queryClient.invalidateQueries({ queryKey: ['comparable-requests'] })
      queryClient.invalidateQueries({ queryKey: ['negotiating-requests'] })
    },
  })
}

export function useReleaseComparison() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: ReleaseComparisonInput) => releaseComparison(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-releases'] })
      queryClient.invalidateQueries({ queryKey: ['comparisons-history'] })
      queryClient.invalidateQueries({ queryKey: ['comparable-requests'] })
      queryClient.invalidateQueries({ queryKey: ['negotiating-requests'] })
    },
  })
}

export function useSetFinancialChargeRequested() {
  return useMutation({
    mutationFn: ({ comparisonId, value }: { comparisonId: string; value: boolean }) =>
      setFinancialChargeRequested(comparisonId, value),
  })
}

export function useReleasedAwaitingOrder(enabled: boolean) {
  return useQuery({ queryKey: ['released-awaiting-order'], queryFn: fetchReleasedAwaitingOrder, enabled })
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
    },
  })
}
