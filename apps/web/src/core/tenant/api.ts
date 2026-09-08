import { supabase } from '../../lib/supabase'
import type { TenantRow } from './types'

export async function fetchTenantRow(subdomain: string | null): Promise<TenantRow | null> {
  if (!subdomain) return null

  const { data, error } = await supabase
    .from('tenants')
    .select('id, subdomain, supabase_url, supabase_anon_key, licensed_modules')
    .eq('subdomain', subdomain)
    .is('deleted_at', null)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  return {
    id: data.id,
    subdomain: data.subdomain,
    supabaseUrl: data.supabase_url,
    supabaseAnonKey: data.supabase_anon_key,
    licensedModules: data.licensed_modules ?? [],
  }
}
