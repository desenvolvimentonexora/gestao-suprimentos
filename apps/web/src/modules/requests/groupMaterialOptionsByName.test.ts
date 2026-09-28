import { describe, expect, it } from 'vitest'
import { groupMaterialOptionsByName } from './groupMaterialOptionsByName'
import type { MaterialOption } from './types'

describe('groupMaterialOptionsByName', () => {
  it('agrupa variantes que compartilham o mesmo material genérico', () => {
    const materials: MaterialOption[] = [
      { id: 'v5', materialName: 'Abraçadeira Tipo U', code: '027818-005', description: 'ABRAÇADEIRA "U" 5"' },
      { id: 'v6', materialName: 'Abraçadeira Tipo U', code: '027818-006', description: 'ABRAÇADEIRA "U" 6"' },
      { id: 'areia', materialName: 'Areia', code: null, description: null },
    ]

    const groups = groupMaterialOptionsByName(materials)

    expect(groups).toHaveLength(2)
    const abracadeira = groups.find((g) => g.materialName === 'Abraçadeira Tipo U')
    expect(abracadeira?.options.map((o) => o.id)).toEqual(['v5', 'v6'])
  })

  it('ordena os grupos por nome do material', () => {
    const materials: MaterialOption[] = [
      { id: '1', materialName: 'Zinco', code: null, description: null },
      { id: '2', materialName: 'Argamassa', code: null, description: null },
    ]
    const groups = groupMaterialOptionsByName(materials)
    expect(groups.map((g) => g.materialName)).toEqual(['Argamassa', 'Zinco'])
  })

  it('devolve lista vazia quando não há materiais', () => {
    expect(groupMaterialOptionsByName([])).toEqual([])
  })
})
