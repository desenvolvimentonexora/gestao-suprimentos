import { supabase } from '../../lib/supabase'
import type {
  AdminUserRow,
  BrandValues,
  RoleOption,
  ThemeValues,
  VocabularyValues,
} from './types'

export async function fetchRoles(): Promise<RoleOption[]> {
  const { data, error } = await supabase.from('roles').select('id, name').is('deleted_at', null).order('name')
  if (error) throw error
  return data
}

export async function fetchAdminUsers(): Promise<AdminUserRow[]> {
  const { data, error } = await supabase
    .from('users')
    .select('id, full_name, email, is_active, user_roles(roles(id, name))')
    .is('deleted_at', null)
    .order('full_name')
  if (error) throw error

  return data.map((row) => ({
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    isActive: row.is_active,
    roleIds: row.user_roles.map((ur) => ur.roles?.id).filter((id): id is string => Boolean(id)),
    roleNames: row.user_roles.map((ur) => ur.roles?.name).filter((name): name is string => Boolean(name)),
  }))
}

export async function inviteUser(fullName: string, email: string, roleId: string): Promise<void> {
  const { error } = await supabase.functions.invoke('admin-invite-user', {
    body: { fullName, email, roleId },
  })
  if (error) throw error
}

export async function updateUserRole(userId: string, roleId: string): Promise<void> {
  const { error } = await supabase.functions.invoke('admin-update-user', {
    body: { userId, roleId },
  })
  if (error) throw error
}

export async function setUserActive(userId: string, isActive: boolean): Promise<void> {
  const { error } = await supabase.functions.invoke('admin-update-user', {
    body: { userId, isActive },
  })
  if (error) throw error
}

export interface UpdateSettingsInput {
  theme?: ThemeValues
  brand?: BrandValues
  vocabulary?: VocabularyValues
  modules?: string[]
}

export async function updateSettings(input: UpdateSettingsInput): Promise<void> {
  const { error } = await supabase.functions.invoke('admin-update-settings', { body: input })
  if (error) throw error
}

export async function uploadLogo(tenantId: string, file: File): Promise<string> {
  const storagePath = `${tenantId}/${Date.now()}-${file.name}`

  const { error: uploadError } = await supabase.storage.from('tenant-branding').upload(storagePath, file, {
    upsert: true,
  })
  if (uploadError) throw uploadError

  const { data } = supabase.storage.from('tenant-branding').getPublicUrl(storagePath)
  return data.publicUrl
}
