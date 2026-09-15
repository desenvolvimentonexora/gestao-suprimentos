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
        order: null,
      },
      {
        comparisonId: 'c2',
        unitName: 'UP Barra',
        externalRef: 'SOL-2',
        status: 'rejected',
        rejectionReason: 'Preço acima do orçamento',
        releasedAt: null,
        order: null,
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

  it('mostra o pedido importado (número e status) quando a comparação liberada já tem um', () => {
    const rows: HistoryRow[] = [
      {
        comparisonId: 'c1',
        unitName: 'UP Graça',
        externalRef: 'SOL-1',
        status: 'released',
        rejectionReason: null,
        releasedAt: '2026-09-10T00:00:00Z',
        order: { orderNumber: 'PC-2026-001', status: 'issued' },
      },
    ]
    render(<HistoryList rows={rows} />)
    expect(screen.getByText(/PC-2026-001/)).toBeInTheDocument()
    expect(screen.getByText(/emitido/i)).toBeInTheDocument()
  })

  it('não mostra nada de pedido quando a comparação liberada ainda não tem um importado', () => {
    const rows: HistoryRow[] = [
      {
        comparisonId: 'c1',
        unitName: 'UP Graça',
        externalRef: 'SOL-1',
        status: 'released',
        rejectionReason: null,
        releasedAt: '2026-09-10T00:00:00Z',
        order: null,
      },
    ]
    render(<HistoryList rows={rows} />)
    expect(screen.queryByText(/pedido/i)).not.toBeInTheDocument()
  })
})
