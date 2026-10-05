import { describe, expect, it } from 'vitest'
import { groupByStatus } from './groupByStatus'
import type { TaskCard } from './types'

function card(id: string, status: TaskCard['status'], lastMovedAt: string | null): TaskCard {
  return {
    id,
    title: id,
    description: null,
    status,
    createdAt: '2026-09-01T00:00:00Z',
    createdByName: null,
    lastMovedEventType: null,
    lastMovedAt,
    lastMovedByName: null,
  }
}

describe('groupByStatus', () => {
  it('coloca o card concluído mais recentemente primeiro na coluna Concluído', () => {
    const grouped = groupByStatus([
      card('antigo', 'feito', '2026-09-01T10:00:00Z'),
      card('novo', 'feito', '2026-09-05T10:00:00Z'),
      card('meio', 'feito', '2026-09-03T10:00:00Z'),
    ])

    expect(grouped.feito.map((c) => c.id)).toEqual(['novo', 'meio', 'antigo'])
  })

  it('não altera a ordem das colunas Backlog e Em andamento', () => {
    const grouped = groupByStatus([
      card('a', 'fazendo', '2026-09-01T10:00:00Z'),
      card('b', 'fazendo', '2026-09-05T10:00:00Z'),
    ])

    expect(grouped.fazendo.map((c) => c.id)).toEqual(['a', 'b'])
  })
})
