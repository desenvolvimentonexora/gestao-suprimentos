import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ComparisonTable } from './ComparisonTable'
import type { ComparisonQuotationRow, ComparisonRequestItemRow, ComparisonWinner } from './types'

const requestItems: ComparisonRequestItemRow[] = [
  { id: 'ri1', materialName: 'Argamassa', quantity: 20, unitOfMeasure: 'sc' },
  { id: 'ri2', materialName: 'Tintas', quantity: 5, unitOfMeasure: 'lt' },
]

const quotations: ComparisonQuotationRow[] = [
  {
    quotationId: 'q1',
    supplierName: 'Sika',
    prices: [
      { requestItemId: 'ri1', quotationItemId: 'qi1', unitPrice: 30, leadTimeDays: 5 },
      { requestItemId: 'ri2', quotationItemId: 'qi2', unitPrice: 100, leadTimeDays: 5 },
    ],
  },
  {
    quotationId: 'q2',
    supplierName: 'Votorantim',
    prices: [
      { requestItemId: 'ri1', quotationItemId: 'qi3', unitPrice: 25, leadTimeDays: 7 },
      { requestItemId: 'ri2', quotationItemId: 'qi4', unitPrice: 120, leadTimeDays: 4 },
    ],
  },
]

function baseProps() {
  return {
    requestItems,
    quotations,
    winners: [] as ComparisonWinner[],
    onSelectWinner: vi.fn(),
    onSendToApproval: vi.fn(),
    canSendToApproval: false,
  }
}

describe('ComparisonTable', () => {
  it('mostra uma coluna por fornecedor e uma linha por item', () => {
    render(<ComparisonTable {...baseProps()} />)
    expect(screen.getByText('Sika')).toBeInTheDocument()
    expect(screen.getByText('Votorantim')).toBeInTheDocument()
    expect(screen.getByText('Argamassa', { exact: false })).toBeInTheDocument()
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
      { quotationId: 'q3', supplierName: 'Gama', prices: [] },
    ]
    render(<ComparisonTable {...baseProps()} quotations={partialQuotations} />)
    expect(screen.getByTestId('price-q3-ri1')).toHaveTextContent('—')
  })

  it('permite escolher o vencedor por linha, independente entre itens', async () => {
    const user = userEvent.setup()
    const onSelectWinner = vi.fn()
    render(<ComparisonTable {...baseProps()} onSelectWinner={onSelectWinner} />)

    const votorantimRadios = screen.getAllByRole('radio', { name: /votorantim/i })
    await user.click(votorantimRadios[0]!)
    // a primeira opção de rádio de Votorantim (linha 1) é a da Argamassa (ri1)
    expect(onSelectWinner).toHaveBeenCalledWith('ri1', 'qi3')
  })

  it('mostra o nome do fornecedor vencedor na coluna "Melhor Forn." de cada linha', () => {
    const winners: ComparisonWinner[] = [
      { requestItemId: 'ri1', quotationItemId: 'qi3' },
      { requestItemId: 'ri2', quotationItemId: 'qi2' },
    ]
    render(<ComparisonTable {...baseProps()} winners={winners} />)
    const row1 = screen.getByTestId('winner-ri1')
    const row2 = screen.getByTestId('winner-ri2')
    expect(row1).toHaveTextContent('Votorantim')
    expect(row2).toHaveTextContent('Sika')
  })

  it('mostra a faixa de melhor preço combinado quando todos os itens têm vencedor', () => {
    const winners: ComparisonWinner[] = [
      { requestItemId: 'ri1', quotationItemId: 'qi3' },
      { requestItemId: 'ri2', quotationItemId: 'qi2' },
    ]
    render(<ComparisonTable {...baseProps()} winners={winners} />)
    // ri1: 20 * 25 = 500, ri2: 5 * 100 = 500, total 1000
    expect(screen.getByText(/melhor preço combinado/i)).toHaveTextContent('R$ 1.000,00')
  })

  it('não mostra a faixa de melhor preço combinado quando falta vencedor de algum item', () => {
    const winners: ComparisonWinner[] = [{ requestItemId: 'ri1', quotationItemId: 'qi3' }]
    render(<ComparisonTable {...baseProps()} winners={winners} />)
    expect(screen.queryByText(/melhor preço combinado/i)).not.toBeInTheDocument()
  })

  it('desabilita o botão de enviar para aprovação quando canSendToApproval é falso', () => {
    render(<ComparisonTable {...baseProps()} canSendToApproval={false} />)
    expect(screen.getByRole('button', { name: /enviar para aprovação/i })).toBeDisabled()
  })

  it('chama onSendToApproval ao clicar no botão habilitado', async () => {
    const user = userEvent.setup()
    const onSendToApproval = vi.fn()
    render(<ComparisonTable {...baseProps()} canSendToApproval onSendToApproval={onSendToApproval} />)
    await user.click(screen.getByRole('button', { name: /enviar para aprovação/i }))
    expect(onSendToApproval).toHaveBeenCalled()
  })
})
