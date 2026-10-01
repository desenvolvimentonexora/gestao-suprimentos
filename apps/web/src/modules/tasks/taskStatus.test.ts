import { describe, expect, it } from 'vitest'
import { getNextStatus, getPreviousStatus } from './taskStatus'

describe('getPreviousStatus', () => {
  it('retorna null para a primeira coluna', () => {
    expect(getPreviousStatus('a_fazer')).toBeNull()
  })

  it('retorna a coluna anterior para as demais', () => {
    expect(getPreviousStatus('fazendo')).toBe('a_fazer')
    expect(getPreviousStatus('feito')).toBe('fazendo')
  })
})

describe('getNextStatus', () => {
  it('retorna null para a última coluna', () => {
    expect(getNextStatus('feito')).toBeNull()
  })

  it('retorna a próxima coluna para as demais', () => {
    expect(getNextStatus('a_fazer')).toBe('fazendo')
    expect(getNextStatus('fazendo')).toBe('feito')
  })
})
