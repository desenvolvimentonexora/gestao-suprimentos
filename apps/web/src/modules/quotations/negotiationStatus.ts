import type { NegotiatingRequestRow } from './types'

export function isReadyToEqualize(request: NegotiatingRequestRow): boolean {
  return request.quotations.some((quotation) => quotation.status === 'received')
}

export function getDaysInNegotiation(negotiatingStartedAt: string | null, today: Date): number | null {
  if (!negotiatingStartedAt) return null
  const diff = today.getTime() - new Date(negotiatingStartedAt).getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}
