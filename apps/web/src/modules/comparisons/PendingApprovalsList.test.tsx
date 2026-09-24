import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { PendingApprovalsList } from './PendingApprovalsList'
import type { PendingApprovalRow } from './types'

function makeRow(overrides: Partial<PendingApprovalRow> = {}): PendingApprovalRow {
  return {
    comparisonId: 'c1',
    requestId: 'r1',
    unitName: 'UP Graça',
    externalRef: null,
    sequenceNumber: 1,
    totalValue: 850,
    itemCount: 3,
    supplierCount: 2,
    paymentConditionNote: '30 DDL',
    note: null,
    submittedByName: 'Admin Construtora Beta',
    submittedAt: '2026-09-16T12:00:00Z',
    ...overrides,
  }
}

function baseProps(rows: PendingApprovalRow[] = [makeRow()]) {
  return {
    rows,
    onApprove: vi.fn(),
    onReject: vi.fn(),
    isSubmitting: false,
  }
}

describe('PendingApprovalsList', () => {
  it('mostra o chip com a contagem de comparações aguardando aprovação', () => {
    render(<PendingApprovalsList {...baseProps([makeRow(), makeRow({ comparisonId: 'c2' })])} />)
    expect(screen.getByText('2 aguardando aprovação')).toBeInTheDocument()
  })

  it('mostra o rótulo da seção (em caixa alta via CSS, não texto literal maiúsculo)', () => {
    render(<PendingApprovalsList {...baseProps()} />)
    const label = screen.getByText(/aguardando sua decisão · aprovar ou rejeitar/i)
    expect(label).toBeInTheDocument()
    expect(label.className).toContain('uppercase')
  })

  it('mostra número da SOL e nome da unidade no título do card', () => {
    render(<PendingApprovalsList {...baseProps()} />)
    expect(screen.getByText(/SOL 1/)).toBeInTheDocument()
    expect(screen.getByText(/UP Graça/)).toBeInTheDocument()
  })

  it('usa o número externo (do ERP) em vez de "SOL n" quando presente', () => {
    render(<PendingApprovalsList {...baseProps([makeRow({ externalRef: 'SOL-1' })])} />)
    expect(screen.getByText(/SOL-1/)).toBeInTheDocument()
    expect(screen.queryByText(/^SOL 1$/)).not.toBeInTheDocument()
  })

  it('mostra a condição de pagamento quando presente', () => {
    render(<PendingApprovalsList {...baseProps()} />)
    expect(screen.getByText('30 DDL')).toBeInTheDocument()
  })

  it('mostra quem enviou e quando', () => {
    render(<PendingApprovalsList {...baseProps()} />)
    expect(screen.getByText(/^por Admin Construtora Beta em/)).toBeInTheDocument()
  })

  it('mostra o resumo com valor, itens e fornecedores', () => {
    render(<PendingApprovalsList {...baseProps()} />)
    expect(screen.getByText(/R\$\s?850,00/)).toBeInTheDocument()
    expect(screen.getByText(/3 itens/)).toBeInTheDocument()
    expect(screen.getByText(/2 fornecedores/)).toBeInTheDocument()
  })

  it('mostra a observação quando presente', () => {
    render(<PendingApprovalsList {...baseProps([makeRow({ note: 'Cliente pediu urgência.' })])} />)
    expect(screen.getByText(/Cliente pediu urgência\./)).toBeInTheDocument()
  })

  it('não mostra observação quando ausente', () => {
    render(<PendingApprovalsList {...baseProps()} />)
    expect(screen.queryByText(/💬/)).not.toBeInTheDocument()
  })

  it('mostra os botões Ver, Aprovar e Rejeitar, sem o campo de motivo em repouso', () => {
    render(<PendingApprovalsList {...baseProps()} />)
    expect(screen.getByRole('button', { name: 'Ver' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /aprovar/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /rejeitar/i })).toBeInTheDocument()
    expect(screen.queryByLabelText(/motivo da rejeição/i)).not.toBeInTheDocument()
  })

  it('chama onApprove ao clicar em aprovar', async () => {
    const user = userEvent.setup()
    const onApprove = vi.fn()
    render(<PendingApprovalsList {...baseProps()} onApprove={onApprove} />)
    await user.click(screen.getByRole('button', { name: /aprovar/i }))
    expect(onApprove).toHaveBeenCalledWith('c1')
  })

  it('clicar em Rejeitar abre o campo de motivo e troca os botões pela confirmação', async () => {
    const user = userEvent.setup()
    render(<PendingApprovalsList {...baseProps()} />)

    await user.click(screen.getByRole('button', { name: /rejeitar/i }))

    expect(screen.getByLabelText(/motivo da rejeição/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Confirmar rejeição' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^rejeitar$/i })).not.toBeInTheDocument()
  })

  it('exige motivo antes de confirmar rejeição', async () => {
    const user = userEvent.setup()
    const onReject = vi.fn()
    render(<PendingApprovalsList {...baseProps()} onReject={onReject} />)

    await user.click(screen.getByRole('button', { name: /rejeitar/i }))
    await user.click(screen.getByRole('button', { name: 'Confirmar rejeição' }))
    expect(onReject).not.toHaveBeenCalled()
    expect(screen.getByText('Informe o motivo da rejeição.')).toBeInTheDocument()
  })

  it('chama onReject com o motivo preenchido', async () => {
    const user = userEvent.setup()
    const onReject = vi.fn()
    render(<PendingApprovalsList {...baseProps()} onReject={onReject} />)

    await user.click(screen.getByRole('button', { name: /rejeitar/i }))
    await user.type(screen.getByLabelText(/motivo da rejeição/i), 'Preço acima do orçamento')
    await user.click(screen.getByRole('button', { name: 'Confirmar rejeição' }))
    expect(onReject).toHaveBeenCalledWith('c1', 'Preço acima do orçamento')
  })

  it('cancelar fecha o campo de motivo e volta aos botões normais', async () => {
    const user = userEvent.setup()
    render(<PendingApprovalsList {...baseProps()} />)

    await user.click(screen.getByRole('button', { name: /rejeitar/i }))
    await user.click(screen.getByRole('button', { name: 'Cancelar' }))

    expect(screen.queryByLabelText(/motivo da rejeição/i)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /rejeitar/i })).toBeInTheDocument()
  })

  it('mostra mensagem de estado vazio quando não há aprovações pendentes', () => {
    render(<PendingApprovalsList {...baseProps([])} />)
    expect(screen.getByText(/nenhuma comparação aguardando aprovação/i)).toBeInTheDocument()
  })
})
