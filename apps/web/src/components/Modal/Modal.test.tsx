import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Pencil } from 'lucide-react'
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

  it('mostra o ícone e a cor de título quando informados, sem afetar o nome acessível', () => {
    render(
      <Modal isOpen onClose={vi.fn()} title="Fila de Alterações" icon={Pencil} titleClassName="text-blue-700">
        <p>Conteúdo</p>
      </Modal>,
    )
    expect(screen.getByRole('dialog', { name: 'Fila de Alterações' })).toBeInTheDocument()
    expect(screen.getByText('Fila de Alterações').className).toContain('text-blue-700')
  })

  it('sem ícone/cor informados, mantém o título no estilo padrão', () => {
    render(
      <Modal isOpen onClose={vi.fn()} title="Título">
        <p>Conteúdo</p>
      </Modal>,
    )
    expect(screen.getByText('Título').className).toContain('text-ink')
  })

  it('com headerClassName, pinta a faixa inteira do título de ponta a ponta', () => {
    render(
      <Modal isOpen onClose={vi.fn()} title="Pedido PC-100" headerClassName="bg-status-atrasado/10">
        <p>Conteúdo</p>
      </Modal>,
    )
    const heading = screen.getByText('Pedido PC-100')
    const headerRow = heading.parentElement
    expect(headerRow?.className).toContain('bg-status-atrasado/10')
    expect(headerRow?.className).toContain('rounded-t-xl')
  })

  it('sem headerClassName, a faixa do título não ganha fundo nem cantos arredondados extras', () => {
    render(
      <Modal isOpen onClose={vi.fn()} title="Título">
        <p>Conteúdo</p>
      </Modal>,
    )
    const headerRow = screen.getByText('Título').parentElement
    expect(headerRow?.className).not.toContain('rounded-t-xl')
  })
})
