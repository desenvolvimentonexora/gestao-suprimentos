import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4'

interface PermissionRow {
  roles: {
    role_permissions: {
      permissions: { key: string } | null
    }[]
  } | null
}

export async function userHasPermission(
  callerClient: SupabaseClient,
  userId: string,
  permissionKey: string,
): Promise<boolean> {
  const { data: roleRows, error } = await callerClient
    .from('user_roles')
    .select('roles(role_permissions(permissions(key)))')
    .eq('user_id', userId)
    .returns<PermissionRow[]>()

  if (error) throw error

  return (roleRows ?? []).some((row) =>
    (row.roles?.role_permissions ?? []).some(
      (rolePermission) => rolePermission.permissions?.key === permissionKey,
    ),
  )
}
