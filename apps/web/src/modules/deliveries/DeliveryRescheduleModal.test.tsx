import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { DeliveryRescheduleModal } from './DeliveryRescheduleModal'
import type { DeliveryOrderDetail } from './types'

function makeOrder(overrides: Partial<DeliveryOrderDetail> = {}): DeliveryOrderDetail {
  return {
    id: 'o1',
    orderNumber: 'PC-100',
    unitId: 'u1',
    unitName: 'UP Graça',
    apiStatus: 'issued',
    createdAt: '2026-09-01T00:00:00Z',
    expectedDeliveryDate: '2026-09-20',
    neededBy: null,
    negotiatorName: null,
    deliveredAt: null,
    deliveryReceiptConfirmedAt: null,
    deliveryNotes: null,
    suppliers: [{ id: 's1', name: 'Fornecedor Alfa', city: null, contacts: [] }],
    items: [
      {
        id: 'i1',
        materialCode: null,
        materialName: 'Cimento',
        materialDescription: null,
        unitOfMeasure: 'sc',
        quantity: 10,
        unitPrice: 30,
        deliveredAt: null,
      },
    ],
    ...overrides,
  }
}

describe('DeliveryRescheduleModal', () => {
  it('mostra o PC, fornecedor e a data atual por extenso', () => {
    render(<DeliveryRescheduleModal isOpen order={makeOrder()} isSaving={false} onClose={vi.fn()} onConfirm={vi.fn()} />)
    expect(screen.getByText(/PC-100 \(1 subpedido\) · Fornecedor Alfa/)).toBeInTheDocument()
    expect(screen.getByText(/Data atual de entrega: domingo, 20 de setembro de 2026/)).toBeInTheDocument()
  })

  it('mostra erro e não chama onConfirm quando a nova data não é informada', async () => {
    const user = userEvent.setup()
    const onConfirm = vi.fn()
    render(<DeliveryRescheduleModal isOpen order={makeOrder()} isSaving={false} onClose={vi.fn()} onConfirm={onConfirm} />)

    await user.click(screen.getByRole('button', { name: 'Confirmar Reagendamento' }))

    expect(screen.getByText('Informe a nova data de entrega.')).toBeInTheDocument()
    expect(onConfirm).not.toHaveBeenCalled()
  })

  it('mostra erro quando a nova data é igual à atual', async () => {
    const user = userEvent.setup()
    render(<DeliveryRescheduleModal isOpen order={makeOrder()} isSaving={false} onClose={vi.fn()} onConfirm={vi.fn()} />)

    await user.type(screen.getByLabelText('Nova Data de Entrega'), '2026-09-20')
    await user.click(screen.getByRole('button', { name: 'Confirmar Reagendamento' }))

    expect(screen.getByText('A nova data precisa ser diferente da atual.')).toBeInTheDocument()
  })

  it('chama onConfirm com a nova data e o motivo quando válido', async () => {
    const user = userEvent.setup()
    const onConfirm = vi.fn()
    render(<DeliveryRescheduleModal isOpen order={makeOrder()} isSaving={false} onClose={vi.fn()} onConfirm={onConfirm} />)

    await user.type(screen.getByLabelText('Nova Data de Entrega'), '2026-09-25')
    await user.type(screen.getByLabelText('Motivo (opcional)'), 'Atraso do fornecedor')
    await user.click(screen.getByRole('button', { name: 'Confirmar Reagendamento' }))

    expect(onConfirm).toHaveBeenCalledWith({ newDate: '2026-09-25', reason: 'Atraso do fornecedor' })
  })

  it('chama onClose ao clicar em Cancelar', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(<DeliveryRescheduleModal isOpen order={makeOrder()} isSaving={false} onClose={onClose} onConfirm={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: 'Cancelar' }))

    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
