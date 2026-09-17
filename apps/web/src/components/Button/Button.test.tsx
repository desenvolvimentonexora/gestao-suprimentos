import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Button } from './Button'

describe('Button', () => {
  it('renderiza o texto do filho', () => {
    render(<Button>Salvar alterações</Button>)
    expect(screen.getByRole('button', { name: 'Salvar alterações' })).toBeInTheDocument()
  })

  it('chama onClick ao ser clicado', async () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Enviar</Button>)

    await userEvent.click(screen.getByRole('button', { name: 'Enviar' }))

    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('não chama onClick quando desabilitado', async () => {
    const onClick = vi.fn()
    render(
      <Button onClick={onClick} disabled>
        Enviar
      </Button>,
    )

    await userEvent.click(screen.getByRole('button', { name: 'Enviar' }))

    expect(onClick).not.toHaveBeenCalled()
  })

  it('aplica o estilo translúcido do variant on-primary, para uso sobre fundo em degradê', () => {
    render(<Button variant="on-primary">Importar Excel</Button>)
    expect(screen.getByRole('button', { name: 'Importar Excel' }).className).toContain('text-on-primary')
  })

  it('aplica o estilo preenchido de destaque do variant accent, distinto de primary e secondary', () => {
    const { rerender } = render(<Button variant="accent">Liberar</Button>)
    const accentClass = screen.getByRole('button', { name: 'Liberar' }).className
    expect(accentClass).toContain('bg-accent')

    rerender(<Button variant="secondary">Liberar</Button>)
    const secondaryClass = screen.getByRole('button', { name: 'Liberar' }).className
    expect(accentClass).not.toBe(secondaryClass)
  })

  it('aplica um azul de destaque no variant info, para ações que não são de marca', () => {
    render(<Button variant="info">Relatório</Button>)
    expect(screen.getByRole('button', { name: 'Relatório' }).className).toContain('bg-blue')
  })

  it('aplica vermelho preenchido no variant danger, para ações destrutivas', () => {
    render(<Button variant="danger">Excluir</Button>)
    expect(screen.getByRole('button', { name: 'Excluir' }).className).toContain('bg-red')
  })

  it('aplica roxo preenchido no variant violet, para ações de conferência (não é cor de marca)', () => {
    render(<Button variant="violet">Confirmar comprovante</Button>)
    expect(screen.getByRole('button', { name: 'Confirmar comprovante' }).className).toContain('bg-violet')
  })

  it('aplica laranja preenchido no variant warning, para ações de recusa/alerta', () => {
    render(<Button variant="warning">Não liberar</Button>)
    expect(screen.getByRole('button', { name: 'Não liberar' }).className).toContain('bg-orange')
  })
})
