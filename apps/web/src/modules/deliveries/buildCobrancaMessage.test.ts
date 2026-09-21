import { describe, expect, it } from 'vitest'
import { buildCobrancaMessage } from './buildCobrancaMessage'

describe('buildCobrancaMessage', () => {
  const today = new Date('2026-09-20T12:00:00')

  it('menciona os dias de atraso quando o pedido está atrasado', () => {
    const message = buildCobrancaMessage(
      { orderNumber: 'PC-100', unitName: 'UP Graça', expectedDeliveryDate: '2026-09-15', deliveredAt: null },
      'Fornecedor Alfa',
      today,
    )
    expect(message.subject).toBe('Cobrança de entrega — PC PC-100')
    expect(message.body).toContain('Fornecedor Alfa')
    expect(message.body).toContain('PC PC-100')
    expect(message.body).toContain('UP Graça')
    expect(message.body).toContain('5 dias em atraso')
  })

  it('não menciona atraso quando o pedido está no prazo', () => {
    const message = buildCobrancaMessage(
      { orderNumber: 'PC-200', unitName: 'UP Graça', expectedDeliveryDate: '2026-09-25', deliveredAt: null },
      'Fornecedor Beta',
      today,
    )
    expect(message.body).not.toContain('atraso')
  })

  it('não menciona atraso quando o pedido já chegou (AR pendente)', () => {
    const message = buildCobrancaMessage(
      {
        orderNumber: 'PC-300',
        unitName: 'UP Graça',
        expectedDeliveryDate: '2026-09-15',
        deliveredAt: '2026-09-19T00:00:00Z',
      },
      'Fornecedor Gama',
      today,
    )
    expect(message.body).not.toContain('atraso')
  })
})
