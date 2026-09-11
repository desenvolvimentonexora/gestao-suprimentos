import { describe, expect, it } from 'vitest'
import { getCombinedBestPrice, suggestCheapestWinners } from './combinedPrice'
import type { ComparisonQuotationRow, ComparisonRequestItemRow, ComparisonWinner } from './types'

const requestItems: ComparisonRequestItemRow[] = [
  { id: 'ri1', materialName: 'Argamassa', quantity: 20, unitOfMeasure: 'sc' },
  { id: 'ri2', materialName: 'Tintas', quantity: 5, unitOfMeasure: 'lt' },
]

const quotations: ComparisonQuotationRow[] = [
  {
    quotationId: 'q1',
    supplierName: 'Sika',
    prices: [
      { requestItemId: 'ri1', quotationItemId: 'qi1', unitPrice: 30, leadTimeDays: 5 },
      { requestItemId: 'ri2', quotationItemId: 'qi2', unitPrice: 100, leadTimeDays: 5 },
    ],
  },
  {
    quotationId: 'q2',
    supplierName: 'Votorantim',
    prices: [
      { requestItemId: 'ri1', quotationItemId: 'qi3', unitPrice: 25, leadTimeDays: 7 },
      { requestItemId: 'ri2', quotationItemId: 'qi4', unitPrice: 120, leadTimeDays: 4 },
    ],
  },
]

describe('suggestCheapestWinners', () => {
  it('sugere o vencedor de menor preço por item, mesmo que sejam fornecedores diferentes', () => {
    const winners = suggestCheapestWinners(requestItems, quotations)
    expect(winners).toEqual([
      { requestItemId: 'ri1', quotationItemId: 'qi3' },
      { requestItemId: 'ri2', quotationItemId: 'qi2' },
    ])
  })
})

describe('getCombinedBestPrice', () => {
  it('soma o preço do vencedor de cada item multiplicado pela quantidade', () => {
    const winners: ComparisonWinner[] = [
      { requestItemId: 'ri1', quotationItemId: 'qi3' },
      { requestItemId: 'ri2', quotationItemId: 'qi2' },
    ]
    // ri1: 20 * 25 (Votorantim) + ri2: 5 * 100 (Sika) = 500 + 500 = 1000
    expect(getCombinedBestPrice(requestItems, quotations, winners)).toBe(1000)
  })

  it('retorna null quando nem todos os itens têm vencedor definido', () => {
    const winners: ComparisonWinner[] = [{ requestItemId: 'ri1', quotationItemId: 'qi3' }]
    expect(getCombinedBestPrice(requestItems, quotations, winners)).toBeNull()
  })
})
