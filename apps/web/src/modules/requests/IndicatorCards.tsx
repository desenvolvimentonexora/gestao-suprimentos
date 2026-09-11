import { Card } from '../../components'
import type { RequestIndicators } from './requestIndicators'

const CARDS: { key: keyof RequestIndicators; label: string }[] = [
  { key: 'ativas', label: 'Total Ativas' },
  { key: 'pendentes', label: 'Pendentes' },
  { key: 'enviadas', label: 'Enviadas' },
  { key: 'concluidas', label: 'Concluídas' },
]

export interface IndicatorCardsProps {
  indicators: RequestIndicators
}

export function IndicatorCards({ indicators }: IndicatorCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {CARDS.map(({ key, label }) => (
        <Card key={key} className="flex flex-col gap-1">
          <span className="text-xs font-medium uppercase tracking-wide text-ink-muted">{label}</span>
          <span className="text-2xl font-bold text-ink">{indicators[key]}</span>
        </Card>
      ))}
    </div>
  )
}
