import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { DeliveryPartialChecklist } from './DeliveryPartialChecklist'
import type { DeliveryOrderItemDetail } from './types'

function makeItem(overrides: Partial<DeliveryOrderItemDetail> = {}): DeliveryOrderItemDetail {
  return {
    id: 'oi1',
    materialCode: '1023',
    materialName: 'Cimento CP-II',
    materialDescription: null,
    unitOfMeasure: 'sc',
    quantity: 10,
    unitPrice: 30,
    deliveredAt: null,
    ...overrides,
  }
}

describe('DeliveryPartialChecklist', () => {
  it('mostra cada item com o rótulo de subpedido, marcado quando já chegou', () => {
    const items = [makeItem({ id: 'oi1', deliveredAt: null }), makeItem({ id: 'oi2', deliveredAt: '2026-09-20T00:00:00Z' })]
    render(<DeliveryPartialChecklist orderNumber="PC-100" items={items} isSaving={false} onToggleItem={vi.fn()} />)

    expect(screen.getByText('PC-100/001 · 1023')).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: /pc-100\/001/i })).not.toBeChecked()
    expect(screen.getByRole('checkbox', { name: /pc-100\/002/i })).toBeChecked()
  })

  it('chama onToggleItem com o id do item e o novo estado ao marcar', async () => {
    const user = userEvent.setup()
    const onToggleItem = vi.fn()
    render(<DeliveryPartialChecklist orderNumber="PC-100" items={[makeItem({ id: 'oi1' })]} isSaving={false} onToggleItem={onToggleItem} />)

    await user.click(screen.getByRole('checkbox'))
    expect(onToggleItem).toHaveBeenCalledWith('oi1', true)
  })

  it('desabilita os checkboxes enquanto está salvando', () => {
    render(<DeliveryPartialChecklist orderNumber="PC-100" items={[makeItem()]} isSaving onToggleItem={vi.fn()} />)
    expect(screen.getByRole('checkbox')).toBeDisabled()
  })
})
