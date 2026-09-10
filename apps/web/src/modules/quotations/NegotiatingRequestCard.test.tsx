import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { NegotiatingRequestCard } from './NegotiatingRequestCard'
import type { NegotiatingRequestRow } from './types'

const request: NegotiatingRequestRow = {
  id: 'r1',
  unitName: 'UP Graça',
  neededBy: '2026-10-01',
  externalRef: 'SOL-1',
  items: [{ id: 'i1', materialName: 'Cimento', quantity: 10, unitOfMeasure: 'sc' }],
  quotations: [
    {
      id: 'q1',
      supplierId: 's1',
      supplierName: 'Fornecedor Alfa',
      status: 'received',
      submittedAt: '2026-09-01T00:00:00Z',
    },
  ],
}

function baseProps() {
  return {
    request,
    onRegisterQuotation: vi.fn(),
    onDiscardQuotation: vi.fn(),
  }
}

describe('NegotiatingRequestCard', () => {
  it('mostra unidade, n° externo e itens da requisição', () => {
    render(<NegotiatingRequestCard {...baseProps()} />)
    expect(screen.getByText('UP Graça')).toBeInTheDocument()
    expect(screen.getByText('SOL-1')).toBeInTheDocument()
    expect(screen.getByText(/cimento/i)).toBeInTheDocument()
  })

  it('mostra as cotações já registradas', () => {
    render(<NegotiatingRequestCard {...baseProps()} />)
    expect(screen.getByText('Fornecedor Alfa')).toBeInTheDocument()
  })

  it('mostra estado vazio quando não há cotações', () => {
    render(<NegotiatingRequestCard {...baseProps()} request={{ ...request, quotations: [] }} />)
    expect(screen.getByText('Nenhuma cotação registrada ainda.')).toBeInTheDocument()
  })

  it('chama onRegisterQuotation ao clicar em registrar cotação', async () => {
    const user = userEvent.setup()
    const onRegisterQuotation = vi.fn()
    render(<NegotiatingRequestCard {...baseProps()} onRegisterQuotation={onRegisterQuotation} />)
    await user.click(screen.getByRole('button', { name: /registrar cotação/i }))
    expect(onRegisterQuotation).toHaveBeenCalledWith('r1')
  })

  it('chama onDiscardQuotation ao descartar uma cotação', async () => {
    const user = userEvent.setup()
    const onDiscardQuotation = vi.fn()
    render(<NegotiatingRequestCard {...baseProps()} onDiscardQuotation={onDiscardQuotation} />)
    await user.click(screen.getByRole('button', { name: /descartar cotação de fornecedor alfa/i }))
    expect(onDiscardQuotation).toHaveBeenCalledWith('q1')
  })
})
