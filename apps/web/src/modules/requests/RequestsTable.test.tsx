import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { RequestsTable } from './RequestsTable'
import type { RequestRow, UnitOption } from './types'

const units: UnitOption[] = [{ id: 'u1', name: 'UP Graça' }]

function makeRequest(overrides: Partial<RequestRow>): RequestRow {
  return {
    id: 'r1',
    unitId: 'u1',
    unitName: 'UP Graça',
    status: 'open',
    neededBy: '2026-09-20',
    externalRef: 'SOL-1',
    createdAt: '2026-09-01T00:00:00Z',
    subjectCategory: null,
    notes: null,
    negotiatorId: null,
    negotiatorName: null,
    negotiatingStartedAt: null,
    items: [{ id: 'i1', materialId: 'm1', materialName: 'Cimento', quantity: 10, unitOfMeasure: 'sc' }],
    ...overrides,
  }
}

function baseProps() {
  return {
    requests: [makeRequest({})],
    units,
    today: new Date('2026-09-11T12:00:00'),
    search: '',
    onSearchChange: vi.fn(),
    statusFilter: null,
    onStatusFilterChange: vi.fn(),
    unitFilter: null,
    onUnitFilterChange: vi.fn(),
    onAddRequest: vi.fn(),
    onEditRequest: vi.fn(),
    onDispatch: vi.fn(),
    onCancelRequest: vi.fn(),
  }
}

describe('RequestsTable', () => {
  it('mostra as requisições com unidade, prazo, status e itens', () => {
    render(<RequestsTable {...baseProps()} />)
    expect(screen.getByText('UP Graça', { selector: 'span' })).toBeInTheDocument()
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

  it('chama onDispatch ao clicar em disparar', async () => {
    const user = userEvent.setup()
    const onDispatch = vi.fn()
    render(<RequestsTable {...baseProps()} onDispatch={onDispatch} />)
    await user.click(screen.getByRole('button', { name: /disparar/i }))
    expect(onDispatch).toHaveBeenCalledWith('r1')
  })

  it('marca visualmente uma requisição atrasada', () => {
    render(
      <RequestsTable
        {...baseProps()}
        requests={[makeRequest({ id: 'r2', neededBy: '2026-09-01', status: 'negotiating' })]}
      />,
    )
    expect(screen.getByTestId('request-card-r2').className).toContain('border-l-red')
    expect(screen.getByText(/atrasada/i)).toBeInTheDocument()
  })

  it('não marca como atrasada uma requisição sem prazo vencido', () => {
    render(<RequestsTable {...baseProps()} />)
    expect(screen.getByTestId('request-card-r1').className).not.toContain('border-l-red')
  })
})
