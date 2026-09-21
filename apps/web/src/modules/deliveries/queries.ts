import { useQuery } from '@tanstack/react-query'
import { fetchActiveDeliveryOrders, fetchUnitOptions } from './api'

export function useActiveDeliveryOrders() {
  return useQuery({ queryKey: ['active-delivery-orders'], queryFn: fetchActiveDeliveryOrders })
}

export function useUnitOptions() {
  return useQuery({ queryKey: ['unit-options'], queryFn: fetchUnitOptions })
}
