import { supabase } from '../../lib/supabase'

export interface UserProfile {
  id: string
  tenantId: string
  fullName: string
  email: string
}

export async function fetchCurrentUserProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('users')
    .select('id, tenant_id, full_name, email')
    .eq('id', userId)
    .is('deleted_at', null)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  return {
    id: data.id,
    tenantId: data.tenant_id,
    fullName: data.full_name,
    email: data.email,
  }
}
