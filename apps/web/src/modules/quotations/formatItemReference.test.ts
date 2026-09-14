import { describe, expect, it } from 'vitest'
import { formatItemReference } from './formatItemReference'

describe('formatItemReference', () => {
  it('combina o número de exibição da requisição com a sequência do item', () => {
    expect(formatItemReference('1243', 0)).toBe('1243/001')
    expect(formatItemReference('1243', 1)).toBe('1243/002')
  })

  it('funciona igual com o número gerado (SOL {n}) no lugar do número externo', () => {
    expect(formatItemReference('SOL 42', 0)).toBe('SOL 42/001')
  })
})
