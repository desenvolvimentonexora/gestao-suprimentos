import type { RequestRow } from './types'

export interface RequestIndicators {
  ativas: number
  pendentes: number
  enviadas: number
  concluidas: number
}

const NOT_YET_DISPATCHED_STATUSES: RequestRow['status'][] = [
  'draft',
  'open',
  'pending_review',
  'clarification_requested',
  'extension_requested',
  'released_to_dispatch',
]

export function getRequestIndicators(requests: RequestRow[]): RequestIndicators {
  const pendentes = requests.filter((r) => NOT_YET_DISPATCHED_STATUSES.includes(r.status)).length
  const enviadas = requests.filter((r) => r.status === 'negotiating').length
  const concluidas = requests.filter((r) => r.status === 'quoted').length

  return { ativas: pendentes + enviadas, pendentes, enviadas, concluidas }
}

export function isOverdue(request: RequestRow, today: Date): boolean {
  if (!request.neededBy) return false
  if (request.status === 'quoted' || request.status === 'cancelled') return false

  const todayDateOnly = today.toISOString().slice(0, 10)
  return request.neededBy < todayDateOnly
}
