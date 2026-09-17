import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ClarificationModal } from './ClarificationModal'

function baseProps() {
  return {
    isOpen: true,
    onClose: vi.fn(),
    pendingItems: [{ materialName: 'Porta', motivo: 'Informar modelo da porta' }],
    onSubmit: vi.fn(),
    isSubmitting: false,
    submitError: null,
  }
}

describe('ClarificationModal', () => {
  it('lista os itens sinalizados com o motivo de cada um', () => {
    render(<ClarificationModal {...baseProps()} />)
    expect(screen.getByText('Porta')).toBeInTheDocument()
    expect(screen.getByText(/Informar modelo da porta/)).toBeInTheDocument()
  })

  it('pré-preenche a mensagem a partir dos motivos', () => {
    render(<ClarificationModal {...baseProps()} />)
    const textarea = screen.getByLabelText('Mensagem para o engenheiro') as HTMLTextAreaElement
    expect(textarea.value).toContain('Porta: Informar modelo da porta')
  })

  it('envia a mensagem editada ao confirmar', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<ClarificationModal {...baseProps()} onSubmit={onSubmit} />)

    const textarea = screen.getByLabelText('Mensagem para o engenheiro')
    await user.clear(textarea)
    await user.type(textarea, 'Mensagem customizada')
    await user.click(screen.getByRole('button', { name: /enviar solicitação de esclarecimento/i }))

    expect(onSubmit).toHaveBeenCalledWith('Mensagem customizada')
  })

  it('mostra o erro de envio quando a submissão falha', () => {
    render(<ClarificationModal {...baseProps()} submitError="Não foi possível enviar. Tente novamente." />)
    expect(screen.getByText('Não foi possível enviar. Tente novamente.')).toBeInTheDocument()
  })
})
