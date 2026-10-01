export interface PendingWorkSummary {
  dueTodayCount: number
}

export interface PendingWorkSegment {
  text: string
  href: string
}

export function getPendingWorkMessage(summary: PendingWorkSummary): PendingWorkSegment[] | null {
  if (summary.dueTodayCount === 0) return null

  return [
    {
      text: `${summary.dueTodayCount} ${summary.dueTodayCount === 1 ? 'requisição vence' : 'requisições vencem'} hoje`,
      href: '/suprimentos/disparo-solicitacoes',
    },
  ]
}
