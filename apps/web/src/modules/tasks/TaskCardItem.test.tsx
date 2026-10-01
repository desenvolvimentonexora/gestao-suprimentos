import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { TaskCardItem } from './TaskCardItem'
import type { TaskCard } from './types'

const card: TaskCard = {
  id: 'c1',
  title: 'Configurar tema',
  description: 'Ajustar cores do cliente novo',
  status: 'fazendo',
  createdAt: '2026-09-01T00:00:00Z',
}

function baseProps() {
  return {
    card,
    onMove: vi.fn(),
    onEdit: vi.fn(),
    onDelete: vi.fn(),
  }
}

describe('TaskCardItem', () => {
  it('mostra título e descrição', () => {
    render(<TaskCardItem {...baseProps()} />)
    expect(screen.getByText('Configurar tema')).toBeInTheDocument()
    expect(screen.getByText('Ajustar cores do cliente novo')).toBeInTheDocument()
  })

  it('chama onMove com a coluna anterior ao clicar em voltar', async () => {
    const props = baseProps()
    render(<TaskCardItem {...props} />)
    await userEvent.click(screen.getByRole('button', { name: 'Mover para a coluna anterior' }))
    expect(props.onMove).toHaveBeenCalledWith('c1', 'a_fazer')
  })

  it('chama onMove com a próxima coluna ao clicar em avançar', async () => {
    const props = baseProps()
    render(<TaskCardItem {...props} />)
    await userEvent.click(screen.getByRole('button', { name: 'Mover para a próxima coluna' }))
    expect(props.onMove).toHaveBeenCalledWith('c1', 'feito')
  })

  it('desabilita mover para trás na primeira coluna e para frente na última', () => {
    const { rerender } = render(
      <TaskCardItem {...baseProps()} card={{ ...card, status: 'a_fazer' }} />,
    )
    expect(screen.getByRole('button', { name: 'Mover para a coluna anterior' })).toBeDisabled()

    rerender(<TaskCardItem {...baseProps()} card={{ ...card, status: 'feito' }} />)
    expect(screen.getByRole('button', { name: 'Mover para a próxima coluna' })).toBeDisabled()
  })

  it('entra em modo de edição e salva título e descrição novos', async () => {
    const props = baseProps()
    render(<TaskCardItem {...props} />)

    await userEvent.click(screen.getByRole('button', { name: 'Editar Configurar tema' }))
    const titleInput = screen.getByLabelText('Título do card')
    await userEvent.clear(titleInput)
    await userEvent.type(titleInput, 'Configurar tema novo')
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }))

    expect(props.onEdit).toHaveBeenCalledWith('c1', {
      title: 'Configurar tema novo',
      description: 'Ajustar cores do cliente novo',
    })
  })

  it('cancela a edição sem chamar onEdit', async () => {
    const props = baseProps()
    render(<TaskCardItem {...props} />)

    await userEvent.click(screen.getByRole('button', { name: 'Editar Configurar tema' }))
    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }))

    expect(props.onEdit).not.toHaveBeenCalled()
    expect(screen.getByText('Configurar tema')).toBeInTheDocument()
  })

  it('chama onDelete ao clicar em excluir', async () => {
    const props = baseProps()
    render(<TaskCardItem {...props} />)
    await userEvent.click(screen.getByRole('button', { name: 'Excluir Configurar tema' }))
    expect(props.onDelete).toHaveBeenCalledWith('c1')
  })
})
