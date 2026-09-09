import { describe, expect, it } from 'vitest'
import { formatCurrency, formatDate, formatLongDate } from './formatters'

describe('formatDate', () => {
  it('formata a data no padrão pt-BR (dd/mm/aaaa)', () => {
    expect(formatDate(new Date('2026-09-08T12:00:00Z'))).toMatch(/^\d{2}\/\d{2}\/\d{4}$/)
  })
})

describe('formatLongDate', () => {
  it('formata a data por extenso em pt-BR', () => {
    expect(formatLongDate(new Date('2026-09-08T12:00:00Z'))).toMatch(
      /^[a-zç]+-feira, \d{1,2} de [a-zç]+ de \d{4}$/,
    )
  })
})

describe('formatCurrency', () => {
  it('formata valores em real com o símbolo e separadores pt-BR', () => {
    expect(formatCurrency(1234.5, 'BRL')).toMatch(/R\$\s?1\.234,50/)
  })

  it('respeita a moeda configurada pelo cliente', () => {
    expect(formatCurrency(10, 'USD')).toMatch(/US\$\s?10,00/)
  })
})
