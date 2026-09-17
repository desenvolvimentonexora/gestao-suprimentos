import { describe, expect, it } from 'vitest'
import { buildClarificationMessage } from './buildClarificationMessage'

describe('buildClarificationMessage', () => {
  it('lista cada item pendente com o motivo informado', () => {
    const message = buildClarificationMessage([
      { materialName: 'Porta', motivo: 'Informar modelo da porta' },
      { materialName: 'Fechadura', motivo: null },
    ])

    expect(message).toContain('- Porta: Informar modelo da porta')
    expect(message).toContain('- Fechadura')
    expect(message).not.toContain('Fechadura: null')
  })
})
