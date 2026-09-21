import { describe, expect, it } from 'vitest'
import { getDeliveryStatus, isActiveDelivery } from './deliveryStatus'
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

describe('getDeliveryStatus', () => {
  const today = new Date('2026-09-15T12:00:00')

  it('é "atrasado" quando a data prevista já passou e o pedido não chegou', () => {
    const order = makeOrder({ expectedDeliveryDate: '2026-09-10' })
    expect(getDeliveryStatus(order, today)).toBe('atrasado')
  })

  it('é "hoje" quando a data prevista é hoje', () => {
    const order = makeOrder({ expectedDeliveryDate: '2026-09-15' })
    expect(getDeliveryStatus(order, today)).toBe('hoje')
  })

  it('é "no_prazo" quando a data prevista é futura', () => {
    const order = makeOrder({ expectedDeliveryDate: '2026-09-20' })
    expect(getDeliveryStatus(order, today)).toBe('no_prazo')
  })

  it('é "chegou_ar_pendente" quando marcado como chegado, mesmo que a data já tenha passado', () => {
    const order = makeOrder({ expectedDeliveryDate: '2026-09-10', deliveredAt: '2026-09-14T10:00:00Z' })
    expect(getDeliveryStatus(order, today)).toBe('chegou_ar_pendente')
  })
})

describe('isActiveDelivery', () => {
  it('é true para um pedido emitido sem AR confirmado', () => {
    expect(isActiveDelivery(makeOrder())).toBe(true)
  })

  it('é false quando o pedido foi cancelado', () => {
    expect(isActiveDelivery(makeOrder({ apiStatus: 'cancelled' }))).toBe(false)
  })

  it('é false quando o AR já foi confirmado', () => {
    expect(
      isActiveDelivery(makeOrder({ deliveredAt: '2026-09-14T10:00:00Z', deliveryReceiptConfirmedAt: '2026-09-16T10:00:00Z' })),
    ).toBe(false)
  })
})
