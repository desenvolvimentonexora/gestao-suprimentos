import type { NegotiatingRequestRow } from './types'

// Regra de negócio: uma SOL só pode ir para equalização com pelo menos 3
// cotações recebidas. Mesmo valor em comparisons/api.ts — módulos não se
// importam entre si, então o limite é duplicado propositalmente.
export const MINIMUM_QUOTATIONS_TO_EQUALIZE = 3

export function countReceivedQuotations(request: NegotiatingRequestRow): number {
  return request.quotations.filter((quotation) => quotation.status === 'received').length
}

export function isReadyToEqualize(request: NegotiatingRequestRow): boolean {
  return countReceivedQuotations(request) >= MINIMUM_QUOTATIONS_TO_EQUALIZE
}

export function getDaysInNegotiation(negotiatingStartedAt: string | null, today: Date): number | null {
  if (!negotiatingStartedAt) return null
  const diff = today.getTime() - new Date(negotiatingStartedAt).getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}
