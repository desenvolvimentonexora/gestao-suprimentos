import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ExtractedItemsReview } from './ExtractedItemsReview'
import type { ComparisonRequestItemRow, ExtractedItemReview } from './types'

const requestItems: ComparisonRequestItemRow[] = [
  { id: 'ri1', materialName: 'Argamassa', quantity: 20, unitOfMeasure: 'sc' },
  { id: 'ri2', materialName: 'Tinta', quantity: 5, unitOfMeasure: 'lt' },
]

const initialItems: ExtractedItemReview[] = [
  {
    description: 'Argamassa colante',
    quantity: 20,
    unitPrice: 32.5,
    leadTimeDays: 5,
    requestItemId: 'ri1',
    confidence: 0.8,
  },
  {
    description: 'Produto não identificado',
    quantity: 2,
    unitPrice: 10,
    leadTimeDays: null,
    requestItemId: null,
    confidence: 0,
  },
]

function baseProps() {
  return {
    items: initialItems,
    requestItems,
    onConfirm: vi.fn(),
    onCancel: vi.fn(),
    isSubmitting: false,
  }
}

describe('ExtractedItemsReview', () => {
  it('mostra a descrição extraída e o item sugerido pré-selecionado', () => {
    render(<ExtractedItemsReview {...baseProps()} />)
    expect(screen.getByText('Argamassa colante')).toBeInTheDocument()
    expect(screen.getAllByLabelText(/item do sistema/i)[0]).toHaveValue('ri1')
  })

  it('não pré-seleciona item quando não há correspondência (requestItemId nulo)', () => {
    render(<ExtractedItemsReview {...baseProps()} />)
    expect(screen.getAllByLabelText(/item do sistema/i)[1]).toHaveValue('')
  })

  it('permite corrigir o item, o preço e o prazo antes de confirmar', async () => {
    const user = userEvent.setup()
    const onConfirm = vi.fn()
    render(<ExtractedItemsReview {...baseProps()} onConfirm={onConfirm} />)

    const itemSelects = screen.getAllByLabelText(/item do sistema/i)
    await user.selectOptions(itemSelects[1]!, 'ri2')

    const priceInputs = screen.getAllByLabelText(/preço unitário/i)
    await user.clear(priceInputs[0]!)
    await user.type(priceInputs[0]!, '28')

    await user.click(screen.getByRole('button', { name: /confirmar itens/i }))

    expect(onConfirm).toHaveBeenCalledWith([
      expect.objectContaining({ requestItemId: 'ri1', unitPrice: 28 }),
      expect.objectContaining({ requestItemId: 'ri2' }),
    ])
  })

  it('não confirma itens sem item do sistema selecionado', async () => {
    const user = userEvent.setup()
    const onConfirm = vi.fn()
    render(<ExtractedItemsReview {...baseProps()} onConfirm={onConfirm} />)

    await user.click(screen.getByRole('button', { name: /confirmar itens/i }))

    expect(await screen.findByText(/selecione o item do sistema para todas as linhas/i)).toBeInTheDocument()
    expect(onConfirm).not.toHaveBeenCalled()
  })

  it('chama onCancel ao clicar em cancelar', async () => {
    const user = userEvent.setup()
    const onCancel = vi.fn()
    render(<ExtractedItemsReview {...baseProps()} onCancel={onCancel} />)
    await user.click(screen.getByRole('button', { name: /cancelar/i }))
    expect(onCancel).toHaveBeenCalled()
  })
})
