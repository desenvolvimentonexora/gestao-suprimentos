import { describe, expect, it } from 'vitest'
import { mapAuthErrorMessage } from './mapAuthErrorMessage'

describe('mapAuthErrorMessage', () => {
  it('retorna null quando não há erro', () => {
    expect(mapAuthErrorMessage(null)).toBeNull()
  })

  it('traduz credenciais inválidas para uma mensagem clara em pt-BR', () => {
    expect(mapAuthErrorMessage({ message: 'Invalid login credentials' })).toBe(
      'E-mail ou senha incorretos.',
    )
  })

  it('usa uma mensagem genérica para erros não mapeados', () => {
    expect(mapAuthErrorMessage({ message: 'Something exploded' })).toBe(
      'Não foi possível entrar. Tente novamente em instantes.',
    )
  })
})
