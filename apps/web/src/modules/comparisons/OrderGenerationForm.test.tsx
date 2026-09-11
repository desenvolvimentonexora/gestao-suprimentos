import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { OrderGenerationForm } from './OrderGenerationForm'
import type { OrderDraftItem } from './types'

const items: OrderDraftItem[] = [
  {
    requestItemId: 'ri1',
    quotationItemId: 'qi1',
    materialId: 'm1',
    materialName: 'Cimento CP-II',
    quantity: 10,
    unitOfMeasure: 'saco',
    supplierId: 's1',
    supplierName: 'Fornecedor A',
    unitPrice: 30,
  },
  {
    requestItemId: 'ri2',
    quotationItemId: 'qi2',
    materialId: 'm2',
    materialName: 'Areia',
    quantity: 5,
    unitOfMeasure: 'm³',
    supplierId: 's2',
    supplierName: 'Fornecedor B',
    unitPrice: 100,
  },
]

function baseProps() {
  return {
    items,
    suggestedOrderNumber: 'PED-0001',
    onBack: vi.fn(),
    onSubmit: vi.fn(),
    isSubmitting: false,
  }
}

describe('OrderGenerationForm', () => {
  it('mostra os itens da comparação, somente leitura, com fornecedor e preço', () => {
    render(<OrderGenerationForm {...baseProps()} />)
    expect(screen.getByText('Cimento CP-II')).toBeInTheDocument()
    expect(screen.getByText('Fornecedor A')).toBeInTheDocument()
    expect(screen.getByText('Areia')).toBeInTheDocument()
    expect(screen.getByText('Fornecedor B')).toBeInTheDocument()
  })

  it('mostra o valor total somado dos itens', () => {
    render(<OrderGenerationForm {...baseProps()} />)
    // 10 * 30 + 5 * 100 = 800
    expect(screen.getByText(/R\$\s*800,00/)).toBeInTheDocument()
  })

  it('pré-preenche o número do pedido sugerido, editável', () => {
    render(<OrderGenerationForm {...baseProps()} />)
    expect(screen.getByLabelText(/número do pedido/i)).toHaveValue('PED-0001')
  })

  it('exige o número do pedido ao emitir', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<OrderGenerationForm {...baseProps()} onSubmit={onSubmit} />)

    await user.clear(screen.getByLabelText(/número do pedido/i))
    await user.click(screen.getByRole('button', { name: /emitir pedido/i }))

    expect(await screen.findByText('Informe o número do pedido.')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('envia número do pedido e data prevista de entrega preenchidos', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<OrderGenerationForm {...baseProps()} onSubmit={onSubmit} />)

    await user.clear(screen.getByLabelText(/número do pedido/i))
    await user.type(screen.getByLabelText(/número do pedido/i), 'PED-9999')
    await user.type(screen.getByLabelText(/data prevista de entrega/i), '2026-10-01')
    await user.click(screen.getByRole('button', { name: /emitir pedido/i }))

    expect(onSubmit).toHaveBeenCalledWith({
      orderNumber: 'PED-9999',
      expectedDeliveryDate: '2026-10-01',
    })
  })

  it('chama onBack ao clicar em voltar, sem fechar o pop-up', async () => {
    const user = userEvent.setup()
    const onBack = vi.fn()
    render(<OrderGenerationForm {...baseProps()} onBack={onBack} />)

    await user.click(screen.getByRole('button', { name: /voltar/i }))

    expect(onBack).toHaveBeenCalledTimes(1)
  })
})
