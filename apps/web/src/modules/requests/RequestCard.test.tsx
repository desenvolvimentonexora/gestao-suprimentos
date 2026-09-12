import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { RequestCard } from './RequestCard'
import type { RequestRow } from './types'

const baseRequest: RequestRow = {
  id: 'r1',
  unitId: 'u1',
  unitName: 'Depósito Simões Filho',
  status: 'open',
  neededBy: '2026-09-18',
  externalRef: '1243',
  createdAt: '2026-09-10T00:00:00Z',
  subjectCategory: null,
  notes: null,
  negotiatorId: null,
  negotiatorName: null,
  negotiatingStartedAt: null,
  quotationsCount: 0,
  items: [
    {
      id: 'i1',
      materialId: 'm1',
      materialName: 'Cimento CP-II',
      materialCode: '1023',
      materialDescription: 'Cimento CP-II 50kg saco',
      quantity: 10,
      unitOfMeasure: 'saco',
      statusCode: 'OK',
      authorizedAt: '2026-09-11',
    },
    {
      id: 'i2',
      materialId: 'm2',
      materialName: 'Areia',
      materialCode: null,
      materialDescription: null,
      quantity: 5,
      unitOfMeasure: 'm³',
      statusCode: null,
      authorizedAt: null,
    },
  ],
}

function baseProps() {
  return {
    request: baseRequest,
    today: new Date('2026-09-15T12:00:00'),
    onEditRequest: vi.fn(),
    onDispatch: vi.fn(),
    onCancelRequest: vi.fn(),
    onNegotiateDirectly: vi.fn(),
    onUpdateNotes: vi.fn(),
  }
}

describe('RequestCard', () => {
  it('mostra os dados do cabeçalho, incluindo o badge de prazo restante', () => {
    render(<RequestCard {...baseProps()} />)
    expect(screen.getByText('1243')).toBeInTheDocument()
    expect(screen.getByText('Depósito Simões Filho')).toBeInTheDocument()
    expect(screen.getByText('2 itens')).toBeInTheDocument()
    expect(screen.getByText('3 dias restantes')).toBeInTheDocument()
  })

  it('mostra o badge de atraso quando o prazo já venceu', () => {
    render(
      <RequestCard
        {...baseProps()}
        request={{ ...baseRequest, neededBy: '2026-09-10' }}
      />,
    )
    expect(screen.getByText('5 dias atrasada')).toBeInTheDocument()
  })

  it('não mostra a expansão por padrão', () => {
    render(<RequestCard {...baseProps()} />)
    expect(screen.queryByText('1023 · Cimento CP-II')).not.toBeInTheDocument()
  })

  it('expande ao clicar no corpo do card, mostrando itens e observação', async () => {
    const user = userEvent.setup()
    render(<RequestCard {...baseProps()} />)

    await user.click(screen.getByText('1243'))

    expect(screen.getByText('1023 · Cimento CP-II')).toBeInTheDocument()
    expect(screen.getByText('Areia')).toBeInTheDocument()
    expect(screen.getByLabelText('Observação')).toBeInTheDocument()
  })

  it('mostra o código do material na coluna Insumo-Sub, com o nome como reserva sem código', async () => {
    const user = userEvent.setup()
    render(<RequestCard {...baseProps()} />)
    await user.click(screen.getByText('1243'))

    expect(screen.getByText('1023 · Cimento CP-II')).toBeInTheDocument()
    expect(screen.getByText('Areia')).toBeInTheDocument()
  })

  it('mostra a descrição do material na coluna Especificação, ou "—" quando não há', async () => {
    const user = userEvent.setup()
    render(<RequestCard {...baseProps()} />)
    await user.click(screen.getByText('1243'))

    expect(screen.getByText('Cimento CP-II 50kg saco')).toBeInTheDocument()
    const areiaRow = screen.getByText('Areia').closest('tr')
    expect(areiaRow?.textContent).toContain('—')
  })

  it('mostra a referência formatada de cada item na expansão', async () => {
    const user = userEvent.setup()
    render(<RequestCard {...baseProps()} />)
    await user.click(screen.getByText('1243'))

    expect(screen.getByText('1243/001')).toBeInTheDocument()
    expect(screen.getByText('1243/002')).toBeInTheDocument()
  })

  it('recolhe ao clicar novamente no corpo do card', async () => {
    const user = userEvent.setup()
    render(<RequestCard {...baseProps()} />)

    await user.click(screen.getByText('1243'))
    expect(screen.getByText('1023 · Cimento CP-II')).toBeInTheDocument()

    await user.click(screen.getByText('1243'))
    expect(screen.queryByText('1023 · Cimento CP-II')).not.toBeInTheDocument()
  })

  it('não expande ao clicar nos ícones de ação (Editar/Cancelar)', async () => {
    const user = userEvent.setup()
    const onEditRequest = vi.fn()
    render(<RequestCard {...baseProps()} onEditRequest={onEditRequest} />)

    await user.click(screen.getByRole('button', { name: /editar requisição/i }))

    expect(onEditRequest).toHaveBeenCalledWith('r1')
    expect(screen.queryByText('1023 · Cimento CP-II')).not.toBeInTheDocument()
  })

  it('chama onUpdateNotes ao sair do campo de observação', async () => {
    const user = userEvent.setup()
    const onUpdateNotes = vi.fn()
    render(<RequestCard {...baseProps()} onUpdateNotes={onUpdateNotes} />)
    await user.click(screen.getByText('1243'))

    await user.type(screen.getByLabelText('Observação'), 'Confirmar com o fornecedor')
    await user.tab()

    expect(onUpdateNotes).toHaveBeenCalledWith('r1', 'Confirmar com o fornecedor')
  })

  it('chama onDispatch ao clicar em Disparar SOL na expansão', async () => {
    const user = userEvent.setup()
    const onDispatch = vi.fn()
    render(<RequestCard {...baseProps()} onDispatch={onDispatch} />)
    await user.click(screen.getByText('1243'))

    await user.click(screen.getByRole('button', { name: 'Disparar SOL' }))

    expect(onDispatch).toHaveBeenCalledWith('r1')
  })

  it('não mostra o atalho de negociar quando não há cotações', async () => {
    const user = userEvent.setup()
    render(<RequestCard {...baseProps()} />)
    await user.click(screen.getByText('1243'))

    expect(screen.queryByText(/negociar/i)).not.toBeInTheDocument()
  })

  it('mostra e aciona o atalho de negociar quando há cotações registradas', async () => {
    const user = userEvent.setup()
    const onNegotiateDirectly = vi.fn()
    render(
      <RequestCard
        {...baseProps()}
        request={{ ...baseRequest, quotationsCount: 3 }}
        onNegotiateDirectly={onNegotiateDirectly}
      />,
    )
    await user.click(screen.getByText('1243'))

    const button = screen.getByRole('button', { name: /tenho 3 orçamentos/i })
    await user.click(button)

    expect(onNegotiateDirectly).toHaveBeenCalledWith('r1')
  })
})
