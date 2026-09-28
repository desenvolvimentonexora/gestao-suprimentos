import { describe, expect, it } from 'vitest'
import { buildMaterialLookup } from './buildMaterialLookup'
import type { MaterialOption } from './types'

describe('buildMaterialLookup', () => {
  it('casa por código exato, sem diferenciar maiúsculas/minúsculas ou espaços nas pontas', () => {
    const lookup = buildMaterialLookup([
      { id: 'm1', materialName: 'Cimento', code: '1023', description: null },
    ])
    expect(lookup.findByCode('1023')).toBe('m1')
    expect(lookup.findByCode(' 1023 ')).toBe('m1')
    expect(lookup.findByCode('nao-existe')).toBeNull()
  })

  it('casa por nome quando só uma variante usa esse nome', () => {
    const lookup = buildMaterialLookup([{ id: 'm1', materialName: 'Areia', code: null, description: null }])
    expect(lookup.findByName('Areia')).toBe('m1')
    expect(lookup.findByName('areia')).toBe('m1')
  })

  it('NÃO casa por nome quando duas variantes do mesmo material compartilham o nome — material é uma categoria, o insumo real é a variante (código)', () => {
    const materials: MaterialOption[] = [
      { id: 'v5', materialName: 'Abraçadeira Tipo U', code: '027818-005', description: 'ABRAÇADEIRA "U" 5"' },
      { id: 'v6', materialName: 'Abraçadeira Tipo U', code: '027818-006', description: 'ABRAÇADEIRA "U" 6"' },
    ]
    const lookup = buildMaterialLookup(materials)

    expect(lookup.findByName('Abraçadeira Tipo U')).toBeNull()
    expect(lookup.findByCode('027818-005')).toBe('v5')
    expect(lookup.findByCode('027818-006')).toBe('v6')
  })

  it('casa por descrição da variante quando é única, mesmo com material/categoria compartilhada', () => {
    const materials: MaterialOption[] = [
      { id: 'v5', materialName: 'Abraçadeira Tipo U', code: '027818-005', description: 'ABRAÇADEIRA "U" 5"' },
      { id: 'v6', materialName: 'Abraçadeira Tipo U', code: '027818-006', description: 'ABRAÇADEIRA "U" 6"' },
    ]
    const lookup = buildMaterialLookup(materials)

    expect(lookup.findByDescription('ABRAÇADEIRA "U" 5"')).toBe('v5')
    expect(lookup.findByDescription('ABRAÇADEIRA "U" 6"')).toBe('v6')
  })

  it('não quebra com material sem código nem descrição', () => {
    const lookup = buildMaterialLookup([{ id: 'm1', materialName: 'Diversos', code: null, description: null }])
    expect(lookup.findByCode('qualquer')).toBeNull()
    expect(lookup.findByDescription('qualquer')).toBeNull()
    expect(lookup.findByName('Diversos')).toBe('m1')
  })
})
