export interface PendingWorkSummary {
  dueTodayCount: number
  awaitingQuoteCount: number
  pendingApprovalsCount?: number
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

  const pendingApprovalsCount = summary.pendingApprovalsCount ?? 0
  if (pendingApprovalsCount > 0) {
    segments.push({
      text: `${pendingApprovalsCount} ${pendingApprovalsCount === 1 ? 'aprovação aguardando' : 'aprovações aguardando'} você`,
      href: '/suprimentos/equalizacao',
    })
  }

  return segments.length > 0 ? segments : null
}
