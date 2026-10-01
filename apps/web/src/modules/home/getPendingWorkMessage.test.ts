import { describe, expect, it } from 'vitest'
import { getPendingWorkMessage } from './getPendingWorkMessage'

describe('getPendingWorkMessage', () => {
  it('retorna null quando não há dados pendentes', () => {
    expect(getPendingWorkMessage({ dueTodayCount: 0 })).toBeNull()
  })

  it('mostra a frase de vencimento quando há dados', () => {
    const result = getPendingWorkMessage({ dueTodayCount: 3 })
    expect(result).toEqual([{ text: '3 requisições vencem hoje', href: '/suprimentos/disparo-solicitacoes' }])
  })

  it('usa singular quando a contagem é 1', () => {
    const result = getPendingWorkMessage({ dueTodayCount: 1 })
    expect(result?.[0]?.text).toBe('1 requisição vence hoje')
  })
})
