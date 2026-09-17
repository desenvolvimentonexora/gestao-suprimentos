import { describe, expect, it } from 'vitest'
import { getUrgencyTier } from './getUrgencyTier'

describe('getUrgencyTier', () => {
  const today = new Date('2026-09-15T12:00:00')

  it('é "ag_aprovacao" quando não há data de entrega definida', () => {
    expect(getUrgencyTier(null, today)).toEqual({ tier: 'ag_aprovacao', label: 'Ag. Aprovação' })
  })

  it('é "urgente" com 3 dias ou menos, incluindo atraso', () => {
    expect(getUrgencyTier('2026-09-18', today)).toEqual({ tier: 'urgente', label: '3 dias' })
    expect(getUrgencyTier('2026-09-10', today)).toEqual({ tier: 'urgente', label: '-5 dias' })
  })

  it('é "atencao" entre 4 e 7 dias', () => {
    expect(getUrgencyTier('2026-09-19', today)).toEqual({ tier: 'atencao', label: '4 dias' })
    expect(getUrgencyTier('2026-09-22', today)).toEqual({ tier: 'atencao', label: '7 dias' })
  })

  it('é "tranquila" com mais de 7 dias', () => {
    expect(getUrgencyTier('2026-09-23', today)).toEqual({ tier: 'tranquila', label: '8 dias' })
  })
})
