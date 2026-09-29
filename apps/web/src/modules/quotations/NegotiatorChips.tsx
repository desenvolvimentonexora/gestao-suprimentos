import type { NegotiatorCount } from './getNegotiatorCounts'
import { getNegotiatorColor } from './negotiatorColor'

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
        const color = getNegotiatorColor(entry.id)
        return (
          <button
            key={entry.id}
            type="button"
            onClick={() => onSelect(isSelected ? null : entry.id)}
            className={`flex min-w-[88px] flex-col items-center gap-0.5 rounded-md border px-3 py-2 ${
              isSelected ? color.chipSelected : color.chipUnselected
            }`}
          >
            <span className="text-[11px] font-semibold uppercase tracking-wide">{entry.name}</span>
            <span className="text-xl font-bold">{entry.count}</span>
          </button>
        )
      })}
    </div>
  )
}
