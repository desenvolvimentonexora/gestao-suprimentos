import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { DeliveryOrderViewModal } from './DeliveryOrderViewModal'
import type { DeliveryOrderDetail } from './types'

function makeOrder(overrides: Partial<DeliveryOrderDetail> = {}): DeliveryOrderDetail {
  return {
    id: 'o1',
    orderNumber: 'PC-100',
    unitId: 'u1',
    unitName: 'UP Graça',
    apiStatus: 'issued',
    createdAt: '2026-09-01T00:00:00Z',
    expectedDeliveryDate: '2026-09-10',
    neededBy: '2026-09-08',
    negotiatorName: 'Lucas',
    deliveredAt: null,
    deliveryReceiptConfirmedAt: null,
    deliveryNotes: null,
    suppliers: [{ id: 's1', name: 'Fornecedor Alfa', city: null, contacts: [] }],
    items: [
      {
        id: 'i1',
        materialCode: '1023',
        materialName: 'Cimento CP-II',
        materialDescription: 'Cimento CP-II 50kg saco',
        unitOfMeasure: 'sc',
        quantity: 10,
        unitPrice: 30,
        deliveredAt: null,
      },
      {
        id: 'i2',
        materialCode: '2050',
        materialName: 'Areia',
        materialDescription: null,
        unitOfMeasure: 'm³',
        quantity: 5,
        unitPrice: 20,
        deliveredAt: '2026-09-05T00:00:00Z',
      },
    ],
    ...overrides,
  }
}

describe('DeliveryOrderViewModal', () => {
  it('mostra um spinner enquanto order ainda não chegou', () => {
    render(<DeliveryOrderViewModal isOpen order={undefined} onClose={vi.fn()} />)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.queryByText('Centro')).not.toBeInTheDocument()
  })

  it('mostra o grid de metadados com "—" quando negociador está ausente', () => {
    render(<DeliveryOrderViewModal isOpen order={makeOrder({ negotiatorName: null })} onClose={vi.fn()} />)
    expect(screen.getByText('Centro')).toBeInTheDocument()
    expect(screen.getByText('Negociado Por')).toBeInTheDocument()
    expect(screen.getAllByText('—').length).toBeGreaterThan(0)
    expect(screen.getByText('2')).toBeInTheDocument() // Subpedidos
    expect(screen.getByText('1')).toBeInTheDocument() // Itens Pendentes
  })

  it('lista só os itens pendentes na tabela de Insumos Pendentes', () => {
    render(<DeliveryOrderViewModal isOpen order={makeOrder()} onClose={vi.fn()} />)
    expect(screen.getByText('PC-100/001')).toBeInTheDocument()
    expect(screen.queryByText('PC-100/002')).not.toBeInTheDocument()
    expect(screen.getByText('Cimento CP-II 50kg saco')).toBeInTheDocument()
    expect(screen.queryByText('Areia')).not.toBeInTheDocument()
  })

  it('mostra mensagem de estado vazio quando não há itens pendentes', () => {
    const order = makeOrder({
      items: [
        {
          id: 'i1',
          materialCode: '1023',
          materialName: 'Cimento CP-II',
          materialDescription: null,
          unitOfMeasure: 'sc',
          quantity: 10,
          unitPrice: 30,
          deliveredAt: '2026-09-05T00:00:00Z',
        },
      ],
    })
    render(<DeliveryOrderViewModal isOpen order={order} onClose={vi.fn()} />)
    expect(screen.getByText(/nenhum item pendente/i)).toBeInTheDocument()
  })
})
