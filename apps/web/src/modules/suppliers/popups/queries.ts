import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  addSupplierMaterialLink,
  createReview,
  deleteCertificate,
  fetchCertificates,
  fetchLeadTimeDays,
  fetchReviews,
  fetchSupplierMaterialLinks,
  removeSupplierMaterialLink,
  updateLeadTimeDays,
  uploadCertificate,
} from './api'

export function useLeadTimeDays(supplierId: string, materialId: string, enabled: boolean) {
  return useQuery({
    queryKey: ['lead-time', supplierId, materialId],
    queryFn: () => fetchLeadTimeDays(supplierId, materialId),
    enabled,
  })
}

export function useUpdateLeadTimeDays() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      supplierId,
      materialId,
      days,
    }: {
      supplierId: string
      materialId: string
      days: number | null
    }) => updateLeadTimeDays(supplierId, materialId, days),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['lead-time', variables.supplierId, variables.materialId],
      })
    },
  })
}

export function useReviews(supplierId: string, enabled: boolean) {
  return useQuery({
    queryKey: ['supplier-reviews', supplierId],
    queryFn: () => fetchReviews(supplierId),
    enabled,
  })
}

export function useCreateReview(tenantId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      supplierId,
      rating,
      comment,
    }: {
      supplierId: string
      rating: number
      comment: string
    }) => createReview(tenantId, supplierId, rating, comment),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['supplier-reviews', variables.supplierId] })
    },
  })
}

export function useSupplierMaterialLinks(supplierId: string, enabled: boolean) {
  return useQuery({
    queryKey: ['supplier-material-links', supplierId],
    queryFn: () => fetchSupplierMaterialLinks(supplierId),
    enabled,
  })
}

export function useAddSupplierMaterialLink(tenantId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ supplierId, materialId }: { supplierId: string; materialId: string }) =>
      addSupplierMaterialLink(tenantId, supplierId, materialId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['supplier-material-links', variables.supplierId],
      })
      queryClient.invalidateQueries({ queryKey: ['materials'] })
      queryClient.invalidateQueries({ queryKey: ['suppliers-by-material'] })
    },
  })
}

export function useRemoveSupplierMaterialLink() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ supplierId, materialId }: { supplierId: string; materialId: string }) =>
      removeSupplierMaterialLink(supplierId, materialId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['supplier-material-links', variables.supplierId],
      })
      queryClient.invalidateQueries({ queryKey: ['materials'] })
      queryClient.invalidateQueries({ queryKey: ['suppliers-by-material'] })
    },
  })
}

export function useCertificates(supplierId: string, enabled: boolean) {
  return useQuery({
    queryKey: ['supplier-certificates', supplierId],
    queryFn: () => fetchCertificates(supplierId),
    enabled,
  })
}

export function useUploadCertificate(tenantId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ supplierId, file }: { supplierId: string; file: File }) =>
      uploadCertificate(tenantId, supplierId, file),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['supplier-certificates', variables.supplierId] })
    },
  })
}

export function useDeleteCertificate(supplierId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ certificateId, filePath }: { certificateId: string; filePath: string }) =>
      deleteCertificate(certificateId, filePath),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier-certificates', supplierId] })
    },
  })
}
