import type { TaskCard, TaskStatus } from './types'

export function groupByStatus(cards: TaskCard[]): Record<TaskStatus, TaskCard[]> {
  const grouped: Record<TaskStatus, TaskCard[]> = { a_fazer: [], fazendo: [], feito: [] }
  for (const card of cards) {
    grouped[card.status].push(card)
  }
  grouped.feito.sort((a, b) => (b.lastMovedAt ?? '').localeCompare(a.lastMovedAt ?? ''))
  return grouped
}
