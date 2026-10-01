import { supabase } from '../../lib/supabase'
import type { PendingWorkSummary } from './getPendingWorkMessage'

export async function fetchPendingWorkSummary(): Promise<PendingWorkSummary> {
  const today = new Date().toISOString().slice(0, 10)

  const { count, error } = await supabase
    .from('requests')
    .select('id', { count: 'exact', head: true })
    .is('deleted_at', null)
    .eq('needed_by', today)
    .in('status', ['draft', 'open', 'negotiating'])

  if (error) throw error

  return { dueTodayCount: count ?? 0 }
}
