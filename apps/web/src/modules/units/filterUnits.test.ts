import { describe, expect, it } from 'vitest'
import { filterUnits } from './filterUnits'
import type { UnitRow } from './types'

function makeUnit(overrides: Partial<UnitRow>): UnitRow {
  return {
    id: 'u1',
    name: 'UP Graça',
    cnpj: null,
    zipCode: null,
    street: null,
    number: null,
    neighborhood: null,
    city: 'Salvador',
    state: 'BA',
    type: 'obra',
    status: 'active',
    startDate: null,
    endDate: null,
    engineerName: null,
    engineerPhone: null,
    engineerEmail: null,
    adminName: null,
    adminPhone: null,
    adminEmail: null,
    ...overrides,
  }
}

describe('filterUnits', () => {
  const units: UnitRow[] = [
    makeUnit({ id: 'u1', name: 'UP Graça', type: 'obra', status: 'active' }),
    makeUnit({ id: 'u2', name: 'UP Barra', type: 'obra', status: 'completed' }),
    makeUnit({ id: 'u3', name: 'Escritório Central', type: 'escritorio', status: 'active' }),
  ]

  it('retorna todas as unidades sem filtros', () => {
    expect(filterUnits(units, { search: '', status: null, type: null })).toHaveLength(3)
  })

  it('filtra por nome, sem diferenciar maiúsculas de minúsculas', () => {
    const result = filterUnits(units, { search: 'graça', status: null, type: null })
    expect(result.map((u) => u.id)).toEqual(['u1'])
  })

  it('filtra por status', () => {
    const result = filterUnits(units, { search: '', status: 'completed', type: null })
    expect(result.map((u) => u.id)).toEqual(['u2'])
  })

  it('filtra por tipo', () => {
    const result = filterUnits(units, { search: '', status: null, type: 'escritorio' })
    expect(result.map((u) => u.id)).toEqual(['u3'])
  })

  it('combina busca, status e tipo', () => {
    const result = filterUnits(units, { search: 'up', status: 'active', type: 'obra' })
    expect(result.map((u) => u.id)).toEqual(['u1'])
  })
})
