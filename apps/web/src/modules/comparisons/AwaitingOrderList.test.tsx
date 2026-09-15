import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
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
    render(<AwaitingOrderList rows={rows} />)
    expect(screen.getByText('UP Graça')).toBeInTheDocument()
    expect(screen.getByText('SOL-1')).toBeInTheDocument()
    expect(screen.getByText('R$ 1.500,00')).toBeInTheDocument()
  })

  it('mostra mensagem de estado vazio quando não há comparações aguardando pedido', () => {
    render(<AwaitingOrderList rows={[]} />)
    expect(screen.getByText(/nenhuma comparação liberada aguardando pedido/i)).toBeInTheDocument()
  })

  it('não oferece geração manual de pedido — o pedido vem do ERP por importação', async () => {
    const user = userEvent.setup()
    render(<AwaitingOrderList rows={rows} />)

    expect(screen.queryByRole('button', { name: /gerar pedido/i })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Ver' }))
    expect(screen.getByText('Em breve')).toBeInTheDocument()
  })
})
