import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { NegotiatingRequestCard } from './NegotiatingRequestCard'
import type { NegotiatingRequestRow, NegotiatorOption } from './types'

const negotiators: NegotiatorOption[] = [
  { id: 'n1', name: 'Lucas' },
  { id: 'n2', name: 'Tais' },
]

const request: NegotiatingRequestRow = {
  id: 'r1',
  unitId: 'u1',
  unitName: 'UP Graça',
  neededBy: '2026-09-01',
  neededByChanged: false,
  externalRef: 'SOL-1',
  createdAt: '2026-08-20T00:00:00Z',
  notes: null,
  negotiatorId: 'n1',
  negotiatorName: 'Lucas',
  negotiatingStartedAt: '2026-09-05T00:00:00Z',
  items: [{ id: 'i1', materialName: 'Cimento', quantity: 10, unitOfMeasure: 'sc' }],
  quotations: [
    { id: 'q1', supplierId: 's1', supplierName: 'Fornecedor Alfa', status: 'received', submittedAt: null },
  ],
}

function baseProps() {
  return {
    request,
    negotiators,
    today: new Date('2026-09-11T12:00:00'),
    onAssignNegotiator: vi.fn(),
    onRegisterQuotation: vi.fn(),
    onDiscardQuotation: vi.fn(),
    onUpdateNotes: vi.fn(),
    onSendBackToDispatch: vi.fn(),
    onFinalizeNegotiation: vi.fn(),
  }
}

