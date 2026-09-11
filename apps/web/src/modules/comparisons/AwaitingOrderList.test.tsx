import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { AwaitingOrderList } from './AwaitingOrderList'
import type { ReleasedComparisonRow } from './types'

const rows: ReleasedComparisonRow[] = [
  {
    comparisonId: 'c1',
    requestId: 'r1',
    unitId: 'u1',
    unitName: 'UP Graça',
    externalRef: 'SOL-1',
    totalValue: 1500,
  },
]

describe('AwaitingOrderList', () => {
  it('mostra as comparações liberadas aguardando pedido, com valor total formatado', () => {
    render(<AwaitingOrderList rows={rows} onGenerateOrder={vi.fn()} />)
    expect(screen.getByText('UP Graça')).toBeInTheDocument()
    expect(screen.getByText('SOL-1')).toBeInTheDocument()
    expect(screen.getByText('R$ 1.500,00')).toBeInTheDocument()
  })

  it('mostra mensagem de estado vazio quando não há comparações aguardando pedido', () => {
    render(<AwaitingOrderList rows={[]} onGenerateOrder={vi.fn()} />)
    expect(screen.getByText(/nenhuma comparação liberada aguardando pedido/i)).toBeInTheDocument()
  })

  it('chama onGenerateOrder com o id da comparação ao clicar em Gerar pedido', async () => {
    const user = userEvent.setup()
    const onGenerateOrder = vi.fn()
    render(<AwaitingOrderList rows={rows} onGenerateOrder={onGenerateOrder} />)

    await user.click(screen.getByRole('button', { name: /gerar pedido/i }))

    expect(onGenerateOrder).toHaveBeenCalledWith('c1')
  })
})
