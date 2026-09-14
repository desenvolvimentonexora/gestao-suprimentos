import { describe, expect, it } from 'vitest'
import { getCategoryColor } from './categoryColor'

describe('getCategoryColor', () => {
  it('retorna a mesma cor para o mesmo id de categoria', () => {
    const first = getCategoryColor('cat-engenharia')
    const second = getCategoryColor('cat-engenharia')
    expect(first).toEqual(second)
  })

  it('retorna cores diferentes para categorias diferentes', () => {
    const engenharia = getCategoryColor('cat-engenharia')
    const rh = getCategoryColor('cat-rh')
    expect(engenharia.itemBg).not.toBe(rh.itemBg)
  })

  it('expõe uma classe de fundo pastel', () => {
    const color = getCategoryColor('cat-engenharia')
    expect(color.itemBg).toContain('bg-')
  })
})
