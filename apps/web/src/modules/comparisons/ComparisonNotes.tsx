import { useState } from 'react'

export interface ComparisonNotesProps {
  notes: string | null
  onUpdateNotes: (notes: string) => void
}

export function ComparisonNotes({ notes, onUpdateNotes }: ComparisonNotesProps) {
  const [draft, setDraft] = useState(notes ?? '')

  return (
    <div className="flex flex-col gap-1 rounded border border-line bg-surface p-4">
      <label htmlFor="comparison-notes" className="text-xs font-medium uppercase tracking-wide text-ink-muted">
        Observações
      </label>
      <textarea
        id="comparison-notes"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => onUpdateNotes(draft)}
        rows={3}
        className="rounded border border-line bg-bg px-3 py-2 text-sm text-ink"
      />
    </div>
  )
}
