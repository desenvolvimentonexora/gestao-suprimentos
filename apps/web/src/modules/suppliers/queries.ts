import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createMaterial,
  deleteMaterial,
  deleteSupplier,
  fetchCategories,
  fetchFavoriteSupplierIds,
  fetchMaterials,
  fetchSuppliersByMaterial,
  setFavoriteSupplier,
} from './api'
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

export function useCreateMaterial(tenantId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ name, categoryId }: { name: string; categoryId: string }) =>
      createMaterial(tenantId, name, categoryId),
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
