import { describe, expect, it } from 'vitest'
import { formatSolNumber } from './formatSolNumber'

describe('formatSolNumber', () => {
  it('usa o número externo (do ERP) quando presente', () => {
    expect(formatSolNumber('25115', 3)).toBe('25115')
  })

  it('usa "SOL {sequencial}" quando não há número externo', () => {
    expect(formatSolNumber(null, 3)).toBe('SOL 3')
  })

  it('retorna travessão quando não há nenhuma das duas referências', () => {
    expect(formatSolNumber(null, null)).toBe('—')
  })
})
