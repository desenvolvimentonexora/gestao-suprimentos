import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { AwaitingOrderList } from './AwaitingOrderList'
import type { ReleasedComparisonRow } from './types'

function makeRow(overrides: Partial<ReleasedComparisonRow> = {}): ReleasedComparisonRow {
  return {
    comparisonId: 'c1',
    requestId: 'r1',
    unitId: 'u1',
    unitName: 'UP Graça',
    externalRef: null,
    sequenceNumber: 3,
    totalValue: 1500,
    itemCount: 2,
    supplierCount: 1,
    note: null,
    submittedByName: 'Negociador Beta',
    submittedAt: '2026-09-16T10:00:00Z',
    releasedByName: 'Admin Construtora Beta',
    releasedAt: '2026-09-16T14:00:00Z',
    ...overrides,
  }
}

describe('AwaitingOrderList', () => {
  it('mostra o chip com a contagem de comparações liberadas aguardando pedido', () => {
    render(<AwaitingOrderList rows={[makeRow(), makeRow({ comparisonId: 'c2' })]} />)
    expect(screen.getByText('2 liberadas aguardando pedido')).toBeInTheDocument()
  })

  it('mostra o rótulo da seção (em caixa alta via CSS, não texto literal maiúsculo)', () => {
    render(<AwaitingOrderList rows={[makeRow()]} />)
    const label = screen.getByText(/liberadas · pronto para pedido/i)
    expect(label).toBeInTheDocument()
    expect(label.className).toContain('uppercase')
  })

  it('mostra número da SOL e nome da unidade no título do card', () => {
    render(<AwaitingOrderList rows={[makeRow()]} />)
    expect(screen.getByText(/SOL 3/)).toBeInTheDocument()
    expect(screen.getByText(/UP Graça/)).toBeInTheDocument()
  })

  it('usa o número externo (do ERP) em vez de "SOL n" quando presente', () => {
    render(<AwaitingOrderList rows={[makeRow({ externalRef: '25115' })]} />)
    expect(screen.getByText(/25115/)).toBeInTheDocument()
    expect(screen.queryByText(/SOL 3/)).not.toBeInTheDocument()
  })

  it('mostra quem enviou e quando, na linha de metadados', () => {
    render(<AwaitingOrderList rows={[makeRow()]} />)
    expect(screen.getByText(/^por Negociador Beta em/)).toBeInTheDocument()
  })

  it('mostra a nota verde de liberação com quem liberou e quando', () => {
    render(<AwaitingOrderList rows={[makeRow()]} />)
    expect(screen.getByText(/Liberada p\/ pedido por Admin Construtora Beta em/)).toBeInTheDocument()
  })

  it('mostra o resumo com valor, itens e fornecedores', () => {
    render(<AwaitingOrderList rows={[makeRow()]} />)
    expect(screen.getByText(/R\$\s?1\.500,00/)).toBeInTheDocument()
    expect(screen.getByText(/2 itens/)).toBeInTheDocument()
    expect(screen.getByText(/1 fornecedor\b/)).toBeInTheDocument()
  })

  it('mostra a observação quando presente', () => {
    render(<AwaitingOrderList rows={[makeRow({ note: 'Entrega combinada para sábado.' })]} />)
    expect(screen.getByText(/Entrega combinada para sábado\./)).toBeInTheDocument()
  })

  it('não mostra observação quando ausente', () => {
    render(<AwaitingOrderList rows={[makeRow()]} />)
    expect(screen.queryByText(/💬/)).not.toBeInTheDocument()
  })

  it('mostra mensagem de estado vazio quando não há comparações liberadas aguardando pedido', () => {
    render(<AwaitingOrderList rows={[]} />)
    expect(screen.getByText(/nenhuma comparação liberada aguardando pedido/i)).toBeInTheDocument()
  })

  it('mostra só o botão Ver, sem geração manual de pedido — o pedido vem do ERP por importação', async () => {
    const user = userEvent.setup()
    render(<AwaitingOrderList rows={[makeRow()]} />)

    expect(screen.queryByRole('button', { name: /gerar pedido/i })).not.toBeInTheDocument()
    expect(screen.getAllByRole('button')).toHaveLength(1)

    await user.click(screen.getByRole('button', { name: 'Ver' }))
    expect(screen.getByText('Em breve')).toBeInTheDocument()
  })
})
