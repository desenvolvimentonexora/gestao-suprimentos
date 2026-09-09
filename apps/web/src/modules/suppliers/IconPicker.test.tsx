import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { IconPicker } from './IconPicker'

describe('IconPicker', () => {
  it('marca o ícone atualmente selecionado', () => {
    render(<IconPicker value="wrench" onChange={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'wrench' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'zap' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('chama onChange com o nome do ícone clicado', async () => {
    const onChange = vi.fn()
    render(<IconPicker value="wrench" onChange={onChange} />)

    await userEvent.click(screen.getByRole('button', { name: 'zap' }))

    expect(onChange).toHaveBeenCalledWith('zap')
  })

  it('filtra os ícones pela busca', async () => {
    render(<IconPicker value="wrench" onChange={vi.fn()} />)

    await userEvent.type(screen.getByPlaceholderText('Buscar ícone'), 'zap')

    expect(screen.getByRole('button', { name: 'zap' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'wrench' })).not.toBeInTheDocument()
  })
})
