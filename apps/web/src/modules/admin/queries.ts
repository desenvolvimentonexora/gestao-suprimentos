import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { settingsQueryKey } from '../../core/config'
import {
  fetchAdminUsers,
  fetchRoles,
  inviteUser,
  setUserActive,
  updateSettings,
  updateUserRole,
  uploadLogo,
  type UpdateSettingsInput,
} from './api'

export function useRoles() {
  return useQuery({ queryKey: ['admin-roles'], queryFn: fetchRoles })
}

export function useAdminUsers() {
  return useQuery({ queryKey: ['admin-users'], queryFn: fetchAdminUsers })
}

export function useInviteUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ fullName, email, roleId }: { fullName: string; email: string; roleId: string }) =>
      inviteUser(fullName, email, roleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
    },
  })
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, roleId }: { userId: string; roleId: string }) => updateUserRole(userId, roleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
    },
  })
}

export function useSetUserActive() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, isActive }: { userId: string; isActive: boolean }) => setUserActive(userId, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
    },
  })
}

export function useUpdateSettings(tenantId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: UpdateSettingsInput) => updateSettings(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsQueryKey(tenantId) })
    },
  })
}

export function useUploadLogo(tenantId: string) {
  return useMutation({
    mutationFn: (file: File) => uploadLogo(tenantId, file),
  })
}
