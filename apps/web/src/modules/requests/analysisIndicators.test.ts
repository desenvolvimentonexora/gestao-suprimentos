import { describe, expect, it } from 'vitest'
import { getAnalysisIndicators } from './analysisIndicators'
import type { RequestRow } from './types'

function makeRequest(overrides: Partial<RequestRow>): RequestRow {
  return {
    id: 'r1',
    unitId: 'u1',
    unitName: 'UP Graça',
    status: 'pending_review',
    neededBy: null,
    externalRef: null,
    sequenceNumber: 1,
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

describe('getAnalysisIndicators', () => {
  const today = new Date('2026-09-15T12:00:00')

  it('distribui as SOLs nas 5 faixas', () => {
    const requests: RequestRow[] = [
      makeRequest({ id: 'r1', neededBy: '2026-09-16' }), // urgente
      makeRequest({ id: 'r2', neededBy: '2026-09-20' }), // atenção
      makeRequest({ id: 'r3', neededBy: '2026-09-30' }), // tranquila
      makeRequest({ id: 'r4', neededBy: null }), // ag. aprovação
    ]
    expect(getAnalysisIndicators(requests, today)).toEqual({
      total: 4,
      urgentes: 1,
      atencao: 1,
      tranquilas: 1,
      agAprovacao: 1,
    })
  })

  it('retorna zeros quando não há requisições em análise', () => {
    expect(getAnalysisIndicators([], today)).toEqual({
      total: 0,
      urgentes: 0,
      atencao: 0,
      tranquilas: 0,
      agAprovacao: 0,
    })
  })
})
