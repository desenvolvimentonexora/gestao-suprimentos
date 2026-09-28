import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  attachUploadedRequestPdf,
  bulkCreateRequests,
  cancelRequest,
  createRequest,
  discardQuotationAttachment,
  dispatchRequest,
  extractRequestPdf,
  fetchImportMapping,
  fetchMaterialOptions,
  fetchMaterialsWithSupplierCount,
  fetchRequestAttachments,
  fetchRequestAttachmentUrl,
  fetchRequests,
  fetchUnitOptions,
  releaseRequestToDispatch,
  requestExtension,
  retryDispatch,
  saveImportMapping,
  sendRequestToNegotiation,
  updateRequest,
  updateRequestNotes,
  type DispatchDetailsValues,
} from './api'
import type { ImportColumnMapping, RequestFormValues } from './types'

export function useRequests() {
  return useQuery({ queryKey: ['requests'], queryFn: fetchRequests })
}

export function useUnitOptions() {
  return useQuery({ queryKey: ['request-unit-options'], queryFn: fetchUnitOptions })
}

export function useMaterialOptions() {
  return useQuery({ queryKey: ['request-material-options'], queryFn: fetchMaterialOptions })
}

export function useCreateRequest(tenantId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (values: RequestFormValues) => createRequest(tenantId, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requests'] })
    },
  })
}

export function useExtractRequestPdf() {
  return useMutation({ mutationFn: (file: File) => extractRequestPdf(file) })
}

export function useAttachUploadedRequestPdf(tenantId: string) {
  return useMutation({
    mutationFn: ({ requestId, file }: { requestId: string; file: File }) =>
      attachUploadedRequestPdf(tenantId, requestId, file),
  })
}

export function useUpdateRequest(tenantId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ requestId, values }: { requestId: string; values: RequestFormValues }) =>
      updateRequest(tenantId, requestId, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requests'] })
    },
  })
}

export function useSendRequestToNegotiation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (requestId: string) => sendRequestToNegotiation(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requests'] })
    },
  })
}

export function useImportMapping() {
  return useQuery({ queryKey: ['request-import-mapping'], queryFn: fetchImportMapping })
}

export function useSaveImportMapping(tenantId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (mapping: ImportColumnMapping) => saveImportMapping(tenantId, mapping),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['request-import-mapping'] })
    },
  })
}

export function useBulkCreateRequests(tenantId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (requests: RequestFormValues[]) => bulkCreateRequests(tenantId, requests),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requests'] })
    },
  })
}

export function useMaterialsWithSupplierCount() {
  return useQuery({ queryKey: ['materials-with-supplier-count'], queryFn: fetchMaterialsWithSupplierCount })
}

export function useDispatchRequest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ requestId, values }: { requestId: string; values: DispatchDetailsValues }) =>
      dispatchRequest(requestId, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requests'] })
    },
  })
}

export function useUpdateRequestNotes() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ requestId, notes }: { requestId: string; notes: string }) =>
      updateRequestNotes(requestId, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requests'] })
    },
  })
}

export function useCancelRequest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (requestId: string) => cancelRequest(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requests'] })
    },
  })
}

export function useRequestExtension() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      requestId,
      newNeededBy,
      reason,
    }: {
      requestId: string
      newNeededBy: string
      reason: string
    }) => requestExtension(requestId, newNeededBy, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requests'] })
    },
  })
}

export function useReleaseRequestToDispatch() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (requestId: string) => releaseRequestToDispatch(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requests'] })
    },
  })
}

export function useRetryDispatch() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (requestId: string) => retryDispatch(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requests'] })
    },
  })
}

export function useRequestAttachments(requestId: string | null) {
  return useQuery({
    queryKey: ['request-attachments', requestId],
    queryFn: () => fetchRequestAttachments(requestId!),
    enabled: Boolean(requestId),
  })
}

export function useViewRequestAttachment() {
  return useMutation({
    mutationFn: (attachment: { id: string; kind: 'sol' | 'quotation' }) => fetchRequestAttachmentUrl(attachment),
    onSuccess: (url) => {
      if (url) {
        window.open(url, '_blank', 'noopener,noreferrer')
      } else {
        window.alert('Arquivo não encontrado.')
      }
    },
    onError: (error) => {
      window.alert(error instanceof Error ? error.message : 'Não foi possível abrir o arquivo. Tente novamente.')
    },
  })
}

export function useDiscardQuotationAttachment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (quotationId: string) => discardQuotationAttachment(quotationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['request-attachments'] })
      queryClient.invalidateQueries({ queryKey: ['requests'] })
    },
  })
}
