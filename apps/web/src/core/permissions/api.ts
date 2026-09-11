import { supabase } from '../../lib/supabase'

export async function fetchUserPermissions(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('user_roles')
    .select('roles(role_permissions(permissions(key)))')
    .eq('user_id', userId)

  if (error) throw error

  const keys = new Set<string>()
  for (const row of data) {
    for (const rolePermission of row.roles?.role_permissions ?? []) {
      const key = rolePermission.permissions?.key
      if (key) keys.add(key)
    }
  }
  return [...keys]
}
