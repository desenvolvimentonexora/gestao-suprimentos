import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { SourceCards } from './SourceCards'
import type { ComparisonQuotationRow } from './types'

const sika: ComparisonQuotationRow = {
  quotationId: 'q1',
  supplierName: 'Sika',
  freight: null,
  paymentTerms: null,
  deliveryDays: null,
  prices: [],
}

describe('SourceCards', () => {
  it('mostra o card de Solicitações sempre ativo, com a contagem de itens', () => {
    render(<SourceCards itemCount={3} quotations={[]} onAddQuotation={vi.fn()} />)
    expect(screen.getByText('Solicitações')).toBeInTheDocument()
    expect(screen.getByText(/3 itens/i)).toBeInTheDocument()
  })

  it('mostra 4 slots de fornecedor, todos vazios quando não há cotações', () => {
    render(<SourceCards itemCount={1} quotations={[]} onAddQuotation={vi.fn()} />)
    expect(screen.getByText('Fornecedor 1')).toBeInTheDocument()
    expect(screen.getByText('Fornecedor 2')).toBeInTheDocument()
    expect(screen.getByText('Fornecedor 3')).toBeInTheDocument()
    expect(screen.getByText('Fornecedor 4')).toBeInTheDocument()
  })

  it('preenche o primeiro slot com o nome do fornecedor quando já existe uma cotação', () => {
    render(<SourceCards itemCount={1} quotations={[sika]} onAddQuotation={vi.fn()} />)
    expect(screen.getByText('Sika')).toBeInTheDocument()
    expect(screen.queryByText('Fornecedor 1')).not.toBeInTheDocument()
    expect(screen.getByText('Fornecedor 2')).toBeInTheDocument()
  })

  it('chama onAddQuotation ao clicar num slot vazio', async () => {
    const user = userEvent.setup()
    const onAddQuotation = vi.fn()
    render(<SourceCards itemCount={1} quotations={[]} onAddQuotation={onAddQuotation} />)
    await user.click(screen.getByRole('button', { name: /fornecedor 1/i }))
    expect(onAddQuotation).toHaveBeenCalled()
  })

  it('não permite clicar num slot já preenchido', () => {
    render(<SourceCards itemCount={1} quotations={[sika]} onAddQuotation={vi.fn()} />)
    expect(screen.queryByRole('button', { name: /sika/i })).not.toBeInTheDocument()
  })
})
