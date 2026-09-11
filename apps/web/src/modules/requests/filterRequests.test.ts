import { describe, expect, it } from 'vitest'
import { filterRequests } from './filterRequests'
import type { RequestRow } from './types'

function makeRequest(overrides: Partial<RequestRow>): RequestRow {
  return {
    id: 'r1',
    unitId: 'u1',
    unitName: 'UP Graça',
    status: 'open',
    neededBy: null,
    externalRef: null,
    createdAt: '2026-09-01T00:00:00Z',
    subjectCategory: null,
    notes: null,
    negotiatorId: null,
    negotiatorName: null,
    negotiatingStartedAt: null,
    items: [],
    ...overrides,
  }
}

describe('filterRequests', () => {
  const requests: RequestRow[] = [
    makeRequest({ id: 'r1', unitId: 'u1', unitName: 'UP Graça', status: 'open', externalRef: 'SOL-1' }),
    makeRequest({ id: 'r2', unitId: 'u2', unitName: 'UP Barra', status: 'negotiating', externalRef: 'SOL-2' }),
    makeRequest({ id: 'r3', unitId: 'u1', unitName: 'UP Graça', status: 'draft', externalRef: null }),
  ]

  it('retorna todas sem filtros', () => {
    expect(filterRequests(requests, { search: '', status: null, unitId: null })).toHaveLength(3)
  })

  it('filtra por status', () => {
    const result = filterRequests(requests, { search: '', status: 'negotiating', unitId: null })
    expect(result.map((r) => r.id)).toEqual(['r2'])
  })

  it('filtra por unidade', () => {
    const result = filterRequests(requests, { search: '', status: null, unitId: 'u2' })
    expect(result.map((r) => r.id)).toEqual(['r2'])
  })

  it('busca pelo número externo (SOL), sem diferenciar maiúsculas', () => {
    const result = filterRequests(requests, { search: 'sol-2', status: null, unitId: null })
    expect(result.map((r) => r.id)).toEqual(['r2'])
  })

  it('busca pelo nome da unidade', () => {
    const result = filterRequests(requests, { search: 'barra', status: null, unitId: null })
    expect(result.map((r) => r.id)).toEqual(['r2'])
  })
})
