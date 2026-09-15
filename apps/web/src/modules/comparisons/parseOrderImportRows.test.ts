import { describe, expect, it } from 'vitest'
import { parseOrderImportRows, type OrderImportLookup } from './parseOrderImportRows'
import type { OrderImportColumnMapping } from './types'

const mapping: OrderImportColumnMapping = {
  externalRef: 'SOL',
  orderNumber: 'Pedido',
  supplier: 'Fornecedor',
  material: 'Material',
  materialCode: 'Código',
  quantity: 'Qtd',
  unitPrice: 'Preço',
  expectedDeliveryDate: 'Entrega',
}

function baseLookup(overrides: Partial<OrderImportLookup> = {}): OrderImportLookup {
  return {
    findComparisonByExternalRef: (ref) =>
      ref === 'SOL-1' ? { comparisonId: 'c1', requestId: 'r1', unitId: 'u1', hasOrder: false } : null,
    findSupplierId: (name) => (name === 'Sika' ? 's1' : null),
    findMaterialId: () => 'm1',
    findRequestItemId: () => 'ri1',
    ...overrides,
  }
}

describe('parseOrderImportRows', () => {
  it('agrupa linhas da mesma SOL em um único pedido com vários itens', () => {
    const rows = [
      { SOL: 'SOL-1', Pedido: 'PC-100', Fornecedor: 'Sika', Material: 'Argamassa', Qtd: '10', Preço: '30', Entrega: '2026-10-01' },
      { SOL: 'SOL-1', Pedido: 'PC-100', Fornecedor: 'Sika', Material: 'Tintas', Qtd: '5', Preço: '100', Entrega: '2026-10-01' },
    ]

    const result = parseOrderImportRows(rows, mapping, baseLookup())

    expect(result.errors).toEqual([])
    expect(result.successes).toHaveLength(1)
    expect(result.successes[0]).toMatchObject({
      comparisonId: 'c1',
      requestId: 'r1',
      unitId: 'u1',
      orderNumber: 'PC-100',
      expectedDeliveryDate: '2026-10-01',
    })
    expect(result.successes[0]!.items).toHaveLength(2)
    expect(result.successes[0]!.items[0]).toEqual({
      supplierId: 's1',
      materialId: 'm1',
      requestItemId: 'ri1',
      quantity: 10,
      unitPrice: 30,
    })
  })

  it('reporta erro quando o número da SOL não bate com nenhuma comparação liberada', () => {
    const rows = [
      { SOL: 'SOL-999', Pedido: 'PC-100', Fornecedor: 'Sika', Material: 'Argamassa', Qtd: '10', Preço: '30', Entrega: '' },
    ]

    const result = parseOrderImportRows(rows, mapping, baseLookup())

    expect(result.successes).toEqual([])
    expect(result.errors).toEqual([
      { row: 1, reason: 'SOL não encontrada entre as comparações liberadas: "SOL-999".' },
    ])
  })

  it('reporta erro quando a comparação já tem um pedido importado', () => {
    const rows = [
      { SOL: 'SOL-1', Pedido: 'PC-100', Fornecedor: 'Sika', Material: 'Argamassa', Qtd: '10', Preço: '30', Entrega: '' },
    ]
    const lookup = baseLookup({
      findComparisonByExternalRef: () => ({ comparisonId: 'c1', requestId: 'r1', unitId: 'u1', hasOrder: true }),
    })

    const result = parseOrderImportRows(rows, mapping, lookup)

    expect(result.errors).toEqual([{ row: 1, reason: 'Pedido já importado para a SOL "SOL-1".' }])
  })

  it('reporta erro quando o fornecedor não é encontrado', () => {
    const rows = [
      { SOL: 'SOL-1', Pedido: 'PC-100', Fornecedor: 'Desconhecida', Material: 'Argamassa', Qtd: '10', Preço: '30', Entrega: '' },
    ]

    const result = parseOrderImportRows(rows, mapping, baseLookup())

    expect(result.errors).toEqual([{ row: 1, reason: 'Fornecedor não encontrado: "Desconhecida".' }])
  })

  it('reporta erro quando o número do pedido está vazio', () => {
    const rows = [
      { SOL: 'SOL-1', Pedido: '', Fornecedor: 'Sika', Material: 'Argamassa', Qtd: '10', Preço: '30', Entrega: '' },
    ]

    const result = parseOrderImportRows(rows, mapping, baseLookup())

    expect(result.errors).toEqual([{ row: 1, reason: 'Número do pedido não informado.' }])
  })

  it('reporta erro de quantidade e de preço unitário inválidos', () => {
    const rows = [
      { SOL: 'SOL-1', Pedido: 'PC-100', Fornecedor: 'Sika', Material: 'Argamassa', Qtd: '0', Preço: '30', Entrega: '' },
      { SOL: 'SOL-1', Pedido: 'PC-100', Fornecedor: 'Sika', Material: 'Argamassa', Qtd: '10', Preço: 'abc', Entrega: '' },
    ]

    const result = parseOrderImportRows(rows, mapping, baseLookup())

    expect(result.errors).toEqual([
      { row: 1, reason: 'Quantidade inválida: "0".' },
      { row: 2, reason: 'Preço unitário inválido: "abc".' },
    ])
  })

  it('não gera erro quando o material não é encontrado — fica sem material vinculado', () => {
    const rows = [
      { SOL: 'SOL-1', Pedido: 'PC-100', Fornecedor: 'Sika', Material: 'Item fora do catálogo', Qtd: '10', Preço: '30', Entrega: '' },
    ]
    const lookup = baseLookup({ findMaterialId: () => null, findRequestItemId: () => null })

    const result = parseOrderImportRows(rows, mapping, lookup)

    expect(result.errors).toEqual([])
    expect(result.successes[0]!.items[0]).toMatchObject({ materialId: null, requestItemId: null })
  })

  it('trata data de entrega em branco como null', () => {
    const rows = [
      { SOL: 'SOL-1', Pedido: 'PC-100', Fornecedor: 'Sika', Material: 'Argamassa', Qtd: '10', Preço: '30', Entrega: '' },
    ]

    const result = parseOrderImportRows(rows, mapping, baseLookup())

    expect(result.successes[0]!.expectedDeliveryDate).toBeNull()
  })
})
