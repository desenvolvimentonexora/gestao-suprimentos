import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { buildCalendarGrid } from './buildCalendarGrid'
import { DeliveryCalendarGrid } from './DeliveryCalendarGrid'
import { groupOrdersByDate } from './groupOrdersByDate'
import type { DeliveryOrderRow } from './types'

function makeOrder(overrides: Partial<DeliveryOrderRow> = {}): DeliveryOrderRow {
  return {
    id: 'o1',
    orderNumber: 'PC-100',
    unitId: 'u1',
    unitName: 'UP Graça',
    supplierNames: ['Fornecedor Alfa'],
    expectedDeliveryDate: '2026-09-15',
    deliveredAt: null,
    deliveryReceiptConfirmedAt: null,
    deliveryNotes: null,
    apiStatus: 'issued',
    ...overrides,
  }
}

describe('DeliveryCalendarGrid', () => {
  const today = new Date('2026-09-15T12:00:00')
  const weeks = buildCalendarGrid(2026, 8)

  it('mostra os rótulos dos dias da semana, domingo a sábado', () => {
    render(
      <DeliveryCalendarGrid weeks={weeks} ordersByDate={new Map()} today={today} onShowMore={vi.fn()} onSelectOrder={vi.fn()} />,
    )
    expect(screen.getByText('Dom')).toBeInTheDocument()
    expect(screen.getByText('Sáb')).toBeInTheDocument()
  })

  it('mostra o chip do pedido com nº PC, fornecedor e obra', () => {
    const orders = [makeOrder({ expectedDeliveryDate: '2026-09-15' })]
    render(
      <DeliveryCalendarGrid
        weeks={weeks}
        ordersByDate={groupOrdersByDate(orders)}
        today={today}
        onShowMore={vi.fn()}
        onSelectOrder={vi.fn()}
      />,
    )
    expect(screen.getByText('PC-100 · Fornecedor Alfa · UP Graça')).toBeInTheDocument()
  })

  it('chama onSelectOrder com o id do pedido ao clicar num chip', async () => {
    const user = userEvent.setup()
    const onSelectOrder = vi.fn()
    const orders = [makeOrder({ id: 'o1', expectedDeliveryDate: '2026-09-15' })]
    render(
      <DeliveryCalendarGrid
        weeks={weeks}
        ordersByDate={groupOrdersByDate(orders)}
        today={today}
        onShowMore={vi.fn()}
        onSelectOrder={onSelectOrder}
      />,
    )

    await user.click(screen.getByText('PC-100 · Fornecedor Alfa · UP Graça'))
    expect(onSelectOrder).toHaveBeenCalledWith('o1')
  })

  it('mostra só até 3 chips e um botão "+N mais" pro resto', async () => {
    const user = userEvent.setup()
    const orders = [
      makeOrder({ id: 'o1', orderNumber: 'PC-1' }),
      makeOrder({ id: 'o2', orderNumber: 'PC-2' }),
      makeOrder({ id: 'o3', orderNumber: 'PC-3' }),
      makeOrder({ id: 'o4', orderNumber: 'PC-4' }),
    ]
    const onShowMore = vi.fn()
    render(
      <DeliveryCalendarGrid
        weeks={weeks}
        ordersByDate={groupOrdersByDate(orders)}
        today={today}
        onShowMore={onShowMore}
        onSelectOrder={vi.fn()}
      />,
    )
    expect(screen.queryByText(/pc-4/i)).not.toBeInTheDocument()
    expect(screen.getByText('+1 mais')).toBeInTheDocument()
    await user.click(screen.getByText('+1 mais'))
    expect(onShowMore).toHaveBeenCalledWith('2026-09-15')
  })

  it('mostra a legenda com os 4 status', () => {
    render(
      <DeliveryCalendarGrid weeks={weeks} ordersByDate={new Map()} today={today} onShowMore={vi.fn()} onSelectOrder={vi.fn()} />,
    )
    expect(screen.getByText('Atrasado')).toBeInTheDocument()
    expect(screen.getByText('Hoje')).toBeInTheDocument()
    expect(screen.getByText('No prazo')).toBeInTheDocument()
    expect(screen.getByText('Chegou · AR pendente')).toBeInTheDocument()
  })
})
