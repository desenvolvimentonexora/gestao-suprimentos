import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { TaskCardItem, type TaskCardItemProps } from './TaskCardItem'
import type { TaskCard } from './types'

const card: TaskCard = {
  id: 'c1',
  title: 'Configurar tema',
  description: 'Ajustar cores do cliente novo',
  status: 'fazendo',
  createdAt: '2026-09-01T00:00:00Z',
  createdByName: 'Marcelo Souza',
}

function baseProps(): TaskCardItemProps {
  return {
    card,
    tenantId: 'tenant-1',
    userId: 'user-1',
    onMove: vi.fn(),
    onEdit: vi.fn(),
    onDelete: vi.fn(),
  }
}

function renderCard(props: Partial<TaskCardItemProps> = {}) {
  const queryClient = new QueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      <TaskCardItem {...baseProps()} {...props} />
    </QueryClientProvider>,
  )
}

describe('TaskCardItem', () => {
  it('mostra título e descrição', () => {
    renderCard()
    expect(screen.getByText('Configurar tema')).toBeInTheDocument()
    expect(screen.getByText('Ajustar cores do cliente novo')).toBeInTheDocument()
  })

  it('mostra quem criou o card e quando', () => {
    renderCard()
    expect(screen.getByText(/Criado por Marcelo Souza em/)).toBeInTheDocument()
  })

  it('mostra só a data quando não há autor', () => {
    renderCard({ card: { ...card, createdByName: null } })
    expect(screen.getByText(/^Criado em/)).toBeInTheDocument()
  })

  it('chama onMove com a coluna anterior ao clicar em voltar', async () => {
    const onMove = vi.fn()
    renderCard({ onMove })
    await userEvent.click(screen.getByRole('button', { name: 'Mover para a coluna anterior' }))
    expect(onMove).toHaveBeenCalledWith('c1', 'a_fazer')
  })

  it('chama onMove com a próxima coluna ao clicar em avançar', async () => {
    const onMove = vi.fn()
    renderCard({ onMove })
    await userEvent.click(screen.getByRole('button', { name: 'Mover para a próxima coluna' }))
    expect(onMove).toHaveBeenCalledWith('c1', 'feito')
  })

  it('desabilita mover para trás na primeira coluna e para frente na última', () => {
    const { rerender } = render(
      <QueryClientProvider client={new QueryClient()}>
        <TaskCardItem {...baseProps()} card={{ ...card, status: 'a_fazer' }} />
      </QueryClientProvider>,
    )
    expect(screen.getByRole('button', { name: 'Mover para a coluna anterior' })).toBeDisabled()

    rerender(
      <QueryClientProvider client={new QueryClient()}>
        <TaskCardItem {...baseProps()} card={{ ...card, status: 'feito' }} />
      </QueryClientProvider>,
    )
    expect(screen.getByRole('button', { name: 'Mover para a próxima coluna' })).toBeDisabled()
  })

  it('entra em modo de edição e salva título e descrição novos', async () => {
    const onEdit = vi.fn()
    renderCard({ onEdit })

    await userEvent.click(screen.getByRole('button', { name: 'Editar Configurar tema' }))
    const titleInput = screen.getByLabelText('Título do card')
    await userEvent.clear(titleInput)
    await userEvent.type(titleInput, 'Configurar tema novo')
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }))

    expect(onEdit).toHaveBeenCalledWith('c1', {
      title: 'Configurar tema novo',
      description: 'Ajustar cores do cliente novo',
    })
  })

  it('cancela a edição sem chamar onEdit', async () => {
    const onEdit = vi.fn()
    renderCard({ onEdit })

    await userEvent.click(screen.getByRole('button', { name: 'Editar Configurar tema' }))
    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }))

    expect(onEdit).not.toHaveBeenCalled()
    expect(screen.getByText('Configurar tema')).toBeInTheDocument()
  })

  it('mostra a seção de anexos ao entrar em modo de edição', async () => {
    renderCard()

    await userEvent.click(screen.getByRole('button', { name: 'Editar Configurar tema' }))

    expect(screen.getByText('Anexos')).toBeInTheDocument()
    expect(screen.getByText('Anexar imagem ou arquivo')).toBeInTheDocument()
  })

  it('chama onDelete ao clicar em excluir', async () => {
    const onDelete = vi.fn()
    renderCard({ onDelete })
    await userEvent.click(screen.getByRole('button', { name: 'Excluir Configurar tema' }))
    expect(onDelete).toHaveBeenCalledWith('c1')
  })
})
