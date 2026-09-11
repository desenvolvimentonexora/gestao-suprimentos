import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  bulkCreateRequests,
  cancelRequest,
  createRequest,
  dispatchRequest,
  fetchImportMapping,
  fetchMaterialOptions,
  fetchMaterialsWithSupplierCount,
  fetchRequests,
  fetchUnitOptions,
  saveImportMapping,
  updateRequest,
  updateRequestStatus,
  type DispatchDetailsValues,
} from './api'
import type { ImportColumnMapping, RequestFormValues, RequestStatus } from './types'

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

export function useUpdateRequestStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ requestId, status }: { requestId: string; status: RequestStatus }) =>
      updateRequestStatus(requestId, status),
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

export function useCancelRequest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (requestId: string) => cancelRequest(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requests'] })
    },
  })
}
