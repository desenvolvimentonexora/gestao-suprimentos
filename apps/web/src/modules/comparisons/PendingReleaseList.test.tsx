import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { PendingReleaseList } from './PendingReleaseList'
import type { PendingReleaseRow } from './types'

function makeRow(overrides: Partial<PendingReleaseRow> = {}): PendingReleaseRow {
  return {
    comparisonId: 'c1',
    requestId: 'r1',
    unitName: 'Depósito Simões Filho',
    externalRef: null,
    sequenceNumber: 3,
    totalValue: 1234.5,
    itemCount: 2,
    supplierCount: 1,
    paymentConditionNote: 'À vista',
    note: null,
    submittedByName: 'Admin Construtora Beta',
    submittedAt: '2026-09-16T12:00:00Z',
    approvedByName: 'Admin Construtora Beta',
    approvedAt: '2026-09-16T13:00:00Z',
    financialChargeRequested: false,
    paymentProofConfirmedAt: null,
    ...overrides,
  }
}

function baseProps(rows: PendingReleaseRow[] = [makeRow()]) {
  return {
    rows,
    onConfirmPaymentProof: vi.fn(),
    onRelease: vi.fn(),
    onReject: vi.fn(),
    onRequestFinancialCharge: vi.fn(),
    isSubmitting: false,
  }
}

