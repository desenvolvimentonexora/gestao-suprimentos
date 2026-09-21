import type { ComponentProps } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { DeliveryOrderDetailModal } from './DeliveryOrderDetailModal'
import { openMailto } from './buildMailtoUrl'
import type { DeliveryOrderDetail } from './types'

vi.mock('./buildMailtoUrl', () => ({ openMailto: vi.fn() }))

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
    suppliers: [
      {
        id: 's1',
        name: 'Fornecedor Alfa',
        city: 'Salvador',
        contacts: [{ id: 'c1', name: 'Contato Alfa', phone: '71999998888', email: 'alfa@example.com' }],
      },
    ],
    items: [
      {
        id: 'i1',
        materialCode: '1023',
        materialName: 'Cimento CP-II',
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

function baseProps(overrides: Partial<ComponentProps<typeof DeliveryOrderDetailModal>> = {}) {
  return {
    isOpen: true,
    order: makeOrder(),
    today: new Date('2026-09-20T12:00:00'),
    onClose: vi.fn(),
    onViewOrder: vi.fn(),
    onReschedule: vi.fn(),
    onMarkDelivered: vi.fn(),
    isMarkingDelivered: false,
    onToggleItemDelivered: vi.fn(),
    isTogglingItem: false,
    onSaveNotes: vi.fn(),
    isSavingNotes: false,
    ...overrides,
  }
}

describe('DeliveryOrderDetailModal', () => {
  it('mostra um spinner de carregamento quando order ainda não chegou', () => {
    render(<DeliveryOrderDetailModal {...baseProps({ order: undefined })} />)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.queryByText('Obra:')).not.toBeInTheDocument()
  })

  it('mostra o número do pedido, obra, fornecedor e valor total', () => {
    render(<DeliveryOrderDetailModal {...baseProps()} />)
    expect(screen.getByRole('dialog', { name: 'Pedido PC-100' })).toBeInTheDocument()
    expect(screen.getByText(/Obra:/)).toBeInTheDocument()
    expect(screen.getByText('UP Graça')).toBeInTheDocument()
    expect(screen.getAllByText(/Fornecedor Alfa/).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/R\$\s?300,00/).length).toBeGreaterThan(0)
  })

  it('mostra o contato do fornecedor (telefone, e-mail, cidade)', () => {
    render(<DeliveryOrderDetailModal {...baseProps()} />)
    expect(screen.getByText('71999998888')).toBeInTheDocument()
    expect(screen.getByText('alfa@example.com')).toBeInTheDocument()
    expect(screen.getByText('Salvador')).toBeInTheDocument()
  })

  it('chama onViewOrder ao clicar na linha do PC ou no botão Ver Pedido', async () => {
    const user = userEvent.setup()
    const onViewOrder = vi.fn()
    render(<DeliveryOrderDetailModal {...baseProps({ onViewOrder })} />)

    await user.click(screen.getByText(/PC PC-100/))
    expect(onViewOrder).toHaveBeenCalledWith('o1')

    await user.click(screen.getByRole('button', { name: 'Ver Pedido' }))
    expect(onViewOrder).toHaveBeenCalledTimes(2)
  })

  it('chama onReschedule ao clicar em Reagendar', async () => {
    const user = userEvent.setup()
    const onReschedule = vi.fn()
    render(<DeliveryOrderDetailModal {...baseProps({ onReschedule })} />)
    await user.click(screen.getByRole('button', { name: 'Reagendar' }))
    expect(onReschedule).toHaveBeenCalledWith('o1')
  })

  it('chama onMarkDelivered ao clicar em Pedido Chegou', async () => {
    const user = userEvent.setup()
    const onMarkDelivered = vi.fn()
    render(<DeliveryOrderDetailModal {...baseProps({ onMarkDelivered })} />)
    await user.click(screen.getByRole('button', { name: 'Pedido Chegou' }))
    expect(onMarkDelivered).toHaveBeenCalledWith('o1')
  })

  it('mostra "Chegou em {data}" em vez do botão quando o pedido já chegou', () => {
    render(<DeliveryOrderDetailModal {...baseProps({ order: makeOrder({ deliveredAt: '2026-09-18T00:00:00Z' }) })} />)
    expect(screen.queryByRole('button', { name: 'Pedido Chegou' })).not.toBeInTheDocument()
    expect(screen.getByText(/Chegou em/)).toBeInTheDocument()
  })

  it('abre a lista de Entrega Parcial ao clicar no botão correspondente', async () => {
    const user = userEvent.setup()
    render(<DeliveryOrderDetailModal {...baseProps()} />)
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Entrega Parcial' }))
    expect(screen.getByRole('checkbox')).toBeInTheDocument()
  })

  it('desabilita Enviar Cobrança/WhatsApp quando o fornecedor não tem e-mail/telefone', () => {
    const order = makeOrder({
      suppliers: [{ id: 's1', name: 'Fornecedor Alfa', city: null, contacts: [{ id: 'c1', name: 'Contato', phone: null, email: null }] }],
    })
    render(<DeliveryOrderDetailModal {...baseProps({ order })} />)
    expect(screen.getByRole('button', { name: 'Enviar Cobrança' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'WhatsApp' })).toBeDisabled()
  })

  it('abre o mailto pré-preenchido ao clicar em Enviar Cobrança', async () => {
    const user = userEvent.setup()
    render(<DeliveryOrderDetailModal {...baseProps()} />)
    await user.click(screen.getByRole('button', { name: 'Enviar Cobrança' }))
    expect(openMailto).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'alfa@example.com', subject: expect.stringContaining('PC-100') }),
    )
  })
})
