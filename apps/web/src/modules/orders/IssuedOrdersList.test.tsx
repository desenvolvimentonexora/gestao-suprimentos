import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { IssuedOrdersList } from './IssuedOrdersList'
import type { OrderRow } from './types'

const rows: OrderRow[] = [
  {
    id: 'o1',
    orderNumber: 'PED-0001',
    unitName: 'UP Graça',
    supplierNames: ['Fornecedor A', 'Fornecedor B'],
    totalValue: 800,
    expectedDeliveryDate: '2026-10-01',
    status: 'issued',
  },
  {
    id: 'o2',
    orderNumber: 'PED-0002',
    unitName: 'UP Barra',
    supplierNames: ['Fornecedor C'],
    totalValue: 200,
    expectedDeliveryDate: null,
    status: 'cancelled',
  },
]

describe('IssuedOrdersList', () => {
  it('mostra os pedidos emitidos com número, unidade, fornecedores e valor', () => {
    render(<IssuedOrdersList rows={rows} onCancelOrder={vi.fn()} />)
    expect(screen.getByText('PED-0001')).toBeInTheDocument()
    expect(screen.getByText('UP Graça')).toBeInTheDocument()
    expect(screen.getByText('Fornecedor A, Fornecedor B')).toBeInTheDocument()
    expect(screen.getByText(/R\$\s*800,00/)).toBeInTheDocument()
  })

  it('mostra mensagem de estado vazio quando não há pedidos emitidos', () => {
    render(<IssuedOrdersList rows={[]} onCancelOrder={vi.fn()} />)
    expect(screen.getByText(/nenhum pedido emitido/i)).toBeInTheDocument()
  })

  it('mostra botão de cancelar apenas para pedidos emitidos, não para cancelados', () => {
    render(<IssuedOrdersList rows={rows} onCancelOrder={vi.fn()} />)
    const cancelButtons = screen.getAllByRole('button', { name: /cancelar/i })
    expect(cancelButtons).toHaveLength(1)
  })

  it('chama onCancelOrder com o id do pedido ao clicar em Cancelar', async () => {
    const user = userEvent.setup()
    const onCancelOrder = vi.fn()
    render(<IssuedOrdersList rows={rows} onCancelOrder={onCancelOrder} />)

    await user.click(screen.getByRole('button', { name: /cancelar/i }))

    expect(onCancelOrder).toHaveBeenCalledWith('o1')
  })

  it('mostra o status do pedido cancelado', () => {
    render(<IssuedOrdersList rows={rows} onCancelOrder={vi.fn()} />)
    expect(screen.getByText('Cancelado')).toBeInTheDocument()
  })

  it('mostra a data prevista de entrega sem deslocar um dia por fuso horário', () => {
    render(<IssuedOrdersList rows={rows} onCancelOrder={vi.fn()} />)
    expect(screen.getByText('01/10/2026')).toBeInTheDocument()
  })
})
