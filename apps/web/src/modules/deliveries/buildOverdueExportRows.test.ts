import { describe, expect, it } from 'vitest'
import { buildOverdueExportRows } from './buildOverdueExportRows'
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

describe('buildOverdueExportRows', () => {
  const today = new Date('2026-09-20T12:00:00')

  it('inclui só pedidos atrasados, com os dias de atraso calculados', () => {
    const orders = [
      makeOrder({ id: 'o1', expectedDeliveryDate: '2026-09-15', supplierNames: ['Fornecedor Alfa'] }),
      makeOrder({ id: 'o2', expectedDeliveryDate: '2026-09-25' }), // no prazo, não entra
    ]
    const rows = buildOverdueExportRows(orders, today)
    expect(rows).toEqual([
      {
        'Nº PC': 'PC-100',
        Fornecedor: 'Fornecedor Alfa',
        Obra: 'UP Graça',
        'Entrega prevista': '15/09/2026',
        'Dias em atraso': 5,
      },
    ])
  })

  it('junta múltiplos fornecedores do mesmo pedido separados por vírgula', () => {
    const orders = [
      makeOrder({ expectedDeliveryDate: '2026-09-10', supplierNames: ['Fornecedor Alfa', 'Fornecedor Beta'] }),
    ]
    expect(buildOverdueExportRows(orders, today)[0]!.Fornecedor).toBe('Fornecedor Alfa, Fornecedor Beta')
  })

  it('exclui pedidos já chegados (AR pendente) e cancelados', () => {
    const orders = [
      makeOrder({ id: 'o1', expectedDeliveryDate: '2026-09-10', deliveredAt: '2026-09-16T00:00:00Z' }),
      makeOrder({ id: 'o2', expectedDeliveryDate: '2026-09-10', apiStatus: 'cancelled' }),
    ]
    expect(buildOverdueExportRows(orders, today)).toEqual([])
  })

  it('retorna lista vazia quando não há pedidos atrasados', () => {
    expect(buildOverdueExportRows([], today)).toEqual([])
  })
})
