export interface DeadlineBadge {
  label: string
  tone: 'restante' | 'atrasada'
}

export function getDeadlineBadge(neededBy: string | null, today: Date): DeadlineBadge | null {
  if (!neededBy) return null

  const todayDateOnly = today.toISOString().slice(0, 10)
  const diffDays = Math.round(
    (new Date(`${neededBy}T00:00:00`).getTime() - new Date(`${todayDateOnly}T00:00:00`).getTime()) /
      (1000 * 60 * 60 * 24),
  )

  if (diffDays < 0) return { label: `${Math.abs(diffDays)} dias atrasada`, tone: 'atrasada' }
  return { label: `${diffDays} dias restantes`, tone: 'restante' }
}
