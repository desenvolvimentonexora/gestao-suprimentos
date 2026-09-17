import type { AnalysisIndicators } from './analysisIndicators'
import type { UrgencyTier } from './getUrgencyTier'

const CARDS: { key: UrgencyTier | null; label: string; dotClassName: string | null }[] = [
  { key: null, label: 'Total', dotClassName: null },
  { key: 'urgente', label: 'Urgentes', dotClassName: 'bg-red-500' },
  { key: 'atencao', label: 'Atenção', dotClassName: 'bg-orange-500' },
  { key: 'tranquila', label: 'Tranquilas', dotClassName: 'bg-green-500' },
  { key: 'ag_aprovacao', label: 'Ag. Aprovação', dotClassName: 'bg-ink-muted' },
]

function valueFor(indicators: AnalysisIndicators, key: UrgencyTier | null): number {
  if (key === null) return indicators.total
  if (key === 'urgente') return indicators.urgentes
  if (key === 'atencao') return indicators.atencao
  if (key === 'tranquila') return indicators.tranquilas
  return indicators.agAprovacao
}

export interface AnalysisIndicatorCardsProps {
  indicators: AnalysisIndicators
  selectedTier: UrgencyTier | null
  onSelectTier: (tier: UrgencyTier | null) => void
}

export function AnalysisIndicatorCards({
  indicators,
  selectedTier,
  onSelectTier,
}: AnalysisIndicatorCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
      {CARDS.map(({ key, label, dotClassName }) => {
        const isSelected = selectedTier === key
        return (
          <button
            key={label}
            type="button"
            aria-pressed={isSelected}
            onClick={() => onSelectTier(isSelected ? null : key)}
            className={`flex flex-col gap-1 rounded border bg-surface p-4 text-left ${
              isSelected ? 'border-primary' : 'border-line'
            }`}
          >
            <span className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-ink-muted">
              {dotClassName && (
                <span className={`h-2 w-2 rounded-full ${dotClassName}`} aria-hidden="true" />
              )}
              {label}
            </span>
            <span className="text-2xl font-bold text-ink">{valueFor(indicators, key)}</span>
          </button>
        )
      })}
    </div>
  )
}
