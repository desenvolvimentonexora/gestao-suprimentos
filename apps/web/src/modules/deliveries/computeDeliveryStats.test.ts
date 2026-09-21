import { describe, expect, it } from 'vitest'
import { computeDeliveryStats } from './computeDeliveryStats'
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

describe('computeDeliveryStats', () => {
  const today = new Date('2026-09-15T12:00:00')

  it('conta cada status ativo no balde certo e soma o total de ativos', () => {
    const orders = [
      makeOrder({ id: 'o1', expectedDeliveryDate: '2026-09-10' }), // atrasado
      makeOrder({ id: 'o2', expectedDeliveryDate: '2026-09-15' }), // hoje
      makeOrder({ id: 'o3', expectedDeliveryDate: '2026-09-20' }), // no prazo
      makeOrder({ id: 'o4', expectedDeliveryDate: '2026-09-01', deliveredAt: '2026-09-14T00:00:00Z' }), // chegou · AR pendente
    ]
    expect(computeDeliveryStats(orders, today)).toEqual({
      totalAtivos: 4,
      atrasados: 1,
      hoje: 1,
      futuros: 1,
    })
  })

  it('ignora pedidos cancelados e pedidos com AR já confirmado', () => {
    const orders = [
      makeOrder({ id: 'o1', apiStatus: 'cancelled', expectedDeliveryDate: '2026-09-10' }),
      makeOrder({
        id: 'o2',
        expectedDeliveryDate: '2026-09-01',
        deliveredAt: '2026-09-05T00:00:00Z',
        deliveryReceiptConfirmedAt: '2026-09-06T00:00:00Z',
      }),
    ]
    expect(computeDeliveryStats(orders, today)).toEqual({ totalAtivos: 0, atrasados: 0, hoje: 0, futuros: 0 })
  })

  it('retorna todos os contadores zerados quando não há pedidos', () => {
    expect(computeDeliveryStats([], today)).toEqual({ totalAtivos: 0, atrasados: 0, hoje: 0, futuros: 0 })
  })
})
