import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { RequestsTable } from './RequestsTable'
import type { RequestRow, UnitOption } from './types'

const units: UnitOption[] = [{ id: 'u1', name: 'UP Graça' }]

const requests: RequestRow[] = [
  {
    id: 'r1',
    unitId: 'u1',
    unitName: 'UP Graça',
    status: 'open',
    neededBy: '2026-09-20',
    externalRef: 'SOL-1',
    items: [{ id: 'i1', materialId: 'm1', materialName: 'Cimento', quantity: 10, unitOfMeasure: 'sc' }],
  },
]

function baseProps() {
  return {
    requests,
    units,
    search: '',
    onSearchChange: vi.fn(),
    statusFilter: null,
    onStatusFilterChange: vi.fn(),
    unitFilter: null,
    onUnitFilterChange: vi.fn(),
    onAddRequest: vi.fn(),
    onEditRequest: vi.fn(),
    onSendToNegotiation: vi.fn(),
    onCancelRequest: vi.fn(),
  }
}

describe('RequestsTable', () => {
  it('mostra as requisições com unidade, prazo, status e itens', () => {
    render(<RequestsTable {...baseProps()} />)
    expect(screen.getByText('UP Graça', { selector: 'td' })).toBeInTheDocument()
    expect(screen.getByText('SOL-1')).toBeInTheDocument()
    expect(screen.getByText('1 item')).toBeInTheDocument()
  })

  it('mostra o estado vazio quando não há requisições', () => {
    render(<RequestsTable {...baseProps()} requests={[]} />)
    expect(
      screen.getByText('Nenhuma requisição ainda. Importe uma planilha ou crie a primeira.'),
    ).toBeInTheDocument()
  })

  it('chama onAddRequest ao clicar em nova requisição', async () => {
    const user = userEvent.setup()
    const onAddRequest = vi.fn()
    render(<RequestsTable {...baseProps()} onAddRequest={onAddRequest} />)
    await user.click(screen.getByRole('button', { name: /nova requisição/i }))
    expect(onAddRequest).toHaveBeenCalled()
  })

  it('chama onSendToNegotiation ao clicar em enviar para cotação', async () => {
    const user = userEvent.setup()
    const onSendToNegotiation = vi.fn()
    render(<RequestsTable {...baseProps()} onSendToNegotiation={onSendToNegotiation} />)
    await user.click(screen.getByRole('button', { name: /enviar para cotação/i }))
    expect(onSendToNegotiation).toHaveBeenCalledWith('r1')
  })
})
