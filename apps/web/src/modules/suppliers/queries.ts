import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createMaterial,
  createSupplier,
  deleteMaterial,
  deleteSupplier,
  fetchCategories,
  fetchFavoriteSupplierIds,
  fetchMaterials,
  fetchSupplierDetail,
  fetchSupplierEmailsByMaterial,
  fetchSupplierReport,
  fetchSuppliersByMaterial,
  fetchUnits,
  setFavoriteSupplier,
  updateMaterial,
  updateSupplier,
} from './api'
import type { SupplierFormValues } from './SupplierFormModal'
import type { SupplierFilter } from './api'

export function useCategories() {
  return useQuery({ queryKey: ['supply-categories'], queryFn: fetchCategories })
}

export function useMaterials() {
  return useQuery({ queryKey: ['materials'], queryFn: fetchMaterials })
}

export function useSuppliersByMaterial(materialId: string | null, filter: SupplierFilter) {
  return useQuery({
    queryKey: ['suppliers-by-material', materialId, filter],
    queryFn: () => fetchSuppliersByMaterial(materialId!, filter),
    enabled: Boolean(materialId),
    placeholderData: keepPreviousData,
  })
}

export function useSupplierReport(enabled: boolean) {
  return useQuery({
    queryKey: ['supplier-report'],
    queryFn: fetchSupplierReport,
    enabled,
  })
}

export function useUnits() {
  return useQuery({ queryKey: ['units'], queryFn: fetchUnits })
}

export function useSupplierEmailsByMaterial(materialId: string | null, enabled: boolean) {
  return useQuery({
    queryKey: ['supplier-emails', materialId],
    queryFn: () => fetchSupplierEmailsByMaterial(materialId!),
    enabled: enabled && Boolean(materialId),
  })
}

export function useSupplierDetail(supplierId: string | null) {
  return useQuery({
    queryKey: ['supplier-detail', supplierId],
    queryFn: () => fetchSupplierDetail(supplierId!),
    enabled: Boolean(supplierId),
  })
}

export function useCreateSupplier(tenantId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (values: SupplierFormValues) => createSupplier(tenantId, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers-by-material'] })
      queryClient.invalidateQueries({ queryKey: ['materials'] })
    },
  })
}

export function useUpdateSupplier(tenantId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ supplierId, values }: { supplierId: string; values: SupplierFormValues }) =>
      updateSupplier(tenantId, supplierId, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers-by-material'] })
      queryClient.invalidateQueries({ queryKey: ['materials'] })
    },
  })
}

export function useCreateMaterial(tenantId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ name, categoryId, icon }: { name: string; categoryId: string; icon: string }) =>
      createMaterial(tenantId, name, categoryId, icon),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] })
    },
  })
}

export function useUpdateMaterial() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      materialId,
      values,
    }: {
      materialId: string
      values: { name: string; categoryId: string; icon: string }
    }) => updateMaterial(materialId, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] })
    },
  })
}

export function useDeleteMaterial() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (materialId: string) => deleteMaterial(materialId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] })
    },
  })
}

export function useDeleteSupplier() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (supplierId: string) => deleteSupplier(supplierId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers-by-material'] })
    },
  })
}

export function useFavoriteSupplierIds(supplierIds: string[]) {
  return useQuery({
    queryKey: ['supplier-favorites', supplierIds],
    queryFn: () => fetchFavoriteSupplierIds(supplierIds),
    enabled: supplierIds.length > 0,
  })
}

export function useToggleFavoriteSupplier(tenantId: string, userId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ supplierId, favorite }: { supplierId: string; favorite: boolean }) =>
      setFavoriteSupplier(tenantId, userId, supplierId, favorite),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier-favorites'] })
    },
  })
}
