import { Modal } from '../../components'
import { STATUS_ORDER } from './taskStatus'
import { TaskBoardColumn } from './TaskBoardColumn'
import type { TaskCard, TaskCardFormValues, TaskStatus } from './types'

export interface TaskBoardModalProps {
  isOpen: boolean
  onClose: () => void
  cardsByStatus: Record<TaskStatus, TaskCard[]>
  tenantId: string
  userId: string
  onCreateCard: (title: string) => void
  isCreating: boolean
  onMoveCard: (cardId: string, status: TaskStatus) => void
  onEditCard: (cardId: string, values: TaskCardFormValues) => void
  onDeleteCard: (cardId: string) => void
}

export function TaskBoardModal({
  isOpen,
  onClose,
  cardsByStatus,
  tenantId,
  userId,
  onCreateCard,
  isCreating,
  onMoveCard,
  onEditCard,
  onDeleteCard,
}: TaskBoardModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Quadro de Funcionalidades" maxWidthClassName="max-w-5xl">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {STATUS_ORDER.map((status, index) => (
          <TaskBoardColumn
            key={status}
            status={status}
            cards={cardsByStatus[status]}
            tenantId={tenantId}
            userId={userId}
            onMove={onMoveCard}
            onEdit={onEditCard}
            onDelete={onDeleteCard}
            onCreate={index === 0 ? onCreateCard : undefined}
            isCreating={isCreating}
          />
        ))}
      </div>
    </Modal>
  )
}
