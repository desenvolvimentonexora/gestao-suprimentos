import { useQuery } from '@tanstack/react-query'
import { fetchUserPermissions } from './api'

export function useUserPermissions(userId: string | null) {
  return useQuery({
    queryKey: ['user-permissions', userId],
    queryFn: () => fetchUserPermissions(userId!),
    enabled: Boolean(userId),
  })
}
