import { describe, expect, it } from 'vitest'
import { filterMaterials } from './filterMaterials'
import type { MaterialRow } from './types'

const materials: MaterialRow[] = [
  { id: 'm1', name: 'Cimento', categoryId: 'c1', supplierCount: 3 },
  { id: 'm2', name: 'Cabo elétrico', categoryId: 'c2', supplierCount: 1 },
  { id: 'm3', name: 'Cimento branco', categoryId: 'c1', supplierCount: 0 },
]

describe('filterMaterials', () => {
  it('retorna todos quando não há filtro', () => {
    expect(filterMaterials(materials, { categoryId: null, search: '' })).toHaveLength(3)
  })

  it('filtra por categoria', () => {
    const result = filterMaterials(materials, { categoryId: 'c1', search: '' })
    expect(result.map((m) => m.id)).toEqual(['m1', 'm3'])
  })

  it('filtra por busca no nome, sem diferenciar maiúsculas/minúsculas', () => {
    const result = filterMaterials(materials, { categoryId: null, search: 'CIMENTO' })
    expect(result.map((m) => m.id)).toEqual(['m1', 'm3'])
  })

  it('combina categoria e busca', () => {
    const result = filterMaterials(materials, { categoryId: 'c1', search: 'branco' })
    expect(result.map((m) => m.id)).toEqual(['m3'])
  })
})
