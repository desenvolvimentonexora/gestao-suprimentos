import { describe, expect, it } from 'vitest'
import { suggestOrderNumber } from './suggestOrderNumber'

describe('suggestOrderNumber', () => {
  it('formata o número sequencial com prefixo e zeros à esquerda', () => {
    expect(suggestOrderNumber(1)).toBe('PED-0001')
  })

  it('não trunca quando o sequencial passa de 4 dígitos', () => {
    expect(suggestOrderNumber(12345)).toBe('PED-12345')
  })
})
