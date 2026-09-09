import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Toast } from './Toast'

describe('Toast', () => {
  it('renderiza a mensagem', () => {
    render(<Toast variant="info" message="Alterações salvas." />)
    expect(screen.getByText('Alterações salvas.')).toBeInTheDocument()
  })

  it('usa role alert para variante de erro', () => {
    render(<Toast variant="error" message="Falha ao salvar." />)
    expect(screen.getByRole('alert')).toHaveTextContent('Falha ao salvar.')
  })

  it('usa role status para variantes que não são de erro', () => {
    render(<Toast variant="success" message="Salvo com sucesso." />)
    expect(screen.getByRole('status')).toHaveTextContent('Salvo com sucesso.')
  })

  it('chama onDismiss ao clicar em fechar', async () => {
    const onDismiss = vi.fn()
    render(<Toast variant="info" message="Aviso." onDismiss={onDismiss} />)

    await userEvent.click(screen.getByRole('button', { name: 'Fechar aviso' }))

    expect(onDismiss).toHaveBeenCalledTimes(1)
  })

  it('não renderiza botão de fechar quando onDismiss não é informado', () => {
    render(<Toast variant="info" message="Aviso." />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})
