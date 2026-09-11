import { useQuery } from '@tanstack/react-query'
import { fetchPendingWorkSummary } from './api'

export function usePendingWorkSummary(canApprove: boolean) {
  return useQuery({
    queryKey: ['pending-work-summary', canApprove],
    queryFn: () => fetchPendingWorkSummary(canApprove),
  })
}
