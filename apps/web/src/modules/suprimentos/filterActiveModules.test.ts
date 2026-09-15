import { describe, expect, it } from 'vitest'
import { filterActiveModules } from './filterActiveModules'
import type { ModuleCardData } from '../registry'

const items: ModuleCardData[] = [
  { id: 'a', label: 'A', description: '', icon: (() => null) as never, status: 'disponivel', route: '/a' },
  { id: 'b', label: 'B', description: '', icon: (() => null) as never, status: 'disponivel', route: '/b' },
  { id: 'c', label: 'C', description: '', icon: (() => null) as never, status: 'beta' },
]

describe('filterActiveModules', () => {
  it('mantém um módulo com rota só se o id estiver na lista de módulos ativos', () => {
    const result = filterActiveModules(items, ['a'])
    expect(result.map((item) => item.id)).toEqual(['a', 'c'])
  })

  it('sempre mantém módulos sem rota (ainda não implementados), independente da lista ativa', () => {
    const result = filterActiveModules(items, [])
    expect(result.map((item) => item.id)).toEqual(['c'])
  })

  it('mostra todos os módulos com rota quando todos estão na lista ativa', () => {
    const result = filterActiveModules(items, ['a', 'b'])
    expect(result.map((item) => item.id)).toEqual(['a', 'b', 'c'])
  })
})
