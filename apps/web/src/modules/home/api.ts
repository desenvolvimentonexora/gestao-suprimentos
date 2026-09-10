import { supabase } from '../../lib/supabase'
import type { PendingWorkSummary } from './getPendingWorkMessage'

export async function fetchPendingWorkSummary(): Promise<PendingWorkSummary> {
  const today = new Date().toISOString().slice(0, 10)

  const [dueTodayResult, awaitingQuoteResult] = await Promise.all([
    supabase
      .from('requests')
      .select('id', { count: 'exact', head: true })
      .is('deleted_at', null)
      .eq('needed_by', today)
      .in('status', ['draft', 'open', 'negotiating']),
    supabase
      .from('requests')
      .select('id', { count: 'exact', head: true })
      .is('deleted_at', null)
      .in('status', ['open', 'negotiating']),
  ])

  if (dueTodayResult.error) throw dueTodayResult.error
  if (awaitingQuoteResult.error) throw awaitingQuoteResult.error

  return {
    dueTodayCount: dueTodayResult.count ?? 0,
    awaitingQuoteCount: awaitingQuoteResult.count ?? 0,
  }
}
