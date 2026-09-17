import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { AnalysisRequestCard } from './AnalysisRequestCard'
import type { RequestItemRow, RequestRow } from './types'

function makeItem(overrides: Partial<RequestItemRow>): RequestItemRow {
  return {
    id: 'i1',
    materialId: 'm1',
    materialName: 'Porta',
    materialCode: null,
    materialDescription: null,
    quantity: 1,
    unitOfMeasure: 'un',
    statusCode: null,
    authorizedAt: null,
    pendente: false,
    motivoPendencia: null,
    ...overrides,
  }
}

function makeRequest(overrides: Partial<RequestRow>): RequestRow {
  return {
    id: 'r1',
    unitId: 'u1',
    unitName: 'Serralheria',
    status: 'pending_review',
    neededBy: '2026-09-18',
    externalRef: null,
    sequenceNumber: 1097,
    createdAt: '2026-09-10T00:00:00Z',
    subjectCategory: null,
    notes: null,
    negotiatorId: null,
    negotiatorName: null,
    negotiatingStartedAt: null,
    dispatchBlockedReason: null,
    quotationsCount: 0,
    items: [makeItem({})],
    ...overrides,
  }
}

function baseProps() {
  return {
    today: new Date('2026-09-15T12:00:00'),
    canAnalyze: true,
    onToggleItemPendency: vi.fn(),
    onUpdateNotes: vi.fn(),
    onDeleteRequest: vi.fn(),
    onOpenClarificationModal: vi.fn(),
    onOpenExtensionModal: vi.fn(),
    onReleaseToDispatch: vi.fn(),
  }
}

describe('AnalysisRequestCard', () => {
  it('mostra o centro, a data de entrega e o badge de urgência', () => {
    render(<AnalysisRequestCard {...baseProps()} request={makeRequest({})} />)
    expect(screen.getByText('Serralheria')).toBeInTheDocument()
    expect(screen.getByText('3 dias')).toBeInTheDocument()
  })

  it('mostra "Ag. Aprovação" quando a SOL não tem data de entrega', () => {
    render(<AnalysisRequestCard {...baseProps()} request={makeRequest({ neededBy: null })} />)
    expect(screen.getByText('Ag. Aprovação')).toBeInTheDocument()
  })

  it('expande ao clicar no corpo do card, mostrando a tabela de itens', async () => {
    const user = userEvent.setup()
    render(<AnalysisRequestCard {...baseProps()} request={makeRequest({})} />)

    expect(screen.queryByText('Porta')).not.toBeInTheDocument()
    await user.click(screen.getByText('SOL 1097'))
    expect(screen.getByText('Porta')).toBeInTheDocument()
  })

  it('sinaliza um item como pendente e libera o campo de motivo', async () => {
    const user = userEvent.setup()
    const onToggleItemPendency = vi.fn()
    render(
      <AnalysisRequestCard
        {...baseProps()}
        onToggleItemPendency={onToggleItemPendency}
        request={makeRequest({})}
      />,
    )
    await user.click(screen.getByText('SOL 1097'))

    await user.click(screen.getByRole('button', { name: 'Sinalizar pendência' }))
    expect(onToggleItemPendency).toHaveBeenCalledWith('i1', true, '')
  })

  it('mostra o campo de motivo e o botão fica marcado quando o item já está pendente', async () => {
    const user = userEvent.setup()
    render(
      <AnalysisRequestCard
        {...baseProps()}
        request={makeRequest({ items: [makeItem({ pendente: true, motivoPendencia: 'Falta o modelo' })] })}
      />,
    )
    await user.click(screen.getByText('SOL 1097'))

    expect(screen.getByRole('button', { name: '⚠ Pendente' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByLabelText('O que falta em Porta')).toHaveValue('Falta o modelo')
  })

  it('bloqueia "Liberar pro Disparo" e explica o motivo quando há item pendente', async () => {
    const user = userEvent.setup()
    render(
      <AnalysisRequestCard
        {...baseProps()}
        request={makeRequest({ items: [makeItem({ pendente: true, motivoPendencia: 'Falta o modelo' })] })}
      />,
    )
    await user.click(screen.getByText('SOL 1097'))

    expect(screen.getByRole('button', { name: 'Liberar pro Disparo' })).toBeDisabled()
    expect(screen.getByText(/peça esclarecimento ao engenheiro/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Solicitar esclarecimento' })).toBeEnabled()
  })

  it('"Solicitar esclarecimento" fica desabilitado sem nenhum item pendente, com o motivo explicado no title', async () => {
    const user = userEvent.setup()
    render(<AnalysisRequestCard {...baseProps()} request={makeRequest({})} />)
    await user.click(screen.getByText('SOL 1097'))

    const clarificationButton = screen.getByRole('button', { name: 'Solicitar esclarecimento' })
    expect(clarificationButton).toBeDisabled()
    expect(clarificationButton).toHaveAttribute('title', 'Sinalize ao menos um item pendente para habilitar')
    expect(screen.getByRole('button', { name: 'Liberar pro Disparo' })).toBeEnabled()
  })

  it('chama onReleaseToDispatch ao clicar em "Liberar pro Disparo" sem pendência', async () => {
    const user = userEvent.setup()
    const onReleaseToDispatch = vi.fn()
    render(
      <AnalysisRequestCard
        {...baseProps()}
        onReleaseToDispatch={onReleaseToDispatch}
        request={makeRequest({})}
      />,
    )
    await user.click(screen.getByText('SOL 1097'))
    await user.click(screen.getByRole('button', { name: 'Liberar pro Disparo' }))

    expect(onReleaseToDispatch).toHaveBeenCalledWith('r1')
  })

  it('chama onDeleteRequest ao clicar no ícone de excluir', async () => {
    const user = userEvent.setup()
    const onDeleteRequest = vi.fn()
    const request = makeRequest({})
    render(<AnalysisRequestCard {...baseProps()} onDeleteRequest={onDeleteRequest} request={request} />)

    await user.click(screen.getByRole('button', { name: 'Excluir requisição de Serralheria' }))
    expect(onDeleteRequest).toHaveBeenCalledWith(request)
  })

  it('desabilita as ações de análise quando o usuário não tem a permissão', async () => {
    const user = userEvent.setup()
    render(<AnalysisRequestCard {...baseProps()} canAnalyze={false} request={makeRequest({})} />)
    await user.click(screen.getByText('SOL 1097'))

    expect(screen.getByRole('button', { name: 'Sinalizar pendência' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Pedir prorrogação' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Liberar pro Disparo' })).toBeDisabled()
  })
})
