import { getUrgencyTier } from './getUrgencyTier'
import type { RequestRow } from './types'

export interface AnalysisIndicators {
  total: number
  urgentes: number
  atencao: number
  tranquilas: number
  agAprovacao: number
}

export function getAnalysisIndicators(requests: RequestRow[], today: Date): AnalysisIndicators {
  let urgentes = 0
  let atencao = 0
  let tranquilas = 0
  let agAprovacao = 0

  for (const request of requests) {
    const { tier } = getUrgencyTier(request.neededBy, today)
    if (tier === 'urgente') urgentes += 1
    else if (tier === 'atencao') atencao += 1
    else if (tier === 'tranquila') tranquilas += 1
    else agAprovacao += 1
  }

  return { total: requests.length, urgentes, atencao, tranquilas, agAprovacao }
}
