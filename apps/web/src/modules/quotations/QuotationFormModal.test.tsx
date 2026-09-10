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
  { id: 'i1', materialName: 'Cimento', quantity: 10, unitOfMeasure: 'sc' },
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
      items: [{ requestItemId: 'i1', unitPrice: '25.50', leadTimeDays: '5' }],
    })
  })
})
