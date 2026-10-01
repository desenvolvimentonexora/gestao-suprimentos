import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { TaskBoardModal } from './TaskBoardModal'
import type { TaskCard, TaskStatus } from './types'

function card(id: string, title: string, status: TaskStatus): TaskCard {
  return {
    id,
    title,
    description: null,
    status,
    createdAt: '2026-09-01T00:00:00Z',
    createdByName: null,
  }
}

function baseProps() {
  return {
    isOpen: true,
    onClose: vi.fn(),
    cardsByStatus: {
      a_fazer: [card('c1', 'Card A', 'a_fazer')],
      fazendo: [card('c2', 'Card B', 'fazendo')],
      feito: [card('c3', 'Card C', 'feito')],
    } as Record<TaskStatus, TaskCard[]>,
    tenantId: 'tenant-1',
    userId: 'user-1',
    onCreateCard: vi.fn(),
    isCreating: false,
    onMoveCard: vi.fn(),
    onEditCard: vi.fn(),
    onDeleteCard: vi.fn(),
  }
}

function renderModal(props: Partial<ReturnType<typeof baseProps>> = {}) {
  const queryClient = new QueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      <TaskBoardModal {...baseProps()} {...props} />
    </QueryClientProvider>,
  )
}

describe('TaskBoardModal', () => {
  it('mostra as três colunas com seus rótulos e cards', () => {
    renderModal()
    expect(screen.getByText(/Realizar/)).toBeInTheDocument()
    expect(screen.getByText(/Realizando/)).toBeInTheDocument()
    expect(screen.getByText(/Realizado/)).toBeInTheDocument()
    expect(screen.getByText('Card A')).toBeInTheDocument()
    expect(screen.getByText('Card B')).toBeInTheDocument()
    expect(screen.getByText('Card C')).toBeInTheDocument()
  })

  it('só a coluna "Realizar" tem campo de adicionar card', () => {
    renderModal()
    expect(screen.getAllByLabelText('Título do novo card')).toHaveLength(1)
  })

  it('cria um card novo a partir do campo rápido', async () => {
    const onCreateCard = vi.fn()
    renderModal({ onCreateCard })

    await userEvent.type(screen.getByLabelText('Título do novo card'), 'Nova tarefa')
    await userEvent.click(screen.getByRole('button', { name: 'Adicionar' }))

    expect(onCreateCard).toHaveBeenCalledWith('Nova tarefa')
  })

  it('não mostra nada quando fechado', () => {
    renderModal({ isOpen: false })
    expect(screen.queryByText('Card A')).not.toBeInTheDocument()
  })
})
