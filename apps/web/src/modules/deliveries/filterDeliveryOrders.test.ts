import { describe, expect, it } from 'vitest'
import { filterDeliveryOrders } from './filterDeliveryOrders'
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

describe('filterDeliveryOrders', () => {
  const orders = [
    makeOrder({ id: 'o1', unitId: 'u1', orderNumber: 'PC-100', supplierNames: ['Fornecedor Alfa'] }),
    makeOrder({ id: 'o2', unitId: 'u2', orderNumber: 'PC-200', supplierNames: ['Fornecedor Beta'] }),
  ]

  it('filtra por unidade quando unitId é informado', () => {
    const result = filterDeliveryOrders(orders, { search: '', unitId: 'u2' })
    expect(result.map((o) => o.id)).toEqual(['o2'])
  })

  it('filtra por número do PC (case-insensitive)', () => {
    const result = filterDeliveryOrders(orders, { search: 'pc-100', unitId: null })
    expect(result.map((o) => o.id)).toEqual(['o1'])
  })

  it('filtra por nome de fornecedor', () => {
    const result = filterDeliveryOrders(orders, { search: 'beta', unitId: null })
    expect(result.map((o) => o.id)).toEqual(['o2'])
  })

  it('retorna tudo quando não há filtro', () => {
    expect(filterDeliveryOrders(orders, { search: '', unitId: null })).toHaveLength(2)
  })

  it('combina busca e unidade', () => {
    const result = filterDeliveryOrders(orders, { search: 'pc-200', unitId: 'u1' })
    expect(result).toHaveLength(0)
  })
})
