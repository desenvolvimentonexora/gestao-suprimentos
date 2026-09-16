import { describe, expect, it } from 'vitest'
import { summarizeWinners } from './summarizeWinners'

describe('summarizeWinners', () => {
  it('soma o valor total (quantidade × preço unitário) de todas as linhas vencedoras', () => {
    const summary = summarizeWinners([
      { quantity: 2, unitPrice: 10, supplierId: 's1' },
      { quantity: 3, unitPrice: 5, supplierId: 's1' },
    ])
    expect(summary.totalValue).toBe(35)
  })

  it('conta uma linha por item vencedor', () => {
    const summary = summarizeWinners([
      { quantity: 2, unitPrice: 10, supplierId: 's1' },
      { quantity: 3, unitPrice: 5, supplierId: 's2' },
    ])
    expect(summary.itemCount).toBe(2)
  })

  it('conta fornecedores distintos entre os vencedores', () => {
    const summary = summarizeWinners([
      { quantity: 1, unitPrice: 10, supplierId: 's1' },
      { quantity: 1, unitPrice: 10, supplierId: 's1' },
      { quantity: 1, unitPrice: 10, supplierId: 's2' },
    ])
    expect(summary.supplierCount).toBe(2)
  })

  it('retorna zeros para uma comparação sem vencedores definidos', () => {
    expect(summarizeWinners([])).toEqual({ totalValue: 0, itemCount: 0, supplierCount: 0 })
  })
})
