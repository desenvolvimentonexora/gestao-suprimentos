import { supabase } from '../../lib/supabase'

export function subscribeToTableChanges(table: string, onChange: () => void): () => void {
  const channel = supabase
    .channel(`realtime-${table}-${Math.random().toString(36).slice(2)}`)
    .on('postgres_changes', { event: '*', schema: 'public', table }, onChange)
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}
