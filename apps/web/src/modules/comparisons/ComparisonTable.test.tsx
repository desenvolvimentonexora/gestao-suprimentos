import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ComparisonTable } from './ComparisonTable'
import type { ComparisonQuotationRow, ComparisonRequestItemRow } from './types'

const requestItems: ComparisonRequestItemRow[] = [
  { id: 'ri1', materialName: 'Argamassa', quantity: 20, unitOfMeasure: 'sc' },
]

const quotations: ComparisonQuotationRow[] = [
  {
    quotationId: 'q1',
    supplierName: 'Fornecedor Alfa',
    prices: [{ requestItemId: 'ri1', unitPrice: 30, leadTimeDays: 5 }],
  },
  {
    quotationId: 'q2',
    supplierName: 'Fornecedor Beta',
    prices: [{ requestItemId: 'ri1', unitPrice: 25, leadTimeDays: 7 }],
  },
]

function baseProps() {
  return {
    requestItems,
    quotations,
    winningQuotationId: null as string | null,
    onSelectWinner: vi.fn(),
    onSendToApproval: vi.fn(),
    canSendToApproval: false,
  }
}

describe('ComparisonTable', () => {
  it('mostra uma coluna por fornecedor e uma linha por item', () => {
    render(<ComparisonTable {...baseProps()} />)
    expect(screen.getByText('Fornecedor Alfa')).toBeInTheDocument()
    expect(screen.getByText('Fornecedor Beta')).toBeInTheDocument()
    expect(screen.getByText('Argamassa')).toBeInTheDocument()
  })

  it('destaca visualmente a célula de menor preço da linha', () => {
    render(<ComparisonTable {...baseProps()} />)
    const cheapestCell = screen.getByTestId('price-q2-ri1')
    const pricierCell = screen.getByTestId('price-q1-ri1')
    expect(cheapestCell.className).toContain('bg-badge-available/20')
    expect(pricierCell.className).not.toContain('bg-badge-available/20')
  })

  it('mostra — quando o fornecedor não cotou aquele item', () => {
    const partialQuotations: ComparisonQuotationRow[] = [
      { quotationId: 'q3', supplierName: 'Fornecedor Gama', prices: [] },
    ]
    render(<ComparisonTable {...baseProps()} quotations={partialQuotations} />)
    expect(screen.getByTestId('price-q3-ri1')).toHaveTextContent('—')
  })

  it('chama onSelectWinner ao marcar um fornecedor como vencedor', async () => {
    const user = userEvent.setup()
    const onSelectWinner = vi.fn()
    render(<ComparisonTable {...baseProps()} onSelectWinner={onSelectWinner} />)
    await user.click(screen.getByRole('radio', { name: /fornecedor beta/i }))
    expect(onSelectWinner).toHaveBeenCalledWith('q2')
  })

  it('desabilita o botão de enviar para aprovação quando canSendToApproval é falso', () => {
    render(<ComparisonTable {...baseProps()} canSendToApproval={false} />)
    expect(screen.getByRole('button', { name: /enviar para aprovação/i })).toBeDisabled()
  })

  it('chama onSendToApproval ao clicar no botão habilitado', async () => {
    const user = userEvent.setup()
    const onSendToApproval = vi.fn()
    render(
      <ComparisonTable
        {...baseProps()}
        canSendToApproval
        winningQuotationId="q2"
        onSendToApproval={onSendToApproval}
      />,
    )
    await user.click(screen.getByRole('button', { name: /enviar para aprovação/i }))
    expect(onSendToApproval).toHaveBeenCalled()
  })
})
