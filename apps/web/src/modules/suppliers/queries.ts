import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createMaterial, fetchCategories, fetchMaterials } from './api'

export function useCategories() {
  return useQuery({ queryKey: ['supply-categories'], queryFn: fetchCategories })
}

export function useMaterials() {
  return useQuery({ queryKey: ['materials'], queryFn: fetchMaterials })
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
