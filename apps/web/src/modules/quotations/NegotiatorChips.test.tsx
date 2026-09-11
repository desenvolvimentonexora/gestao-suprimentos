import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { NegotiatorChips } from './NegotiatorChips'
import type { NegotiatorCount } from './getNegotiatorCounts'

const counts: NegotiatorCount[] = [
  { id: 'n1', name: 'Lucas', count: 3 },
  { id: 'n2', name: 'Tais', count: 1 },
  { id: 'unassigned', name: 'Sem resp.', count: 2 },
]

describe('NegotiatorChips', () => {
  it('mostra um chip por negociador com a contagem', () => {
    render(<NegotiatorChips counts={counts} selected={null} onSelect={vi.fn()} />)
    expect(screen.getByRole('button', { name: /lucas.*3/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /tais.*1/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sem resp.*2/i })).toBeInTheDocument()
  })

  it('chama onSelect com o id do negociador clicado', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    render(<NegotiatorChips counts={counts} selected={null} onSelect={onSelect} />)
    await user.click(screen.getByRole('button', { name: /lucas/i }))
    expect(onSelect).toHaveBeenCalledWith('n1')
  })

  it('clicar de novo no chip selecionado limpa o filtro', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    render(<NegotiatorChips counts={counts} selected="n1" onSelect={onSelect} />)
    await user.click(screen.getByRole('button', { name: /lucas/i }))
    expect(onSelect).toHaveBeenCalledWith(null)
  })
})
