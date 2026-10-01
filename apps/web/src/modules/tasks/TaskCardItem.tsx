import { useState } from 'react'
import { CheckCircle2, ChevronLeft, ChevronRight, Paperclip, Pencil, Trash2 } from 'lucide-react'
import { Button } from '../../components'
import { formatDateTime } from '../../lib/formatters'
import { getNextStatus, getPreviousStatus } from './taskStatus'
import { TaskCardAttachmentsSection } from './TaskCardAttachmentsSection'
import type { TaskCard, TaskCardEventType, TaskCardFormValues } from './types'

const EVENT_LABELS: Record<TaskCardEventType, string> = {
  moved_em_andamento: 'Movido para Em andamento por',
  moved_concluido: 'Movido para Concluído por',
  validated: 'Validado por',
}

export interface TaskCardItemProps {
  card: TaskCard
  tenantId: string
  userId: string
  onMove: (cardId: string, status: 'a_fazer' | 'fazendo' | 'feito') => void
  onEdit: (cardId: string, values: TaskCardFormValues) => void
  onDelete: (cardId: string) => void
  onValidate: (cardId: string) => void
}

export function TaskCardItem({
  card,
  tenantId,
  userId,
  onMove,
  onEdit,
  onDelete,
  onValidate,
}: TaskCardItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [showAttachments, setShowAttachments] = useState(false)
  const [title, setTitle] = useState(card.title)
  const [description, setDescription] = useState(card.description ?? '')

  const previousStatus = getPreviousStatus(card.status)
  const nextStatus = getNextStatus(card.status)

  function startEditing() {
    setTitle(card.title)
    setDescription(card.description ?? '')
    setIsEditing(true)
  }

  function handleSave() {
    if (!title.trim()) return
    onEdit(card.id, { title: title.trim(), description })
    setIsEditing(false)
  }

  if (isEditing) {
    return (
      <div className="flex flex-col gap-2 rounded border border-line bg-surface p-3">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          aria-label="Título do card"
          className="rounded border border-line bg-bg px-2 py-1 text-sm text-ink"
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          aria-label="Descrição do card"
          rows={2}
          className="rounded border border-line bg-bg px-2 py-1 text-sm text-ink"
        />
        <div className="flex gap-2">
          <Button variant="secondary" onClick={handleSave}>
            Salvar
          </Button>
          <Button variant="ghost" onClick={() => setIsEditing(false)}>
            Cancelar
          </Button>
        </div>
        <div className="border-t border-line pt-2">
          <TaskCardAttachmentsSection taskCardId={card.id} tenantId={tenantId} userId={userId} />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2 rounded border border-line bg-surface p-3">
      <p className="text-sm font-medium text-ink">{card.title}</p>
      {card.description && <p className="text-sm text-ink-muted">{card.description}</p>}
      <p className="text-xs text-ink-muted">
        {card.createdByName ? `Criado por ${card.createdByName} em ` : 'Criado em '}
        {formatDateTime(new Date(card.createdAt))}
      </p>
      {card.lastMovedEventType && card.lastMovedAt && (
        <p className="text-xs text-ink-muted">
          {EVENT_LABELS[card.lastMovedEventType]} {card.lastMovedByName ?? 'alguém'} em{' '}
          {formatDateTime(new Date(card.lastMovedAt))}
        </p>
      )}
      <div className="flex items-center justify-between">
        <div className="flex gap-1">
          <button
            type="button"
            aria-label="Mover para a coluna anterior"
            disabled={!previousStatus}
            onClick={() => previousStatus && onMove(card.id, previousStatus)}
            className="rounded p-1 text-ink-muted hover:bg-bg hover:text-ink disabled:cursor-not-allowed disabled:opacity-30"
          >
            <ChevronLeft size={16} aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label="Mover para a próxima coluna"
            disabled={!nextStatus}
            onClick={() => nextStatus && onMove(card.id, nextStatus)}
            className="rounded p-1 text-ink-muted hover:bg-bg hover:text-ink disabled:cursor-not-allowed disabled:opacity-30"
          >
            <ChevronRight size={16} aria-hidden="true" />
          </button>
        </div>
        <div className="flex gap-1">
          <button
            type="button"
            aria-label={`Anexos de ${card.title}`}
            onClick={() => setShowAttachments((current) => !current)}
            className={`rounded p-1 hover:bg-bg ${
              showAttachments ? 'text-primary' : 'text-ink-muted hover:text-ink'
            }`}
          >
            <Paperclip size={14} aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label={`Editar ${card.title}`}
            onClick={startEditing}
            className="rounded p-1 text-amber-600 hover:bg-bg hover:text-amber-700"
          >
            <Pencil size={14} aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label={`Excluir ${card.title}`}
            onClick={() => onDelete(card.id)}
            className="rounded p-1 text-ink-muted hover:bg-bg hover:text-red-600"
          >
            <Trash2 size={14} aria-hidden="true" />
          </button>
        </div>
      </div>
      {card.status === 'feito' && card.lastMovedEventType !== 'validated' && (
        <Button variant="success" className="w-full" onClick={() => onValidate(card.id)}>
          <CheckCircle2 size={14} className="mr-1 inline" aria-hidden="true" />
          Validar
        </Button>
      )}
      {showAttachments && (
        <div className="border-t border-line pt-2">
          <TaskCardAttachmentsSection taskCardId={card.id} tenantId={tenantId} userId={userId} />
        </div>
      )}
    </div>
  )
}
