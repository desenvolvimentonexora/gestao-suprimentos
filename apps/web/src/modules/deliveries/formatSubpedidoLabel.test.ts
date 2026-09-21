import { describe, expect, it } from 'vitest'
import { formatSubpedidoLabel } from './formatSubpedidoLabel'

describe('formatSubpedidoLabel', () => {
  it('monta o rótulo do subpedido com índice em 3 dígitos', () => {
    expect(formatSubpedidoLabel('PC-100', 0)).toBe('PC-100/001')
    expect(formatSubpedidoLabel('PC-100', 9)).toBe('PC-100/010')
  })
})
