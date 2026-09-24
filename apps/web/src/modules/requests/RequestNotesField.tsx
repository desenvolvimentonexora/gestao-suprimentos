import { useState } from 'react'
import { MessageSquare } from 'lucide-react'
import { Button } from '../../components'

export interface RequestNotesFieldProps {
  requestId: string
  initialValue: string
  onSave: (requestId: string, value: string) => void
}

// Bloco de Observações compartilhado entre Análise de Solicitações e
// Disparo de Solicitações — mesmo padrão nas duas telas (rótulo + ajuda
// inline, campo com botão de confirmar ao lado, igual à referência).
export function RequestNotesField({ requestId, initialValue, onSave }: RequestNotesFieldProps) {
  const [draft, setDraft] = useState(initialValue)
  const inputId = `notes-${requestId}`

  function save() {
    onSave(requestId, draft)
  }

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={inputId} className="flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-ink-muted">
        <MessageSquare size={14} className="text-ink-muted" aria-hidden="true" />
        Observações
        <span className="normal-case">(ficam registradas até a SOL ser aprovada)</span>
      </label>
      <div className="flex gap-2">
        <input
          id={inputId}
          type="text"
          placeholder="Adicionar observação..."
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={save}
          className="flex-1 rounded border border-line bg-surface px-3 py-2 text-sm text-ink"
        />
        <Button type="button" variant="secondary" onClick={save}>
          + Adicionar
        </Button>
      </div>
    </div>
  )
}
