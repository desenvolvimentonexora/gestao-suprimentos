import { supabase } from '../../lib/supabase'

export async function fetchSettingsRow(tenantId: string): Promise<unknown | null> {
  const { data, error } = await supabase
    .from('settings')
    .select('theme, vocabulary, currency')
    .eq('tenant_id', tenantId)
    .is('deleted_at', null)
    .maybeSingle()

  if (error) throw error
  return data
}
