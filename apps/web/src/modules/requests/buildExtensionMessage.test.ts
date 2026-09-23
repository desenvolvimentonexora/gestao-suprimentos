import { describe, expect, it } from 'vitest'
import { buildExtensionMessage } from './buildExtensionMessage'

describe('buildExtensionMessage', () => {
  it('monta a mensagem com a data atual, a nova data e o motivo', () => {
    const message = buildExtensionMessage({
      currentNeededBy: '2026-09-18',
      newNeededBy: '2026-09-25',
      reason: 'Fornecedor sem estoque até lá',
    })

    expect(message).toContain('18/09/2026')
    expect(message).toContain('25/09/2026')
    expect(message).toContain('Motivo: Fornecedor sem estoque até lá')
  })

  it('lida com SOL sem data de entrega atual', () => {
    const message = buildExtensionMessage({
      currentNeededBy: null,
      newNeededBy: '2026-09-25',
      reason: 'Motivo qualquer',
    })
    expect(message).toContain('não informada')
  })
})
