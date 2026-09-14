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
})
