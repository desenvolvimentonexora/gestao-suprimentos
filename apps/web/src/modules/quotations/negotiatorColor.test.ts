import { describe, expect, it } from 'vitest'
import { getNegotiatorColor } from './negotiatorColor'

describe('getNegotiatorColor', () => {
  it('retorna sempre a mesma cor para o mesmo id', () => {
    const first = getNegotiatorColor('n1')
    const second = getNegotiatorColor('n1')
    expect(first).toEqual(second)
  })

  it('retorna cores diferentes para ids diferentes (na maioria dos casos)', () => {
    const a = getNegotiatorColor('user-marcelo')
    const b = getNegotiatorColor('user-lucas')
    expect(a).not.toEqual(b)
  })

  it('retorna a cor cinza fixa para "unassigned"', () => {
    expect(getNegotiatorColor('unassigned')).toEqual(getNegotiatorColor(null))
  })

  it('retorna a cor cinza fixa para null', () => {
    const color = getNegotiatorColor(null)
    expect(color.chipSelected).toContain('ink-muted')
  })

  it('cada cor tem classes para chip selecionado, chip não selecionado e select', () => {
    const color = getNegotiatorColor('n1')
    expect(color.chipSelected).toBeTruthy()
    expect(color.chipUnselected).toBeTruthy()
    expect(color.select).toBeTruthy()
  })
})
