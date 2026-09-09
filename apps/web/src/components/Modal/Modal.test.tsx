import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Modal } from './Modal'

describe('Modal', () => {
  it('não renderiza nada quando fechado', () => {
    render(
      <Modal isOpen={false} onClose={vi.fn()} title="Título">
        <p>Conteúdo</p>
      </Modal>,
    )
    expect(screen.queryByText('Conteúdo')).not.toBeInTheDocument()
  })

  it('renderiza título e conteúdo quando aberto, com papel de diálogo', () => {
    render(
      <Modal isOpen onClose={vi.fn()} title="Título">
        <p>Conteúdo</p>
      </Modal>,
    )
    const dialog = screen.getByRole('dialog', { name: 'Título' })
    expect(dialog).toBeInTheDocument()
    expect(screen.getByText('Conteúdo')).toBeInTheDocument()
  })

  it('chama onClose ao clicar no botão de fechar', async () => {
    const onClose = vi.fn()
    render(
      <Modal isOpen onClose={onClose} title="Título">
        <p>Conteúdo</p>
      </Modal>,
    )

    await userEvent.click(screen.getByRole('button', { name: 'Fechar' }))

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('chama onClose ao pressionar Escape', async () => {
    const onClose = vi.fn()
    render(
      <Modal isOpen onClose={onClose} title="Título">
        <p>Conteúdo</p>
      </Modal>,
    )

    await userEvent.keyboard('{Escape}')

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('move o foco para dentro do diálogo ao abrir', () => {
    render(
      <Modal isOpen onClose={vi.fn()} title="Título">
        <p>Conteúdo</p>
      </Modal>,
    )
    expect(screen.getByRole('dialog')).toContainElement(document.activeElement as HTMLElement)
  })
})
