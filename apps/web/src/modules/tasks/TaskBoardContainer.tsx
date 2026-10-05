import { TaskBoardModal } from './TaskBoardModal'
import { groupByStatus } from './groupByStatus'
import {
  useCreateTaskCard,
  useDeleteTaskCard,
  useTaskCards,
  useUpdateTaskCard,
  useUpdateTaskCardStatus,
  useValidateTaskCard,
} from './queries'

export interface TaskBoardContainerProps {
  isOpen: boolean
  onClose: () => void
  tenantId: string
  userId: string
}

export function TaskBoardContainer({ isOpen, onClose, tenantId, userId }: TaskBoardContainerProps) {
  const cardsQuery = useTaskCards()
  const createCard = useCreateTaskCard(tenantId, userId)
  const updateStatus = useUpdateTaskCardStatus(userId)
  const updateCard = useUpdateTaskCard()
  const deleteCard = useDeleteTaskCard()
  const validateCard = useValidateTaskCard(userId)

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
      onValidateCard={(cardId) => validateCard.mutate(cardId)}
    />
  )
}
