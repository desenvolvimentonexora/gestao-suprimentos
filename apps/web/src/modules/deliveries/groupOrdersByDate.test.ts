import { describe, expect, it } from 'vitest'
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

describe('groupOrdersByDate', () => {
  it('agrupa pedidos pela data de entrega prevista', () => {
    const orders = [
      makeOrder({ id: 'o1', expectedDeliveryDate: '2026-09-15' }),
      makeOrder({ id: 'o2', expectedDeliveryDate: '2026-09-15' }),
      makeOrder({ id: 'o3', expectedDeliveryDate: '2026-09-16' }),
    ]
    const grouped = groupOrdersByDate(orders)
    expect(grouped.get('2026-09-15')?.map((o) => o.id)).toEqual(['o1', 'o2'])
    expect(grouped.get('2026-09-16')?.map((o) => o.id)).toEqual(['o3'])
  })

  it('retorna mapa vazio quando não há pedidos', () => {
    expect(groupOrdersByDate([]).size).toBe(0)
  })
})
