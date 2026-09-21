import { describe, expect, it } from 'vitest'
import { countReceivedQuotations, getDaysInNegotiation, isReadyToEqualize } from './negotiationStatus'
import type { NegotiatingRequestRow } from './types'

function makeRequest(overrides: Partial<NegotiatingRequestRow>): NegotiatingRequestRow {
  return {
    id: 'r1',
    unitId: 'u1',
    unitName: 'UP Graça',
    neededBy: null,
    neededByChanged: false,
    externalRef: null,
    sequenceNumber: 1,
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

function receivedQuotation(id: string): NegotiatingRequestRow['quotations'][number] {
  return { id, supplierId: `s-${id}`, supplierName: `Fornecedor ${id}`, status: 'received', submittedAt: null }
}

describe('countReceivedQuotations', () => {
  it('conta só as cotações com status recebida', () => {
    const request = makeRequest({
      quotations: [
        receivedQuotation('q1'),
        receivedQuotation('q2'),
        { id: 'q3', supplierId: 's3', supplierName: 'Fornecedor Gama', status: 'pending', submittedAt: null },
      ],
    })
    expect(countReceivedQuotations(request)).toBe(2)
  })
})

describe('isReadyToEqualize', () => {
  it('é true quando há 3 cotações recebidas', () => {
    const request = makeRequest({
      quotations: [receivedQuotation('q1'), receivedQuotation('q2'), receivedQuotation('q3')],
    })
    expect(isReadyToEqualize(request)).toBe(true)
  })

  it('é false quando há menos de 3 cotações recebidas', () => {
    const request = makeRequest({
      quotations: [receivedQuotation('q1'), receivedQuotation('q2')],
    })
    expect(isReadyToEqualize(request)).toBe(false)
  })

  it('é false quando não há nenhuma cotação recebida', () => {
    const request = makeRequest({
      quotations: [
        { id: 'q1', supplierId: 's1', supplierName: 'Fornecedor Alfa', status: 'pending', submittedAt: null },
      ],
    })
    expect(isReadyToEqualize(request)).toBe(false)
  })

  it('é false quando não há cotações', () => {
    expect(isReadyToEqualize(makeRequest({ quotations: [] }))).toBe(false)
  })
})

describe('getDaysInNegotiation', () => {
  const today = new Date('2026-09-11T12:00:00')

  it('calcula os dias desde que entrou em negociação', () => {
    expect(getDaysInNegotiation('2026-09-08T09:00:00Z', today)).toBe(3)
  })

  it('retorna null quando não há marca de início de negociação', () => {
    expect(getDaysInNegotiation(null, today)).toBeNull()
  })
})
