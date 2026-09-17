import type { RequestRow } from './types'

export interface RequestIndicators {
  ativas: number
  pendentes: number
  enviadas: number
  concluidas: number
}

// SOLs em análise (pending_review/clarification_requested/extension_requested)
// nunca chegam aqui — a página de Disparo já as filtra fora antes de calcular
// os indicadores, então "pendentes" só cobre o que realmente aparece na tela.
const NOT_YET_DISPATCHED_STATUSES: RequestRow['status'][] = ['draft', 'open', 'released_to_dispatch']

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
