import { useState } from 'react'
import { Button } from '../../components'

export interface DeliveryNotesFieldProps {
  notes: string | null
  isSaving: boolean
  onSave: (notes: string) => void
}

// Campo único, sem histórico/autor por observação — se o produto pedir
// múltiplas observações com histórico, isso é uma migration futura
// (order_delivery_notes com tenant_id/created_by/created_at), não algo
// pra resolver dentro desta etapa.
export function DeliveryNotesField({ notes, isSaving, onSave }: DeliveryNotesFieldProps) {
  const [draft, setDraft] = useState(notes ?? '')
  const isDirty = draft !== (notes ?? '')

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor="delivery-notes" className="text-sm font-medium text-ink">
        Observações
      </label>
      <textarea
        id="delivery-notes"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        rows={3}
        className="rounded border border-line bg-surface px-3 py-2 text-sm text-ink"
      />
      <Button
        variant="secondary"
        className="self-start"
        disabled={!isDirty || isSaving}
        onClick={() => onSave(draft)}
      >
        + Add
      </Button>
    </div>
  )
}
