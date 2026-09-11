import type { NegotiatorCount } from './getNegotiatorCounts'

export interface NegotiatorChipsProps {
  counts: NegotiatorCount[]
  selected: string | null
  onSelect: (id: string | null) => void
}

export function NegotiatorChips({ counts, selected, onSelect }: NegotiatorChipsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {counts.map((entry) => {
        const isSelected = selected === entry.id
        return (
          <button
            key={entry.id}
            type="button"
            onClick={() => onSelect(isSelected ? null : entry.id)}
            className={`rounded-full border px-3 py-1 text-xs font-medium ${
              isSelected
                ? 'border-primary bg-primary text-white'
                : 'border-line bg-surface text-ink hover:bg-bg'
            }`}
          >
            {entry.name} ({entry.count})
          </button>
        )
      })}
    </div>
  )
}
