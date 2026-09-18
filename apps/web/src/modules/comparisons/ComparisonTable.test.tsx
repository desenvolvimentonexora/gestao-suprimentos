import { render, screen, within } from '@testing-library/react'
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
    isEditable: true,
  }
}

describe('ComparisonTable', () => {
  it('preenche o cabeçalho de Descrição em azul e o de Melhor Forn. em verde, sempre, com texto branco', () => {
    render(<ComparisonTable {...baseProps()} />)
    const descricaoHeader = screen.getByText('Descrição').closest('th')
    const melhorForHeader = screen.getByText('Melhor Forn.').closest('th')
    expect(descricaoHeader!.className).toContain('bg-blue-900')
    expect(descricaoHeader!.className).toContain('text-white')
    expect(melhorForHeader!.className).toContain('bg-emerald-700')
    expect(melhorForHeader!.className).toContain('text-white')
  })

  it('mostra Descrição, Und. e Qtde. como colunas separadas', () => {
    render(<ComparisonTable {...baseProps()} />)
    expect(screen.getByText('Descrição')).toBeInTheDocument()
    expect(screen.getByText('Und.')).toBeInTheDocument()
    expect(screen.getByText('Qtde.')).toBeInTheDocument()

    const row = screen.getByText('Argamassa').closest('tr')
    expect(row).not.toBeNull()
    expect(within(row!).getByText('sc')).toBeInTheDocument()
    expect(within(row!).getByText('20')).toBeInTheDocument()
  })

  it('mostra V.Unit. e Total como subcolunas de cada fornecedor', () => {
    render(<ComparisonTable {...baseProps()} />)
    const unitHeaders = screen.getAllByText('V.Unit.')
    const totalHeaders = screen.getAllByText('Total')
    expect(unitHeaders).toHaveLength(2)
    // "Total" também aparece no rótulo da linha de rodapé — pelo menos 2 subcabeçalhos + 1 rótulo
    expect(totalHeaders.length).toBeGreaterThanOrEqual(3)
  })

  it('preenche o cabeçalho da coluna do fornecedor com cor sólida do tema e texto branco', () => {
    render(<ComparisonTable {...baseProps()} />)
    const header = screen.getByText('Sika').closest('th')
    expect(header).not.toBeNull()
    expect(header!.className).toContain('text-white')
  })

  it('usa um tom mais claro da mesma cor do fornecedor na subcoluna V.Unit./Total', () => {
    render(<ComparisonTable {...baseProps()} />)
    const vUnitHeaders = screen.getAllByText('V.Unit.')
    expect(vUnitHeaders[0]!.className).toMatch(/bg-\w+-100/)
  })

  it('uma linha por item, com nome do fornecedor na coluna certa', () => {
    render(<ComparisonTable {...baseProps()} />)
    expect(screen.getByText('Sika')).toBeInTheDocument()
    expect(screen.getByText('Votorantim')).toBeInTheDocument()
    expect(screen.getByText('Argamassa')).toBeInTheDocument()
  })

  it('destaca visualmente a célula de menor preço unitário da linha', () => {
    render(<ComparisonTable {...baseProps()} />)
    const cheapestCell = screen.getByTestId('price-q2-ri1')
    const pricierCell = screen.getByTestId('price-q1-ri1')
    expect(cheapestCell.className).toContain('bg-badge-available/30')
    expect(pricierCell.className).not.toContain('bg-badge-available/30')
  })

  it('mostra o total por item (preço unitário × quantidade) na subcoluna Total', () => {
    render(<ComparisonTable {...baseProps()} />)
    // ri1 (20 un) a R$25 na Votorantim = R$500,00
    expect(screen.getByTestId('itemTotal-q2-ri1')).toHaveTextContent('R$ 500,00')
    // ri2 (5 un) a R$110 na Sika = R$550,00
    expect(screen.getByTestId('itemTotal-q1-ri2')).toHaveTextContent('R$ 550,00')
  })

  it('mostra a coluna "Melhor Forn." com o fornecedor e o preço mais barato de cada item', () => {
    render(<ComparisonTable {...baseProps()} />)
    expect(screen.getByText('Melhor Forn.')).toBeInTheDocument()
    const bestRi1 = screen.getByTestId('best-ri1')
    const bestRi2 = screen.getByTestId('best-ri2')
    expect(bestRi1).toHaveTextContent('Votorantim')
    expect(bestRi1).toHaveTextContent('R$ 25,00')
    expect(bestRi2).toHaveTextContent('Sika')
    expect(bestRi2).toHaveTextContent('R$ 110,00')
  })

  it('mostra — quando o fornecedor não cotou aquele item, no preço unitário e no total do item', () => {
    const partialQuotations: ComparisonQuotationRow[] = [
      { quotationId: 'q3', supplierName: 'Gama', freight: 0, paymentTerms: null, deliveryDays: null, prices: [] },
    ]
    render(<ComparisonTable {...baseProps()} quotations={partialQuotations} />)
    expect(screen.getByTestId('price-q3-ri1')).toHaveTextContent('—')
    expect(screen.getByTestId('itemTotal-q3-ri1')).toHaveTextContent('—')
  })

  it('mostra as linhas de Frete, Pagamento, Entrega e Total', () => {
    render(<ComparisonTable {...baseProps()} />)
    expect(screen.getByText('Frete')).toBeInTheDocument()
    expect(screen.getByText('Pagamento')).toBeInTheDocument()
    expect(screen.getByText('Entrega (dias)')).toBeInTheDocument()
  })

  it('mostra as linhas de rodapé na ordem Frete, Total, Pagamento, Entrega', () => {
    const { container } = render(<ComparisonTable {...baseProps()} />)
    const footerLabels = [...container.querySelectorAll('tbody tr td:first-child')]
      .map((cell) => cell.textContent)
      .filter((text) => ['Frete', 'Total', 'Pagamento', 'Entrega (dias)'].includes(text ?? ''))
    expect(footerLabels).toEqual(['Frete', 'Total', 'Pagamento', 'Entrega (dias)'])
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

  it('desabilita o botão de excluir fornecedor quando isEditable é false', () => {
    render(<ComparisonTable {...baseProps()} isEditable={false} />)
    expect(screen.getByRole('button', { name: /excluir votorantim/i })).toBeDisabled()
  })

  it('mostra a faixa de melhor preço combinado com o total do vencedor, com destaque forte do tema', () => {
    render(<ComparisonTable {...baseProps()} />)
    const banner = screen.getByText(/melhor preço combinado/i).closest('div')
    expect(banner).toHaveTextContent('R$ 1.100,00')
    expect(banner!.className).toContain('bg-primary')
    expect(banner!.className).toContain('text-on-primary')
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

  it('mostra Frete, Pagamento e Entrega como texto (sem input) quando isEditable é false', () => {
    const withValues = { ...sika, freight: 50, paymentTerms: '30 dias', deliveryDays: 5 }
    render(<ComparisonTable {...baseProps()} quotations={[withValues]} isEditable={false} />)

    expect(screen.queryByLabelText(/frete sika/i)).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/pagamento sika/i)).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/entrega sika/i)).not.toBeInTheDocument()

    expect(screen.getByText('R$ 50,00')).toBeInTheDocument()
    expect(screen.getByText('30 dias')).toBeInTheDocument()
    const entregaRow = screen.getByText('Entrega (dias)').closest('tr')
    expect(entregaRow).not.toBeNull()
    expect(within(entregaRow!).getByText('5')).toBeInTheDocument()
  })

  it('mostra travessão no texto de Frete/Pagamento/Entrega quando não isEditable e não há valor', () => {
    const empty = { ...sika, freight: null, paymentTerms: null, deliveryDays: null }
    render(<ComparisonTable {...baseProps()} quotations={[empty]} isEditable={false} />)

    const row = screen.getByText('Pagamento').closest('tr')
    expect(row).not.toBeNull()
    expect(within(row!).getByText('—')).toBeInTheDocument()
  })

  it('continua mostrando os inputs de Frete/Pagamento/Entrega quando isEditable é true (padrão)', () => {
    render(<ComparisonTable {...baseProps()} />)
    expect(screen.getByLabelText(/frete sika/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/pagamento sika/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/entrega sika/i)).toBeInTheDocument()
  })
})
