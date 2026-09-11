import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { HistoryList } from './HistoryList'
import type { HistoryRow } from './types'

describe('HistoryList', () => {
  it('mostra comparações liberadas e rejeitadas com o status', () => {
    const rows: HistoryRow[] = [
      {
        comparisonId: 'c1',
        unitName: 'UP Graça',
        externalRef: 'SOL-1',
        status: 'released',
        rejectionReason: null,
        releasedAt: '2026-09-10T00:00:00Z',
      },
      {
        comparisonId: 'c2',
        unitName: 'UP Barra',
        externalRef: 'SOL-2',
        status: 'rejected',
        rejectionReason: 'Preço acima do orçamento',
        releasedAt: null,
      },
    ]
    render(<HistoryList rows={rows} />)
    expect(screen.getByText('UP Graça')).toBeInTheDocument()
    expect(screen.getByText('Liberada')).toBeInTheDocument()
    expect(screen.getByText('UP Barra')).toBeInTheDocument()
    expect(screen.getByText('Rejeitada')).toBeInTheDocument()
    expect(screen.getByText('Preço acima do orçamento')).toBeInTheDocument()
  })

  it('mostra estado vazio quando não há histórico', () => {
    render(<HistoryList rows={[]} />)
    expect(screen.getByText('Nenhuma comparação no histórico ainda.')).toBeInTheDocument()
  })
})
