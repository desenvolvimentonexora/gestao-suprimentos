import { describe, expect, it } from 'vitest'
import { validateReschedule } from './validateReschedule'

describe('validateReschedule', () => {
  it('exige a nova data', () => {
    expect(validateReschedule({ newDate: '', reason: '' }, '2026-09-20')).toBe(
      'Informe a nova data de entrega.',
    )
  })

  it('rejeita quando a nova data é igual à atual', () => {
    expect(validateReschedule({ newDate: '2026-09-20', reason: '' }, '2026-09-20')).toBe(
      'A nova data precisa ser diferente da atual.',
    )
  })

  it('aceita uma nova data diferente da atual', () => {
    expect(validateReschedule({ newDate: '2026-09-25', reason: 'Atraso do fornecedor' }, '2026-09-20')).toBeNull()
  })
})
