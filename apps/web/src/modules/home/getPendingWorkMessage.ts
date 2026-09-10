export interface PendingWorkSummary {
  dueTodayCount: number
  awaitingQuoteCount: number
}

export interface PendingWorkSegment {
  text: string
  href: string
}

export function getPendingWorkMessage(summary: PendingWorkSummary): PendingWorkSegment[] | null {
  const segments: PendingWorkSegment[] = []

  if (summary.dueTodayCount > 0) {
    segments.push({
      text: `${summary.dueTodayCount} ${summary.dueTodayCount === 1 ? 'requisição vence' : 'requisições vencem'} hoje`,
      href: '/suprimentos/disparo-solicitacoes',
    })
  }

  if (summary.awaitingQuoteCount > 0) {
    segments.push({
      text: `${summary.awaitingQuoteCount} aguardando cotação`,
      href: '/suprimentos/em-negociacao',
    })
  }

  return segments.length > 0 ? segments : null
}
