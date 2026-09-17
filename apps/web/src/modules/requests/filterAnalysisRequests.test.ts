import { describe, expect, it } from 'vitest'
import { filterAnalysisRequests } from './filterAnalysisRequests'
import type { RequestItemRow, RequestRow } from './types'

function makeItem(overrides: Partial<RequestItemRow>): RequestItemRow {
  return {
    id: 'i1',
    materialId: 'm1',
    materialName: 'Cimento',
    materialCode: null,
    materialDescription: null,
    quantity: 10,
    unitOfMeasure: 'sc',
    statusCode: null,
    authorizedAt: null,
    pendente: false,
    motivoPendencia: null,
    ...overrides,
  }
}

function makeRequest(overrides: Partial<RequestRow>): RequestRow {
  return {
    id: 'r1',
    unitId: 'u1',
    unitName: 'UP Graça',
    status: 'pending_review',
    neededBy: '2026-09-20',
    externalRef: null,
    sequenceNumber: 42,
    createdAt: '2026-09-01T00:00:00Z',
    subjectCategory: null,
    notes: null,
    negotiatorId: null,
    negotiatorName: null,
    negotiatingStartedAt: null,
    dispatchBlockedReason: null,
    quotationsCount: 0,
    items: [makeItem({})],
    ...overrides,
  }
}

describe('filterAnalysisRequests', () => {
  const today = new Date('2026-09-15T12:00:00')

  it('só inclui SOLs nos status de análise (exclui negociação, cotada, disparo etc.)', () => {
    const requests: RequestRow[] = [
      makeRequest({ id: 'r1', status: 'pending_review' }),
      makeRequest({ id: 'r2', status: 'clarification_requested' }),
      makeRequest({ id: 'r3', status: 'extension_requested' }),
      makeRequest({ id: 'r4', status: 'released_to_dispatch' }),
      makeRequest({ id: 'r5', status: 'negotiating' }),
    ]
    const result = filterAnalysisRequests(requests, { search: '', unitId: null, tier: null, today })
    expect(result.map((r) => r.id)).toEqual(['r1', 'r2', 'r3'])
  })

  it('filtra por faixa de urgência (clique no card de indicador)', () => {
    const requests: RequestRow[] = [
      makeRequest({ id: 'r1', neededBy: '2026-09-16' }), // urgente
      makeRequest({ id: 'r2', neededBy: '2026-09-30' }), // tranquila
    ]
    const result = filterAnalysisRequests(requests, { search: '', unitId: null, tier: 'urgente', today })
    expect(result.map((r) => r.id)).toEqual(['r1'])
  })

  it('busca por número da SOL, centro ou material', () => {
    const requests: RequestRow[] = [
      makeRequest({ id: 'r1', unitName: 'Serralheria', items: [makeItem({ materialName: 'Porta' })] }),
      makeRequest({ id: 'r2', unitName: 'UP Graça', items: [makeItem({ materialName: 'Cimento' })] }),
    ]
    expect(
      filterAnalysisRequests(requests, { search: 'porta', unitId: null, tier: null, today }).map((r) => r.id),
    ).toEqual(['r1'])
    expect(
      filterAnalysisRequests(requests, { search: 'serralheria', unitId: null, tier: null, today }).map(
        (r) => r.id,
      ),
    ).toEqual(['r1'])
    expect(
      filterAnalysisRequests(requests, { search: 'sol 42', unitId: null, tier: null, today }).map((r) => r.id),
    ).toEqual(['r1', 'r2'])
  })
})
