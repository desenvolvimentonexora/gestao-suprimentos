import { describe, expect, it } from 'vitest'
import { filterNegotiatingRequests } from './filterNegotiatingRequests'
import type { NegotiatingRequestRow } from './types'

function makeRequest(overrides: Partial<NegotiatingRequestRow>): NegotiatingRequestRow {
  return {
    id: 'r1',
    unitName: 'UP Graça',
    neededBy: null,
    externalRef: null,
    items: [],
    quotations: [],
    ...overrides,
  }
}

describe('filterNegotiatingRequests', () => {
  const requests: NegotiatingRequestRow[] = [
    makeRequest({ id: 'r1', unitName: 'UP Graça', externalRef: 'SOL-1' }),
    makeRequest({ id: 'r2', unitName: 'UP Barra', externalRef: 'SOL-2' }),
  ]

  it('retorna todas sem busca', () => {
    expect(filterNegotiatingRequests(requests, '')).toHaveLength(2)
  })

  it('busca por nome da unidade', () => {
    expect(filterNegotiatingRequests(requests, 'barra').map((r) => r.id)).toEqual(['r2'])
  })

  it('busca por número externo, sem diferenciar maiúsculas', () => {
    expect(filterNegotiatingRequests(requests, 'sol-1').map((r) => r.id)).toEqual(['r1'])
  })
})
