import { TaskBoardModal } from './TaskBoardModal'
import {
  useCreateTaskCard,
  useDeleteTaskCard,
  useTaskCards,
  useUpdateTaskCard,
  useUpdateTaskCardStatus,
} from './queries'
import type { TaskCard, TaskStatus } from './types'

export interface TaskBoardContainerProps {
  isOpen: boolean
  onClose: () => void
  tenantId: string
  userId: string
}

function groupByStatus(cards: TaskCard[]): Record<TaskStatus, TaskCard[]> {
  const grouped: Record<TaskStatus, TaskCard[]> = { a_fazer: [], fazendo: [], feito: [] }
  for (const card of cards) {
    grouped[card.status].push(card)
  }
  return grouped
}

export function TaskBoardContainer({ isOpen, onClose, tenantId, userId }: TaskBoardContainerProps) {
  const cardsQuery = useTaskCards()
  const createCard = useCreateTaskCard(tenantId, userId)
  const updateStatus = useUpdateTaskCardStatus(userId)
  const updateCard = useUpdateTaskCard()
  const deleteCard = useDeleteTaskCard()

  return (
    <TaskBoardModal
      isOpen={isOpen}
      onClose={onClose}
      cardsByStatus={groupByStatus(cardsQuery.data ?? [])}
      tenantId={tenantId}
      userId={userId}
      onCreateCard={(title) => createCard.mutate({ title, description: '' })}
      isCreating={createCard.isPending}
      onMoveCard={(cardId, status) => updateStatus.mutate({ cardId, status })}
      onEditCard={(cardId, values) => updateCard.mutate({ cardId, values })}
      onDeleteCard={(cardId) => deleteCard.mutate(cardId)}
    />
  )
}
