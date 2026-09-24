import { describe, expect, it } from 'vitest'
import { groupMaterialsByCategory } from './groupMaterialsByCategory'
import type { MaterialWithSupplierCount } from './types'

function makeMaterial(overrides: Partial<MaterialWithSupplierCount>): MaterialWithSupplierCount {
  return {
    id: 'm1',
    name: 'Aço',
    code: '3050',
    categoryId: 'c1',
    categoryName: 'Ferramentas',
    supplierCount: 1,
    supplierIds: ['s1'],
    ...overrides,
  }
}

describe('groupMaterialsByCategory', () => {
  it('agrupa materiais pela categoria', () => {
    const groups = groupMaterialsByCategory([
      makeMaterial({ id: 'm1', categoryId: 'c1', categoryName: 'Ferramentas' }),
      makeMaterial({ id: 'm2', categoryId: 'c1', categoryName: 'Ferramentas', name: 'Furadeira' }),
      makeMaterial({ id: 'm3', categoryId: 'c2', categoryName: 'EPI', name: 'Capacete' }),
    ])

    expect(groups).toHaveLength(2)
    expect(groups.map((g) => g.categoryName)).toEqual(['EPI', 'Ferramentas'])
    expect(groups.find((g) => g.categoryName === 'Ferramentas')?.materials).toHaveLength(2)
  })

  it('conta fornecedores distintos por categoria, sem duplicar quem atende mais de um material dela', () => {
    const groups = groupMaterialsByCategory([
      makeMaterial({ id: 'm1', supplierIds: ['s1', 's2'] }),
      makeMaterial({ id: 'm2', name: 'Furadeira', supplierIds: ['s2', 's3'] }),
    ])

    expect(groups[0]?.supplierCount).toBe(3)
  })

  it('ordena os materiais dentro da categoria por nome', () => {
    const groups = groupMaterialsByCategory([
      makeMaterial({ id: 'm1', name: 'Serra' }),
      makeMaterial({ id: 'm2', name: 'Furadeira' }),
    ])

    expect(groups[0]?.materials.map((m) => m.name)).toEqual(['Furadeira', 'Serra'])
  })
})
