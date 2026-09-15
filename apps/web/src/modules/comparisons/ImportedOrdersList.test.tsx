import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ImportedOrdersList } from './ImportedOrdersList'
import type { ImportedOrderRow } from './types'

const rows: ImportedOrderRow[] = [
  {
    orderId: 'o1',
    orderNumber: 'PC-100',
    unitName: 'UP Graça',
    supplierNames: ['Sika', 'Votorantim'],
    expectedDeliveryDate: '2026-10-01',
    status: 'issued',
  },
]

describe('ImportedOrdersList', () => {
  it('mostra número do pedido, unidade, fornecedores, data prevista e status', () => {
    render(<ImportedOrdersList rows={rows} />)
    expect(screen.getByText('PC-100')).toBeInTheDocument()
    expect(screen.getByText('UP Graça')).toBeInTheDocument()
    expect(screen.getByText('Sika, Votorantim')).toBeInTheDocument()
    expect(screen.getByText('01/10/2026')).toBeInTheDocument()
    expect(screen.getByText('Emitido')).toBeInTheDocument()
  })

  it('mostra — quando não há data prevista', () => {
    render(<ImportedOrdersList rows={[{ ...rows[0]!, expectedDeliveryDate: null }]} />)
    expect(screen.getByText('—')).toBeInTheDocument()
  })

  it('mostra Cancelado para pedidos cancelados', () => {
    render(<ImportedOrdersList rows={[{ ...rows[0]!, status: 'cancelled' }]} />)
    expect(screen.getByText('Cancelado')).toBeInTheDocument()
  })

  it('mostra mensagem de estado vazio quando não há pedidos importados', () => {
    render(<ImportedOrdersList rows={[]} />)
    expect(screen.getByText(/nenhum pedido importado/i)).toBeInTheDocument()
  })
})
