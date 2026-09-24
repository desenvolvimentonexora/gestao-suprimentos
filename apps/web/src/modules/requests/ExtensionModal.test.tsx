import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ExtensionModal } from './ExtensionModal'

function baseProps() {
  return {
    isOpen: true,
    onClose: vi.fn(),
    currentNeededBy: '2026-09-18',
    onSubmit: vi.fn(),
    isSubmitting: false,
    submitError: null,
  }
}

describe('ExtensionModal', () => {
  it('mostra a data de entrega atual', () => {
    render(<ExtensionModal {...baseProps()} />)
    expect(screen.getByText(/entrega atual: 18\/09\/2026/i)).toBeInTheDocument()
  })

  it('exige nova data e motivo antes de enviar', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<ExtensionModal {...baseProps()} onSubmit={onSubmit} />)

    await user.click(screen.getByRole('button', { name: /enviar/i }))

    expect(await screen.findByText('Informe a nova data de entrega proposta.')).toBeInTheDocument()
    expect(screen.getByText('Informe o motivo da prorrogação.')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('envia a nova data e o motivo preenchidos', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<ExtensionModal {...baseProps()} onSubmit={onSubmit} />)

    await user.type(screen.getByLabelText('Nova data proposta'), '2026-09-25')
    await user.type(screen.getByLabelText('Motivo'), 'Fornecedor sem estoque até lá')
    await user.click(screen.getByRole('button', { name: /enviar/i }))

    expect(onSubmit).toHaveBeenCalledWith({
      newNeededBy: '2026-09-25',
      reason: 'Fornecedor sem estoque até lá',
    })
  })
})
