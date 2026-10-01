import { useState, type FormEvent } from 'react'
import { Button } from '../../components'
import { STATUS_LABELS } from './taskStatus'
import { TaskCardItem } from './TaskCardItem'
import type { TaskCard, TaskCardFormValues, TaskStatus } from './types'

export interface TaskBoardColumnProps {
  status: TaskStatus
  cards: TaskCard[]
  tenantId: string
  userId: string
  onMove: (cardId: string, status: TaskStatus) => void
  onEdit: (cardId: string, values: TaskCardFormValues) => void
  onDelete: (cardId: string) => void
  onCreate?: (title: string) => void
  isCreating?: boolean
}

export function TaskBoardColumn({
  status,
  cards,
  tenantId,
  userId,
  onMove,
  onEdit,
  onDelete,
  onCreate,
  isCreating = false,
}: TaskBoardColumnProps) {
  const [draft, setDraft] = useState('')

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!draft.trim() || !onCreate) return
    onCreate(draft.trim())
    setDraft('')
  }

  return (
    <div className="flex h-full flex-col gap-2 rounded border border-line bg-bg p-3">
      <h3 className="text-sm font-semibold text-ink">
        {STATUS_LABELS[status]} <span className="text-ink-muted">({cards.length})</span>
      </h3>
      <div className="flex max-h-[50vh] flex-col gap-2 overflow-y-auto">
        {cards.map((card) => (
          <TaskCardItem
            key={card.id}
            card={card}
            tenantId={tenantId}
            userId={userId}
            onMove={onMove}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>
      {onCreate && (
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="+ Adicionar card"
            aria-label="Título do novo card"
            className="flex-1 rounded border border-line bg-surface px-2 py-1 text-sm text-ink"
          />
          <Button type="submit" variant="secondary" disabled={!draft.trim() || isCreating}>
            Adicionar
          </Button>
        </form>
      )}
    </div>
  )
}
