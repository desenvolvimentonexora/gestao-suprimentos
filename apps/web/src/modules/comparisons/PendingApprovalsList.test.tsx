import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { PendingApprovalsList } from './PendingApprovalsList'
import type { PendingApprovalRow } from './types'

const rows: PendingApprovalRow[] = [
  { comparisonId: 'c1', requestId: 'r1', unitName: 'UP Graça', externalRef: 'SOL-1' },
]

function baseProps() {
  return {
    rows,
    onApprove: vi.fn(),
    onReject: vi.fn(),
    isSubmitting: false,
  }
}

describe('PendingApprovalsList', () => {
  it('mostra as comparações aguardando aprovação', () => {
    render(<PendingApprovalsList {...baseProps()} />)
    expect(screen.getByText('UP Graça')).toBeInTheDocument()
    expect(screen.getByText('SOL-1')).toBeInTheDocument()
  })

  it('não mostra nada quando não há aprovações pendentes', () => {
    const { container } = render(<PendingApprovalsList {...baseProps()} rows={[]} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('chama onApprove ao clicar em aprovar', async () => {
    const user = userEvent.setup()
    const onApprove = vi.fn()
    render(<PendingApprovalsList {...baseProps()} onApprove={onApprove} />)
    await user.click(screen.getByRole('button', { name: /aprovar/i }))
    expect(onApprove).toHaveBeenCalledWith('c1')
  })

  it('exige motivo antes de rejeitar', async () => {
    const user = userEvent.setup()
    const onReject = vi.fn()
    render(<PendingApprovalsList {...baseProps()} onReject={onReject} />)

    await user.click(screen.getByRole('button', { name: /rejeitar/i }))
    expect(onReject).not.toHaveBeenCalled()
    expect(screen.getByText('Informe o motivo da rejeição.')).toBeInTheDocument()
  })

  it('chama onReject com o motivo preenchido', async () => {
    const user = userEvent.setup()
    const onReject = vi.fn()
    render(<PendingApprovalsList {...baseProps()} onReject={onReject} />)

    await user.type(screen.getByLabelText(/motivo da rejeição/i), 'Preço acima do orçamento')
    await user.click(screen.getByRole('button', { name: /rejeitar/i }))
    expect(onReject).toHaveBeenCalledWith('c1', 'Preço acima do orçamento')
  })
})
