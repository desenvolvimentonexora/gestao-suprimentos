export type UrgencyTier = 'urgente' | 'atencao' | 'tranquila' | 'ag_aprovacao'

export interface UrgencyBadge {
  tier: UrgencyTier
  label: string
}

export function getUrgencyTier(neededBy: string | null, today: Date): UrgencyBadge {
  if (!neededBy) return { tier: 'ag_aprovacao', label: 'Ag. Aprovação' }

  const todayDateOnly = today.toISOString().slice(0, 10)
  const diffDays = Math.round(
    (new Date(`${neededBy}T00:00:00`).getTime() - new Date(`${todayDateOnly}T00:00:00`).getTime()) /
      (1000 * 60 * 60 * 24),
  )

  if (diffDays <= 3) return { tier: 'urgente', label: `${diffDays} dias` }
  if (diffDays <= 7) return { tier: 'atencao', label: `${diffDays} dias` }
  return { tier: 'tranquila', label: `${diffDays} dias` }
}
