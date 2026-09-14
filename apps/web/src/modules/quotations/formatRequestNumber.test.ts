import { describe, expect, it } from 'vitest'
import { formatRequestNumber } from './formatRequestNumber'

describe('formatRequestNumber', () => {
  it('usa o número externo quando existe', () => {
    expect(formatRequestNumber('1243', 42)).toBe('1243')
  })

  it('usa "SOL {sequência}" quando não há número externo', () => {
    expect(formatRequestNumber(null, 42)).toBe('SOL 42')
  })

  it('nunca retorna um identificador vazio, mesmo sem número externo nem sequência', () => {
    expect(formatRequestNumber(null, null)).toBe('—')
  })
})
