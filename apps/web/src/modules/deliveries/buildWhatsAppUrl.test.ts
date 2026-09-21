import { describe, expect, it } from 'vitest'
import { buildWhatsAppUrl } from './buildWhatsAppUrl'

describe('buildWhatsAppUrl', () => {
  it('remove tudo que não é dígito do telefone e codifica a mensagem', () => {
    const url = buildWhatsAppUrl('(11) 98765-4321', 'Olá, tudo bem?')
    expect(url).toBe('https://wa.me/11987654321?text=Ol%C3%A1%2C%20tudo%20bem%3F')
  })
})
