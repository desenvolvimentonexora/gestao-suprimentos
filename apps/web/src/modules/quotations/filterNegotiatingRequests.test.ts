import { describe, expect, it } from 'vitest'
import { filterNegotiatingRequests } from './filterNegotiatingRequests'
import type { NegotiatingRequestRow } from './types'

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

describe('filterNegotiatingRequests', () => {
  const requests: NegotiatingRequestRow[] = [
    makeRequest({ id: 'r1', unitId: 'u1', unitName: 'UP Graça', externalRef: 'SOL-1', negotiatorId: 'n1' }),
    makeRequest({ id: 'r2', unitId: 'u2', unitName: 'UP Barra', externalRef: 'SOL-2', negotiatorId: null }),
  ]

  it('retorna todas sem filtros', () => {
    expect(filterNegotiatingRequests(requests, { search: '', unitId: null, negotiatorFilter: null })).toHaveLength(2)
  })

  it('busca por nome da unidade', () => {
    const result = filterNegotiatingRequests(requests, { search: 'barra', unitId: null, negotiatorFilter: null })
    expect(result.map((r) => r.id)).toEqual(['r2'])
  })

  it('busca por número externo, sem diferenciar maiúsculas', () => {
    const result = filterNegotiatingRequests(requests, { search: 'sol-1', unitId: null, negotiatorFilter: null })
    expect(result.map((r) => r.id)).toEqual(['r1'])
  })

  it('filtra por unidade', () => {
    const result = filterNegotiatingRequests(requests, { search: '', unitId: 'u2', negotiatorFilter: null })
    expect(result.map((r) => r.id)).toEqual(['r2'])
  })

  it('filtra por negociador específico', () => {
    const result = filterNegotiatingRequests(requests, { search: '', unitId: null, negotiatorFilter: 'n1' })
    expect(result.map((r) => r.id)).toEqual(['r1'])
  })

  it('filtra por "sem responsável"', () => {
    const result = filterNegotiatingRequests(requests, { search: '', unitId: null, negotiatorFilter: 'unassigned' })
    expect(result.map((r) => r.id)).toEqual(['r2'])
  })
})
