import { describe, expect, it } from 'vitest'
import { getPendingWorkMessage } from './getPendingWorkMessage'

describe('getPendingWorkMessage', () => {
  it('retorna null quando não há dados pendentes', () => {
    expect(getPendingWorkMessage({ dueTodayCount: 0, awaitingQuoteCount: 0 })).toBeNull()
  })

  it('mostra só a frase de vencimento quando só há isso', () => {
    const result = getPendingWorkMessage({ dueTodayCount: 3, awaitingQuoteCount: 0 })
    expect(result).toEqual([{ text: '3 requisições vencem hoje', href: '/suprimentos/disparo-solicitacoes' }])
  })

  it('usa singular quando a contagem é 1', () => {
    const result = getPendingWorkMessage({ dueTodayCount: 1, awaitingQuoteCount: 0 })
    expect(result?.[0]?.text).toBe('1 requisição vence hoje')
  })

  it('mostra as duas frases quando ambas têm dados', () => {
    const result = getPendingWorkMessage({ dueTodayCount: 2, awaitingQuoteCount: 5 })
    expect(result).toEqual([
      { text: '2 requisições vencem hoje', href: '/suprimentos/disparo-solicitacoes' },
      { text: '5 aguardando cotação', href: '/suprimentos/em-negociacao' },
    ])
  })

  it('usa singular para aguardando cotação quando a contagem é 1', () => {
    const result = getPendingWorkMessage({ dueTodayCount: 0, awaitingQuoteCount: 1 })
    expect(result?.[0]?.text).toBe('1 aguardando cotação')
  })
})
