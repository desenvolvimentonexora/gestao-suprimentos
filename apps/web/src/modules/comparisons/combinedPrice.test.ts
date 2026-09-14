import { describe, expect, it } from 'vitest'
import { getCheapestQuotationId, getQuotationTotal } from './combinedPrice'
import type { ComparisonQuotationRow, ComparisonRequestItemRow } from './types'

const requestItems: ComparisonRequestItemRow[] = [
  { id: 'ri1', materialName: 'Argamassa', quantity: 20, unitOfMeasure: 'sc' },
  { id: 'ri2', materialName: 'Tintas', quantity: 5, unitOfMeasure: 'lt' },
]

const sika: ComparisonQuotationRow = {
  quotationId: 'q1',
  supplierName: 'Sika',
  freight: 50,
  paymentTerms: '30 dias',
  deliveryDays: 5,
  prices: [
    { requestItemId: 'ri1', quotationItemId: 'qi1', unitPrice: 30, leadTimeDays: 5 },
    { requestItemId: 'ri2', quotationItemId: 'qi2', unitPrice: 100, leadTimeDays: 5 },
  ],
}

const votorantim: ComparisonQuotationRow = {
  quotationId: 'q2',
  supplierName: 'Votorantim',
  freight: null,
  paymentTerms: null,
  deliveryDays: 7,
  prices: [
    { requestItemId: 'ri1', quotationItemId: 'qi3', unitPrice: 25, leadTimeDays: 7 },
    { requestItemId: 'ri2', quotationItemId: 'qi4', unitPrice: 120, leadTimeDays: 4 },
  ],
}

const partial: ComparisonQuotationRow = {
  quotationId: 'q3',
  supplierName: 'Gama',
  freight: 0,
  paymentTerms: null,
  deliveryDays: null,
  prices: [{ requestItemId: 'ri1', quotationItemId: 'qi5', unitPrice: 10, leadTimeDays: 5 }],
}

describe('getQuotationTotal', () => {
  it('soma preço unitário × quantidade de cada item, mais o frete', () => {
    // ri1: 20 * 30 = 600, ri2: 5 * 100 = 500, + frete 50 = 1150
    expect(getQuotationTotal(requestItems, sika)).toBe(1150)
  })

  it('trata frete nulo como zero', () => {
    // ri1: 20 * 25 = 500, ri2: 5 * 120 = 600, sem frete = 1100
    expect(getQuotationTotal(requestItems, votorantim)).toBe(1100)
  })

  it('retorna null quando o fornecedor não cotou todos os itens', () => {
    expect(getQuotationTotal(requestItems, partial)).toBeNull()
  })
})

describe('getCheapestQuotationId', () => {
  it('escolhe o fornecedor de menor total entre os que cotaram tudo', () => {
    expect(getCheapestQuotationId(requestItems, [sika, votorantim], [])).toBe('q2')
  })

  it('ignora fornecedores excluídos manualmente', () => {
    expect(getCheapestQuotationId(requestItems, [sika, votorantim], ['q2'])).toBe('q1')
  })

  it('ignora fornecedores que não cotaram todos os itens', () => {
    expect(getCheapestQuotationId(requestItems, [sika, partial], [])).toBe('q1')
  })

  it('retorna null quando nenhum fornecedor cotou todos os itens ou todos estão excluídos', () => {
    expect(getCheapestQuotationId(requestItems, [partial], [])).toBeNull()
    expect(getCheapestQuotationId(requestItems, [sika, votorantim], ['q1', 'q2'])).toBeNull()
  })
})
