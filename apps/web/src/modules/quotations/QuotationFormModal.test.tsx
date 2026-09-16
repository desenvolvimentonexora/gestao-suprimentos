import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { QuotationFormModal } from './QuotationFormModal'
import type { NegotiatingRequestItemRow, SupplierOption } from './types'

const suppliers: SupplierOption[] = [
  { id: 's1', name: 'Fornecedor Alfa' },
  { id: 's2', name: 'Fornecedor Beta' },
]

const requestItems: NegotiatingRequestItemRow[] = [
  {
    id: 'i1',
    materialName: 'Cimento',
    materialCode: null,
    materialDescription: null,
    quantity: 10,
    unitOfMeasure: 'sc',
    statusCode: null,
    authorizedAt: null,
  },
]

function baseProps() {
  return {
    isOpen: true,
    onClose: vi.fn(),
    suppliers,
    requestItems,
    onSubmit: vi.fn(),
    isSubmitting: false,
  }
}

describe('QuotationFormModal', () => {
  it('mostra um campo de preço para cada item da requisição', () => {
    render(<QuotationFormModal {...baseProps()} />)
    expect(screen.getByText('Cimento')).toBeInTheDocument()
    expect(screen.getByLabelText(/preço unitário/i)).toBeInTheDocument()
  })

  it('exige fornecedor e preço ao enviar', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<QuotationFormModal {...baseProps()} onSubmit={onSubmit} />)

    await user.click(screen.getByRole('button', { name: /registrar cotação/i }))

    expect(await screen.findByText('Selecione o fornecedor.')).toBeInTheDocument()
    expect(await screen.findByText('Informe um preço válido.')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('envia os valores preenchidos', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<QuotationFormModal {...baseProps()} onSubmit={onSubmit} />)

    await user.selectOptions(screen.getByLabelText('Fornecedor'), 's1')
    await user.type(screen.getByLabelText(/preço unitário/i), '25.50')
    await user.type(screen.getByLabelText(/prazo \(dias\)/i), '5')
    await user.click(screen.getByRole('button', { name: /registrar cotação/i }))

    expect(onSubmit).toHaveBeenCalledWith({
      supplierId: 's1',
      freight: '',
      paymentTerms: '',
      items: [{ requestItemId: 'i1', unitPrice: '25.50', leadTimeDays: '5' }],
    })
  })

  it('mostra campos de frete e condição de pagamento no nível da cotação', () => {
    render(<QuotationFormModal {...baseProps()} />)
    expect(screen.getByLabelText(/frete/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/condição de pagamento/i)).toBeInTheDocument()
  })

  it('envia frete e condição de pagamento junto com os itens', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<QuotationFormModal {...baseProps()} onSubmit={onSubmit} />)

    await user.selectOptions(screen.getByLabelText('Fornecedor'), 's1')
    await user.type(screen.getByLabelText(/frete/i), '80')
    await user.type(screen.getByLabelText(/condição de pagamento/i), '30 DDL')
    await user.type(screen.getByLabelText(/preço unitário/i), '25.50')
    await user.click(screen.getByRole('button', { name: /registrar cotação/i }))

    expect(onSubmit).toHaveBeenCalledWith({
      supplierId: 's1',
      freight: '80',
      paymentTerms: '30 DDL',
      items: [{ requestItemId: 'i1', unitPrice: '25.50', leadTimeDays: '' }],
    })
  })
})
