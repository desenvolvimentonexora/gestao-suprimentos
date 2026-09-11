import { supabase } from '../../lib/supabase'
import type { PendingWorkSummary } from './getPendingWorkMessage'

export async function fetchPendingWorkSummary(canApprove: boolean): Promise<PendingWorkSummary> {
  const today = new Date().toISOString().slice(0, 10)

  const [dueTodayResult, awaitingQuoteResult, pendingApprovalsResult] = await Promise.all([
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
    canApprove
      ? supabase
          .from('comparisons')
          .select('id', { count: 'exact', head: true })
          .is('deleted_at', null)
          .eq('status', 'pending_approval')
      : Promise.resolve({ count: 0, error: null }),
  ])

  if (dueTodayResult.error) throw dueTodayResult.error
  if (awaitingQuoteResult.error) throw awaitingQuoteResult.error
  if (pendingApprovalsResult.error) throw pendingApprovalsResult.error

  return {
    dueTodayCount: dueTodayResult.count ?? 0,
    awaitingQuoteCount: awaitingQuoteResult.count ?? 0,
    pendingApprovalsCount: pendingApprovalsResult.count ?? 0,
  }
}
