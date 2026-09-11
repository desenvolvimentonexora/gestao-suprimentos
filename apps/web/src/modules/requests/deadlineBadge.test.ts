import { describe, expect, it } from 'vitest'
import { getDeadlineBadge } from './deadlineBadge'

describe('getDeadlineBadge', () => {
  const today = new Date('2026-09-15T12:00:00')

  it('retorna null quando não há prazo definido', () => {
    expect(getDeadlineBadge(null, today)).toBeNull()
  })

  it('mostra dias restantes quando o prazo ainda não venceu', () => {
    expect(getDeadlineBadge('2026-09-18', today)).toEqual({ label: '3 dias restantes', tone: 'restante' })
  })

  it('mostra 0 dias restantes quando o prazo é hoje', () => {
    expect(getDeadlineBadge('2026-09-15', today)).toEqual({ label: '0 dias restantes', tone: 'restante' })
  })

  it('mostra dias atrasada quando o prazo já venceu', () => {
    expect(getDeadlineBadge('2026-09-10', today)).toEqual({ label: '5 dias atrasada', tone: 'atrasada' })
  })
})
