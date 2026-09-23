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

  it('inclui os itens sinalizados quando há algum, já que Solicitar esclarecimento foi incorporado aqui', () => {
    const message = buildExtensionMessage({
      currentNeededBy: '2026-09-18',
      newNeededBy: '2026-09-25',
      reason: 'Aguardando confirmação do engenheiro',
      pendingItems: [
        { materialName: 'Aço', motivo: 'Falta especificar a bitola' },
        { materialName: 'Cimento', motivo: null },
      ],
    })

    expect(message).toContain('Itens sinalizados que ainda precisam de esclarecimento:')
    expect(message).toContain('- Aço: Falta especificar a bitola')
    expect(message).toContain('- Cimento')
  })

  it('não menciona itens sinalizados quando não há nenhum', () => {
    const message = buildExtensionMessage({
      currentNeededBy: '2026-09-18',
      newNeededBy: '2026-09-25',
      reason: 'Motivo qualquer',
    })

    expect(message).not.toContain('Itens sinalizados')
  })
})