describe('PendingReleaseList', () => {
  it('mostra o chip com a contagem de comparações aguardando liberação', () => {
    render(<PendingReleaseList {...baseProps([makeRow(), makeRow({ comparisonId: 'c2' })])} />)
    expect(screen.getByText('2 aguardando liberação')).toBeInTheDocument()
  })

  it('mostra o rótulo da seção (em caixa alta via CSS, não texto literal maiúsculo)', () => {
    render(<PendingReleaseList {...baseProps()} />)
    const label = screen.getByText(/aguardando sua decisão · liberar ou não liberar/i)
    expect(label).toBeInTheDocument()
    expect(label.className).toContain('uppercase')
  })

  it('mostra número da SOL e nome da unidade no título do card', () => {
    render(<PendingReleaseList {...baseProps()} />)
    expect(screen.getByText(/SOL 3/)).toBeInTheDocument()
    expect(screen.getByText(/Depósito Simões Filho/)).toBeInTheDocument()
  })

  it('usa o número externo (do ERP) em vez de "SOL n" quando presente', () => {
    render(<PendingReleaseList {...baseProps([makeRow({ externalRef: '25115' })])} />)
    expect(screen.getByText(/25115/)).toBeInTheDocument()
    expect(screen.queryByText(/SOL 3/)).not.toBeInTheDocument()
  })

  it('mostra a tag "Aguardando comprovante" quando o pagamento ainda não foi confirmado', () => {
    render(<PendingReleaseList {...baseProps()} />)
    expect(screen.getByText(/aguardando comprovante/i)).toBeInTheDocument()
  })

  it('não mostra a tag quando o comprovante já foi confirmado', () => {
    render(<PendingReleaseList {...baseProps([makeRow({ paymentProofConfirmedAt: '2026-09-16T14:00:00Z' })])} />)
    expect(screen.queryByText(/aguardando comprovante/i)).not.toBeInTheDocument()
  })

  it('mostra o resumo com valor, itens e fornecedores', () => {
    render(<PendingReleaseList {...baseProps()} />)
    expect(screen.getByText(/R\$\s?1\.234,50/)).toBeInTheDocument()
    expect(screen.getByText(/2 itens/)).toBeInTheDocument()
    expect(screen.getByText(/1 fornecedor\b/)).toBeInTheDocument()
  })

  it('mostra a condição de pagamento quando presente', () => {
    render(<PendingReleaseList {...baseProps()} />)
    expect(screen.getByText('À vista')).toBeInTheDocument()
  })

  it('mostra quem enviou e quando', () => {
    render(<PendingReleaseList {...baseProps()} />)
    expect(screen.getByText(/^por Admin Construtora Beta em/)).toBeInTheDocument()
  })

  it('mostra a nota de aprovação em verde', () => {
    render(<PendingReleaseList {...baseProps()} />)
    expect(screen.getByText(/Aprovado por Admin Construtora Beta em/)).toBeInTheDocument()
  })

  it('mostra a observação quando presente, sem inventar autor', () => {
    render(<PendingReleaseList {...baseProps([makeRow({ note: 'Fornecedor pediu 2 dias a mais.' })])} />)
    expect(screen.getByText(/Fornecedor pediu 2 dias a mais\./)).toBeInTheDocument()
  })

  it('não mostra observação quando ausente', () => {
    render(<PendingReleaseList {...baseProps()} />)
    expect(screen.queryByText(/💬/)).not.toBeInTheDocument()
  })

  it('estado aguardando comprovante: mostra Ver, Confirmar comprovante, Não liberar e Cobrar financeiro', () => {
    render(<PendingReleaseList {...baseProps()} />)
    expect(screen.getByRole('button', { name: 'Ver' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Confirmar comprovante' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Não liberar' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cobrar financeiro' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Liberar' })).not.toBeInTheDocument()
  })

  it('estado comprovante confirmado: mostra só Ver e Liberar', () => {
    render(<PendingReleaseList {...baseProps([makeRow({ paymentProofConfirmedAt: '2026-09-16T14:00:00Z' })])} />)
    expect(screen.getByRole('button', { name: 'Ver' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Liberar' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Confirmar comprovante' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Não liberar' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Cobrar financeiro' })).not.toBeInTheDocument()
  })

  it('chama onConfirmPaymentProof ao clicar em Confirmar comprovante', async () => {
    const user = userEvent.setup()
    const onConfirmPaymentProof = vi.fn()
    render(<PendingReleaseList {...baseProps()} onConfirmPaymentProof={onConfirmPaymentProof} />)
    await user.click(screen.getByRole('button', { name: 'Confirmar comprovante' }))
    expect(onConfirmPaymentProof).toHaveBeenCalledWith('c1')
  })

  it('chama onRequestFinancialCharge ao clicar em Cobrar financeiro', async () => {
    const user = userEvent.setup()
    const onRequestFinancialCharge = vi.fn()
    render(<PendingReleaseList {...baseProps()} onRequestFinancialCharge={onRequestFinancialCharge} />)
    await user.click(screen.getByRole('button', { name: 'Cobrar financeiro' }))
    expect(onRequestFinancialCharge).toHaveBeenCalledWith('c1')
  })

  it('chama onRelease ao clicar em Liberar', async () => {
    const user = userEvent.setup()
    const onRelease = vi.fn()
    render(
      <PendingReleaseList
        {...baseProps([makeRow({ paymentProofConfirmedAt: '2026-09-16T14:00:00Z' })])}
        onRelease={onRelease}
      />,
    )
    await user.click(screen.getByRole('button', { name: 'Liberar' }))
    expect(onRelease).toHaveBeenCalledWith('c1')
  })

  it('não mostra o campo de motivo em repouso — só depois de clicar em Não liberar', () => {
    render(<PendingReleaseList {...baseProps()} />)
    expect(screen.queryByLabelText(/motivo/i)).not.toBeInTheDocument()
  })

  it('clicar em Não liberar abre o campo de motivo e troca os botões pela confirmação', async () => {
    const user = userEvent.setup()
    render(<PendingReleaseList {...baseProps()} />)

    await user.click(screen.getByRole('button', { name: 'Não liberar' }))

    expect(screen.getByLabelText(/motivo/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Confirmar não liberar' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Não liberar' })).not.toBeInTheDocument()
  })

  it('exige motivo para confirmar não liberar', async () => {
    const user = userEvent.setup()
    const onReject = vi.fn()
    render(<PendingReleaseList {...baseProps()} onReject={onReject} />)

    await user.click(screen.getByRole('button', { name: 'Não liberar' }))
    await user.click(screen.getByRole('button', { name: 'Confirmar não liberar' }))

    expect(await screen.findByText(/informe o motivo/i)).toBeInTheDocument()
    expect(onReject).not.toHaveBeenCalled()
  })

  it('chama onReject com o motivo preenchido ao confirmar', async () => {
    const user = userEvent.setup()
    const onReject = vi.fn()
    render(<PendingReleaseList {...baseProps()} onReject={onReject} />)

    await user.click(screen.getByRole('button', { name: 'Não liberar' }))
    await user.type(screen.getByLabelText(/motivo/i), 'Fornecedor ainda não confirmou o prazo.')
    await user.click(screen.getByRole('button', { name: 'Confirmar não liberar' }))

    expect(onReject).toHaveBeenCalledWith('c1', 'Fornecedor ainda não confirmou o prazo.')
  })

  it('cancelar fecha o campo de motivo e volta aos botões normais', async () => {
    const user = userEvent.setup()
    render(<PendingReleaseList {...baseProps()} />)

    await user.click(screen.getByRole('button', { name: 'Não liberar' }))
    await user.click(screen.getByRole('button', { name: 'Cancelar' }))

    expect(screen.queryByLabelText(/motivo/i)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Não liberar' })).toBeInTheDocument()
  })

  it('mostra mensagem de estado vazio quando não há comparações aguardando liberação', () => {
    render(<PendingReleaseList {...baseProps([])} />)
    expect(screen.getByText(/nenhuma comparação aprovada aguardando liberação/i)).toBeInTheDocument()
  })
})
