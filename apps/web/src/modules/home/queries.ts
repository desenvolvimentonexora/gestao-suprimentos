import { useQuery } from '@tanstack/react-query'
import { fetchPendingWorkSummary } from './api'

export function usePendingWorkSummary() {
  return useQuery({ queryKey: ['pending-work-summary'], queryFn: fetchPendingWorkSummary })
}
