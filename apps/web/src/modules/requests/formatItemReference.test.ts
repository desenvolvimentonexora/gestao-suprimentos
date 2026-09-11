import { describe, expect, it } from 'vitest'
import { formatItemReference } from './formatItemReference'

describe('formatItemReference', () => {
  it('combina o número externo da requisição com a sequência do item', () => {
    expect(formatItemReference('1243', 'req-id', 0)).toBe('1243/001')
    expect(formatItemReference('1243', 'req-id', 1)).toBe('1243/002')
  })

  it('usa o id da requisição quando não há número externo', () => {
    expect(formatItemReference(null, 'req-id', 0)).toBe('req-id/001')
  })
})
