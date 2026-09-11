import { describe, expect, it } from 'vitest'
import { getNegotiatorCounts } from './getNegotiatorCounts'
import type { NegotiatingRequestRow, NegotiatorOption } from './types'

function makeRequest(overrides: Partial<NegotiatingRequestRow>): NegotiatingRequestRow {
  return {
    id: 'r1',
    unitId: 'u1',
    unitName: 'UP Graça',
    neededBy: null,
    externalRef: null,
    createdAt: '2026-09-01T00:00:00Z',
    notes: null,
    negotiatorId: null,
    negotiatorName: null,
    negotiatingStartedAt: null,
    items: [],
    quotations: [],
    ...overrides,
  }
}

const negotiators: NegotiatorOption[] = [
  { id: 'n1', name: 'Lucas' },
  { id: 'n2', name: 'Tais' },
]

describe('getNegotiatorCounts', () => {
  it('conta quantas requisições cada negociador tem, incluindo "Sem resp."', () => {
    const requests: NegotiatingRequestRow[] = [
      makeRequest({ id: 'r1', negotiatorId: 'n1' }),
      makeRequest({ id: 'r2', negotiatorId: 'n1' }),
      makeRequest({ id: 'r3', negotiatorId: 'n2' }),
      makeRequest({ id: 'r4', negotiatorId: null }),
    ]
    expect(getNegotiatorCounts(requests, negotiators)).toEqual([
      { id: 'n1', name: 'Lucas', count: 2 },
      { id: 'n2', name: 'Tais', count: 1 },
      { id: 'unassigned', name: 'Sem resp.', count: 1 },
    ])
  })

  it('mostra contagem zero para negociador sem nenhuma requisição', () => {
    const requests: NegotiatingRequestRow[] = [makeRequest({ id: 'r1', negotiatorId: 'n1' })]
    expect(getNegotiatorCounts(requests, negotiators)).toEqual([
      { id: 'n1', name: 'Lucas', count: 1 },
      { id: 'n2', name: 'Tais', count: 0 },
      { id: 'unassigned', name: 'Sem resp.', count: 0 },
    ])
  })
})
