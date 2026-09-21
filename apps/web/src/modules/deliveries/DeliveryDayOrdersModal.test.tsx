import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { DeliveryDayOrdersModal } from './DeliveryDayOrdersModal'
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

describe('DeliveryDayOrdersModal', () => {
  const today = new Date('2026-09-15T12:00:00')

  it('mostra a data por extenso no título', () => {
    render(
      <DeliveryDayOrdersModal isOpen isoDate="2026-09-15" orders={[]} today={today} onClose={vi.fn()} onSelectOrder={vi.fn()} />,
    )
    expect(screen.getByRole('dialog', { name: /terça-feira, 15 de setembro de 2026/i })).toBeInTheDocument()
  })

  it('lista cada pedido do dia e chama onSelectOrder ao clicar', async () => {
    const user = userEvent.setup()
    const onSelectOrder = vi.fn()
    const orders = [makeOrder({ id: 'o1', orderNumber: 'PC-1' }), makeOrder({ id: 'o2', orderNumber: 'PC-2' })]
    render(
      <DeliveryDayOrdersModal
        isOpen
        isoDate="2026-09-15"
        orders={orders}
        today={today}
        onClose={vi.fn()}
        onSelectOrder={onSelectOrder}
      />,
    )

    expect(screen.getByText(/PC-1/)).toBeInTheDocument()
    expect(screen.getByText(/PC-2/)).toBeInTheDocument()

    await user.click(screen.getByText(/PC-2/))
    expect(onSelectOrder).toHaveBeenCalledWith('o2')
  })
})
