import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  bulkImportOrders,
  confirmExtractedItems,
  confirmPaymentProof,
  createPdfQuotation,
  decideComparison,
  fetchComparableRequests,
  fetchHistory,
  fetchOrderImportContext,
  fetchOrderImportMapping,
  fetchPendingApprovals,
  fetchPendingReleases,
  fetchReleasedAwaitingOrder,
  fetchSupplierOptions,
  getOrCreateDraftComparison,
  releaseComparison,
  runExtraction,
  saveOrderImportMapping,
  sendToApproval,
  setComparisonWinner,
  setFinancialChargeRequested,
  updateComparisonNotes,
  updateQuotationTerms,
  uploadQuotationAttachment,
  type DecideComparisonInput,
  type QuotationTermsInput,
  type ReleaseComparisonInput,
} from './api'
import type {
  ComparisonQuotationRow,
  ComparisonRequestItemRow,
  ExtractedItemReview,
  OrderImportColumnMapping,
  OrderImportGroup,
} from './types'

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

export function useGetOrCreateDraftComparison(tenantId: string, userId: string) {
  return useMutation({
    mutationFn: (requestId: string) => getOrCreateDraftComparison(tenantId, requestId, userId),
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
      terms,
    }: {
      comparisonId: string
      quotationId: string
      reviewedItems: ExtractedItemReview[]
      terms: { freight: number | null; paymentTerms: string | null }
    }) => confirmExtractedItems(tenantId, comparisonId, quotationId, reviewedItems, terms),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comparable-requests'] })
    },
  })
}

export function useSetComparisonWinner(tenantId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      comparisonId,
      quotation,
      requestItems,
    }: {
      comparisonId: string
      quotation: ComparisonQuotationRow | null
      requestItems: ComparisonRequestItemRow[]
    }) => setComparisonWinner(tenantId, comparisonId, quotation, requestItems),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comparable-requests'] })
    },
  })
}

export function useUpdateQuotationTerms() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ quotationId, terms }: { quotationId: string; terms: QuotationTermsInput }) =>
      updateQuotationTerms(quotationId, terms),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comparable-requests'] })
    },
  })
}

export function useUpdateComparisonNotes() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ comparisonId, notes }: { comparisonId: string; notes: string }) =>
      updateComparisonNotes(comparisonId, notes),
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
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ comparisonId, value }: { comparisonId: string; value: boolean }) =>
      setFinancialChargeRequested(comparisonId, value),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-releases'] })
    },
  })
}

export function useConfirmPaymentProof() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (comparisonId: string) => confirmPaymentProof(comparisonId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-releases'] })
    },
  })
}

export function useReleasedAwaitingOrder(enabled: boolean) {
  return useQuery({ queryKey: ['released-awaiting-order'], queryFn: fetchReleasedAwaitingOrder, enabled })
}

export function useOrderImportMapping() {
  return useQuery({ queryKey: ['order-import-mapping'], queryFn: fetchOrderImportMapping })
}

export function useSaveOrderImportMapping(tenantId: string) {
  return useMutation({
    mutationFn: (mapping: OrderImportColumnMapping) => saveOrderImportMapping(tenantId, mapping),
  })
}

export function useOrderImportContext(enabled: boolean) {
  return useQuery({ queryKey: ['order-import-context'], queryFn: fetchOrderImportContext, enabled })
}

export function useBulkImportOrders(tenantId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (groups: OrderImportGroup[]) => bulkImportOrders(tenantId, groups),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['released-awaiting-order'] })
      queryClient.invalidateQueries({ queryKey: ['comparisons-history'] })
      queryClient.invalidateQueries({ queryKey: ['order-import-context'] })
    },
  })
}
