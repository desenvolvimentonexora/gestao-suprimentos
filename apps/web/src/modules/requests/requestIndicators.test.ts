import { describe, expect, it } from 'vitest'
import { getRequestIndicators, isOverdue } from './requestIndicators'
import type { RequestRow } from './types'

function makeRequest(overrides: Partial<RequestRow>): RequestRow {
  return {
    id: 'r1',
    unitId: 'u1',
    unitName: 'UP Graça',
    status: 'draft',
    neededBy: null,
    externalRef: null,
    createdAt: '2026-09-01T00:00:00Z',
    subjectCategory: null,
    notes: null,
    negotiatorId: null,
    negotiatorName: null,
    negotiatingStartedAt: null,
    quotationsCount: 0,
    items: [],
    ...overrides,
  }
}

describe('getRequestIndicators', () => {
  it('conta pendentes (draft + open), enviadas (negotiating), concluídas (quoted) e o total ativas', () => {
    const requests: RequestRow[] = [
      makeRequest({ id: 'r1', status: 'draft' }),
      makeRequest({ id: 'r2', status: 'open' }),
      makeRequest({ id: 'r3', status: 'negotiating' }),
      makeRequest({ id: 'r4', status: 'quoted' }),
      makeRequest({ id: 'r5', status: 'cancelled' }),
    ]
    expect(getRequestIndicators(requests)).toEqual({
      ativas: 3,
      pendentes: 2,
      enviadas: 1,
      concluidas: 1,
    })
  })

  it('retorna zeros quando não há requisições', () => {
    expect(getRequestIndicators([])).toEqual({ ativas: 0, pendentes: 0, enviadas: 0, concluidas: 0 })
  })
})

describe('isOverdue', () => {
  const today = new Date('2026-09-11T12:00:00')

  it('é atrasada quando o prazo já passou e o status ainda está em aberto', () => {
    const request = makeRequest({ neededBy: '2026-09-10', status: 'negotiating' })
    expect(isOverdue(request, today)).toBe(true)
  })

  it('não é atrasada quando o prazo é hoje', () => {
    const request = makeRequest({ neededBy: '2026-09-11', status: 'negotiating' })
    expect(isOverdue(request, today)).toBe(false)
  })

  it('não é atrasada quando não há prazo definido', () => {
    const request = makeRequest({ neededBy: null, status: 'negotiating' })
    expect(isOverdue(request, today)).toBe(false)
  })

  it('não é atrasada quando já está concluída ou cancelada, mesmo com prazo vencido', () => {
    expect(isOverdue(makeRequest({ neededBy: '2026-09-01', status: 'quoted' }), today)).toBe(false)
    expect(isOverdue(makeRequest({ neededBy: '2026-09-01', status: 'cancelled' }), today)).toBe(false)
  })
})
