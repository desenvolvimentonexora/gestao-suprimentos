import { describe, expect, it } from 'vitest'
import { getGreeting } from './getGreeting'

describe('getGreeting', () => {
  it('usa "Bom dia" antes do meio-dia', () => {
    expect(getGreeting('Marcelo Souza', new Date('2026-09-08T09:00:00'))).toBe(
      'Bom dia, Marcelo 👋',
    )
  })

  it('usa "Boa tarde" entre meio-dia e 18h', () => {
    expect(getGreeting('Marcelo Souza', new Date('2026-09-08T14:00:00'))).toBe(
      'Boa tarde, Marcelo 👋',
    )
  })

  it('usa "Boa noite" a partir das 18h', () => {
    expect(getGreeting('Marcelo Souza', new Date('2026-09-08T19:00:00'))).toBe(
      'Boa noite, Marcelo 👋',
    )
  })

  it('usa apenas o primeiro nome', () => {
    expect(getGreeting('Ana Paula Lima', new Date('2026-09-08T09:00:00'))).toBe(
      'Bom dia, Ana 👋',
    )
  })
})
