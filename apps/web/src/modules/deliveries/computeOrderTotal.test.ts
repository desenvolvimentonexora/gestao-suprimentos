import { describe, expect, it } from 'vitest'
import { computeOrderTotal } from './computeOrderTotal'

describe('computeOrderTotal', () => {
  it('soma quantidade × valor unitário de cada item', () => {
    expect(
      computeOrderTotal([
        { quantity: 2, unitPrice: 10 },
        { quantity: 3, unitPrice: 5 },
      ]),
    ).toBe(35)
  })

  it('retorna 0 para lista vazia', () => {
    expect(computeOrderTotal([])).toBe(0)
  })
})
