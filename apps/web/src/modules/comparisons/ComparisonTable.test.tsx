import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ComparisonTable } from './ComparisonTable'
import type { ComparisonQuotationRow, ComparisonRequestItemRow } from './types'

const requestItems: ComparisonRequestItemRow[] = [
  { id: 'ri1', materialName: 'Argamassa', quantity: 20, unitOfMeasure: 'sc' },
  { id: 'ri2', materialName: 'Tintas', quantity: 5, unitOfMeasure: 'lt' },
]

const sika: ComparisonQuotationRow = {
  quotationId: 'q1',
  supplierName: 'Sika',
  freight: 0,
  paymentTerms: '30 dias',
  deliveryDays: 5,
  prices: [
    { requestItemId: 'ri1', quotationItemId: 'qi1', unitPrice: 30, leadTimeDays: 5 },
    { requestItemId: 'ri2', quotationItemId: 'qi2', unitPrice: 110, leadTimeDays: 5 },
  ],
}

const votorantim: ComparisonQuotationRow = {
  quotationId: 'q2',
  supplierName: 'Votorantim',
  freight: 0,
  paymentTerms: null,
  deliveryDays: 7,
  prices: [
    { requestItemId: 'ri1', quotationItemId: 'qi3', unitPrice: 25, leadTimeDays: 7 },
    { requestItemId: 'ri2', quotationItemId: 'qi4', unitPrice: 120, leadTimeDays: 4 },
  ],
}

function baseProps() {
  return {
    requestItems,
    quotations: [sika, votorantim],
    onWinnerChange: vi.fn(),
    onUpdateQuotationTerms: vi.fn(),
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
      { quotationId: 'q3', supplierName: 'Gama', freight: 0, paymentTerms: null, deliveryDays: null, prices: [] },
    ]
    render(<ComparisonTable {...baseProps()} quotations={partialQuotations} />)
    expect(screen.getByTestId('price-q3-ri1')).toHaveTextContent('—')
  })

  it('mostra as linhas de Frete, Pagamento, Entrega e Total', () => {
    render(<ComparisonTable {...baseProps()} />)
    expect(screen.getByText('Frete')).toBeInTheDocument()
    expect(screen.getByText('Pagamento')).toBeInTheDocument()
    expect(screen.getByText('Entrega (dias)')).toBeInTheDocument()
    expect(screen.getByText('Total')).toBeInTheDocument()
  })

  it('calcula o total de cada fornecedor somando itens e frete', () => {
    const withFreight = { ...sika, freight: 50 }
    render(<ComparisonTable {...baseProps()} quotations={[withFreight, votorantim]} />)
    // sika: 20*30 + 5*110 + 50 = 1200; votorantim: 20*25 + 5*120 = 1100
    expect(screen.getByTestId('total-q1')).toHaveTextContent('R$ 1.200,00')
    expect(screen.getByTestId('total-q2')).toHaveTextContent('R$ 1.100,00')
  })

  it('mostra — no total de um fornecedor que não cotou todos os itens', () => {
    const partial: ComparisonQuotationRow = {
      quotationId: 'q3',
      supplierName: 'Gama',
      freight: 0,
      paymentTerms: null,
      deliveryDays: null,
      prices: [{ requestItemId: 'ri1', quotationItemId: 'qi5', unitPrice: 10, leadTimeDays: 5 }],
    }
    render(<ComparisonTable {...baseProps()} quotations={[partial]} />)
    expect(screen.getByTestId('total-q3')).toHaveTextContent('—')
  })

  it('avisa o vencedor (menor total) ao renderizar', () => {
    const onWinnerChange = vi.fn()
    render(<ComparisonTable {...baseProps()} onWinnerChange={onWinnerChange} />)
    // sika: 20*30 + 5*110 = 1150; votorantim: 20*25 + 5*120 = 1100 (menor)
    expect(onWinnerChange).toHaveBeenCalledWith('q2')
  })

  it('destaca a célula de Total do fornecedor vencedor', () => {
    render(<ComparisonTable {...baseProps()} />)
    expect(screen.getByTestId('total-q2').className).toContain('bg-blue-900')
    expect(screen.getByTestId('total-q1').className).not.toContain('bg-blue-900')
  })

  it('exclui um fornecedor da comparação e recalcula o vencedor', async () => {
    const user = userEvent.setup()
    const onWinnerChange = vi.fn()
    render(<ComparisonTable {...baseProps()} onWinnerChange={onWinnerChange} />)

    await user.click(screen.getByRole('button', { name: /excluir votorantim/i }))

    expect(onWinnerChange).toHaveBeenLastCalledWith('q1')
  })

  it('mostra a faixa de melhor preço combinado com o total do vencedor', () => {
    render(<ComparisonTable {...baseProps()} />)
    expect(screen.getByText(/melhor preço combinado/i)).toHaveTextContent('R$ 1.100,00')
  })

  it('não mostra a faixa de melhor preço combinado quando nenhum fornecedor cotou todos os itens', () => {
    const partial: ComparisonQuotationRow = {
      quotationId: 'q3',
      supplierName: 'Gama',
      freight: 0,
      paymentTerms: null,
      deliveryDays: null,
      prices: [{ requestItemId: 'ri1', quotationItemId: 'qi5', unitPrice: 10, leadTimeDays: 5 }],
    }
    render(<ComparisonTable {...baseProps()} quotations={[partial]} />)
    expect(screen.queryByText(/melhor preço combinado/i)).not.toBeInTheDocument()
  })

  it('chama onUpdateQuotationTerms ao editar o frete de um fornecedor', async () => {
    const user = userEvent.setup()
    const onUpdateQuotationTerms = vi.fn()
    render(<ComparisonTable {...baseProps()} onUpdateQuotationTerms={onUpdateQuotationTerms} />)

    const freightInput = screen.getByLabelText(/frete sika/i)
    await user.clear(freightInput)
    await user.type(freightInput, '80')
    await user.tab()

    expect(onUpdateQuotationTerms).toHaveBeenCalledWith('q1', {
      freight: 80,
      paymentTerms: '30 dias',
      deliveryDays: 5,
    })
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
