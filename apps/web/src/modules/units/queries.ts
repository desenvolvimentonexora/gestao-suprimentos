import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createUnit, deleteUnit, fetchUnitsList, updateUnit } from './api'
import type { UnitFormValues } from './types'

export function useUnitsList() {
  return useQuery({ queryKey: ['units-list'], queryFn: fetchUnitsList })
}

export function useCreateUnit(tenantId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (values: UnitFormValues) => createUnit(tenantId, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['units-list'] })
      queryClient.invalidateQueries({ queryKey: ['units'] })
    },
  })
}

export function useUpdateUnit() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ unitId, values }: { unitId: string; values: UnitFormValues }) =>
      updateUnit(unitId, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['units-list'] })
      queryClient.invalidateQueries({ queryKey: ['units'] })
    },
  })
}

export function useDeleteUnit() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (unitId: string) => deleteUnit(unitId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['units-list'] })
      queryClient.invalidateQueries({ queryKey: ['units'] })
    },
  })
}
