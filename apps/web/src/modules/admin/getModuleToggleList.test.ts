import { describe, expect, it } from 'vitest'
import { getModuleToggleList } from './getModuleToggleList'

describe('getModuleToggleList', () => {
  it('marca como implementado só o módulo que tem rota de verdade', () => {
    const list = getModuleToggleList([])
    const withScreen = list.find((item) => item.id === 'agenda-fornecedores')
    const placeholder = list.find((item) => item.id === 'cobrador-entregas')

    expect(withScreen?.implemented).toBe(true)
    expect(placeholder?.implemented).toBe(false)
  })

  it('marca como ativo um módulo implementado presente na lista de módulos ativos', () => {
    const list = getModuleToggleList(['agenda-fornecedores'])
    expect(list.find((item) => item.id === 'agenda-fornecedores')?.active).toBe(true)
    expect(list.find((item) => item.id === 'em-negociacao')?.active).toBe(false)
  })

  it('nunca marca como ativo um módulo que ainda não foi implementado, mesmo que venha na lista salva', () => {
    const list = getModuleToggleList(['cobrador-entregas'])
    expect(list.find((item) => item.id === 'cobrador-entregas')?.active).toBe(false)
  })
})
