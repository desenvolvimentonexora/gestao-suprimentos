import type { NegotiatingRequestRow, NegotiatorOption } from './types'

export interface NegotiatorCount {
  id: string
  name: string
  count: number
}

export function getNegotiatorCounts(
  requests: NegotiatingRequestRow[],
  negotiators: NegotiatorOption[],
): NegotiatorCount[] {
  const counts = negotiators.map((negotiator) => ({
    id: negotiator.id,
    name: negotiator.name,
    count: requests.filter((request) => request.negotiatorId === negotiator.id).length,
  }))

  const unassignedCount = requests.filter((request) => !request.negotiatorId).length

  return [...counts, { id: 'unassigned', name: 'Sem resp.', count: unassignedCount }]
}
