import { describe, expect, it } from 'vitest'
import { filterPendingItems } from './filterPendingItems'

describe('filterPendingItems', () => {
  it('mantém só os itens sem delivered_at', () => {
    const items = [
      { id: 'i1', deliveredAt: null },
      { id: 'i2', deliveredAt: '2026-09-20T00:00:00Z' },
      { id: 'i3', deliveredAt: null },
    ]
    expect(filterPendingItems(items).map((i) => i.id)).toEqual(['i1', 'i3'])
  })

  it('retorna lista vazia quando todos os itens já chegaram', () => {
    expect(filterPendingItems([{ id: 'i1', deliveredAt: '2026-09-20T00:00:00Z' }])).toEqual([])
  })
})
