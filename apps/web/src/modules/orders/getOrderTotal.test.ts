import { describe, expect, it } from 'vitest'
import { getOrderTotal } from './getOrderTotal'

describe('getOrderTotal', () => {
  it('soma quantidade vezes preço unitário de cada item', () => {
    const total = getOrderTotal([
      { quantity: 2, unitPrice: 10 },
      { quantity: 3, unitPrice: 5 },
    ])
    expect(total).toBe(35)
  })

  it('retorna 0 quando não há itens', () => {
    expect(getOrderTotal([])).toBe(0)
  })
})