describe('NegotiatingRequestCard', () => {
  it('mostra unidade, n° externo e a contagem de itens da requisição', () => {
    render(<NegotiatingRequestCard {...baseProps()} />)
    expect(screen.getByText('UP Graça', { selector: 'span' })).toBeInTheDocument()
    expect(screen.getByText('SOL-1')).toBeInTheDocument()
    expect(screen.getByText('1 item')).toBeInTheDocument()
  })

  it('mostra os itens detalhados ao expandir', async () => {
    const user = userEvent.setup()
    render(<NegotiatingRequestCard {...baseProps()} />)
    await user.click(screen.getByRole('button', { name: /expandir/i }))
    expect(screen.getByText(/cimento/i)).toBeInTheDocument()
  })

  it('mostra o negociador atribuído e permite reatribuir', async () => {
    const user = userEvent.setup()
    const onAssignNegotiator = vi.fn()
    render(<NegotiatingRequestCard {...baseProps()} onAssignNegotiator={onAssignNegotiator} />)

    const select = screen.getByLabelText(/negociador/i)
    expect(select).toHaveValue('n1')
    await user.selectOptions(select, 'n2')
    expect(onAssignNegotiator).toHaveBeenCalledWith('r1', 'n2')
  })

  it('mostra o badge "Só falta equalizar" em estilo contorno, com ícone', () => {
    render(<NegotiatingRequestCard {...baseProps()} />)
    const badge = screen.getByText('Só falta equalizar')
    expect(badge.closest('span')?.querySelector('svg')).toBeInTheDocument()
    expect(badge.closest('span')?.className).not.toContain('bg-amber')
  })

  it('mostra o badge de dias em negociação preenchido em âmbar, com ícone', () => {
    render(<NegotiatingRequestCard {...baseProps()} />)
    const badge = screen.getByText(/em negociação há 6 dias/i)
    expect(badge.closest('span')?.querySelector('svg')).toBeInTheDocument()
    expect(badge.closest('span')?.className).toContain('amber')
  })

  it('mostra atrasada com a contagem de dias quando o prazo já passou', () => {
    render(<NegotiatingRequestCard {...baseProps()} />)
    // today 2026-09-11, neededBy 2026-09-01 → 10 dias
    expect(screen.getByText(/atrasada 10d/i)).toBeInTheDocument()
  })

  it('marca o card com fundo e borda de atraso quando o prazo já passou', () => {
    render(<NegotiatingRequestCard {...baseProps()} />)
    expect(screen.getByTestId('negotiating-card-r1').className).toContain('border-l-red')
  })

  it('não marca o card como atrasado quando o prazo ainda não venceu', () => {
    render(<NegotiatingRequestCard {...baseProps()} request={{ ...request, neededBy: '2026-09-20' }} />)
    expect(screen.getByTestId('negotiating-card-r1').className).not.toContain('border-l-red')
    expect(screen.queryByText(/atrasada/i)).not.toBeInTheDocument()
  })

  it('mostra a tag "data alterada" quando needed_by_changed é true', () => {
    render(<NegotiatingRequestCard {...baseProps()} request={{ ...request, neededByChanged: true }} />)
    expect(screen.getByText(/data alterada/i)).toBeInTheDocument()
  })

  it('não mostra a tag "data alterada" quando needed_by_changed é false', () => {
    render(<NegotiatingRequestCard {...baseProps()} />)
    expect(screen.queryByText(/data alterada/i)).not.toBeInTheDocument()
  })

  it('estiliza o seletor de negociador com a cor do negociador atribuído', () => {
    render(<NegotiatingRequestCard {...baseProps()} />)
    const select = screen.getByLabelText(/negociador/i)
    expect(select.className).not.toBe('')
  })

  it('expande e mostra a tabela de itens, observação e ações ao clicar no card', async () => {
    const user = userEvent.setup()
    render(<NegotiatingRequestCard {...baseProps()} />)

    expect(screen.queryByRole('button', { name: /voltar pro disparo/i })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /expandir/i }))

    expect(screen.getByRole('button', { name: /voltar pro disparo/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /finalizar negociação/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /liberar sem equalizar/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/observação/i)).toBeInTheDocument()
  })

  it('chama onSendBackToDispatch ao clicar em voltar pro disparo', async () => {
    const user = userEvent.setup()
    const onSendBackToDispatch = vi.fn()
    render(<NegotiatingRequestCard {...baseProps()} onSendBackToDispatch={onSendBackToDispatch} />)
    await user.click(screen.getByRole('button', { name: /expandir/i }))
    await user.click(screen.getByRole('button', { name: /voltar pro disparo/i }))
    expect(onSendBackToDispatch).toHaveBeenCalledWith('r1')
  })

  it('chama onFinalizeNegotiation ao clicar em finalizar negociação', async () => {
    const user = userEvent.setup()
    const onFinalizeNegotiation = vi.fn()
    render(<NegotiatingRequestCard {...baseProps()} onFinalizeNegotiation={onFinalizeNegotiation} />)
    await user.click(screen.getByRole('button', { name: /expandir/i }))
    await user.click(screen.getByRole('button', { name: /finalizar negociação/i }))
    expect(onFinalizeNegotiation).toHaveBeenCalledWith('r1')
  })

  it('mostra "Em breve" ao clicar em liberar sem equalizar', async () => {
    const user = userEvent.setup()
    render(<NegotiatingRequestCard {...baseProps()} />)
    await user.click(screen.getByRole('button', { name: /expandir/i }))
    await user.click(screen.getByRole('button', { name: /liberar sem equalizar/i }))
    expect(screen.getByText('Em breve')).toBeInTheDocument()
  })

  it('mostra as cotações já registradas', async () => {
    const user = userEvent.setup()
    render(<NegotiatingRequestCard {...baseProps()} />)
    await user.click(screen.getByRole('button', { name: /expandir/i }))
    expect(screen.getByText('Fornecedor Alfa')).toBeInTheDocument()
  })

  it('chama onDiscardQuotation ao descartar uma cotação', async () => {
    const user = userEvent.setup()
    const onDiscardQuotation = vi.fn()
    render(<NegotiatingRequestCard {...baseProps()} onDiscardQuotation={onDiscardQuotation} />)
    await user.click(screen.getByRole('button', { name: /expandir/i }))
    await user.click(screen.getByRole('button', { name: /descartar cotação de fornecedor alfa/i }))
    expect(onDiscardQuotation).toHaveBeenCalledWith('q1')
  })
})
