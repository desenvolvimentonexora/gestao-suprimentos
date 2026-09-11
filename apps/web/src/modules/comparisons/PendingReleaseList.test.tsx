import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { PendingReleaseList } from './PendingReleaseList'
import type { PendingReleaseRow } from './types'

const rows: PendingReleaseRow[] = [
  { comparisonId: 'c1', requestId: 'r1', unitName: 'UP Graça', externalRef: 'SOL-1' },
]

function baseProps() {
  return {
    rows,
    onRelease: vi.fn(),
    onReject: vi.fn(),
    onRequestFinancialCharge: vi.fn(),
    isSubmitting: false,
  }
}

describe('PendingReleaseList', () => {
  it('mostra as comparações aprovadas aguardando liberação', () => {
    render(<PendingReleaseList {...baseProps()} />)
    expect(screen.getByText('UP Graça')).toBeInTheDocument()
    expect(screen.getByText('SOL-1')).toBeInTheDocument()
  })

  it('mostra mensagem de estado vazio quando não há comparações pendentes', () => {
    render(<PendingReleaseList {...baseProps()} rows={[]} />)
    expect(screen.getByText(/nenhuma comparação aprovada aguardando liberação/i)).toBeInTheDocument()
  })

  it('chama onRelease com a condição de pagamento preenchida', async () => {
    const user = userEvent.setup()
    const onRelease = vi.fn()
    render(<PendingReleaseList {...baseProps()} onRelease={onRelease} />)
    await user.type(screen.getByLabelText(/condição de pagamento/i), '28 dias')
    await user.click(screen.getByRole('button', { name: /^liberar$/i }))
    expect(onRelease).toHaveBeenCalledWith('c1', '28 dias')
  })

  it('exige motivo antes de não liberar', async () => {
    const user = userEvent.setup()
    const onReject = vi.fn()
    render(<PendingReleaseList {...baseProps()} onReject={onReject} />)
    await user.click(screen.getByRole('button', { name: /não liberar/i }))
    expect(onReject).not.toHaveBeenCalled()
    expect(screen.getByText('Informe o motivo.')).toBeInTheDocument()
  })

  it('chama onReject com o motivo preenchido', async () => {
    const user = userEvent.setup()
    const onReject = vi.fn()
    render(<PendingReleaseList {...baseProps()} onReject={onReject} />)
    await user.type(screen.getByLabelText(/motivo/i), 'Comprovante não confere')
    await user.click(screen.getByRole('button', { name: /não liberar/i }))
    expect(onReject).toHaveBeenCalledWith('c1', 'Comprovante não confere')
  })

  it('chama onRequestFinancialCharge ao marcar cobrar financeiro', async () => {
    const user = userEvent.setup()
    const onRequestFinancialCharge = vi.fn()
    render(<PendingReleaseList {...baseProps()} onRequestFinancialCharge={onRequestFinancialCharge} />)
    await user.click(screen.getByRole('checkbox', { name: /cobrar financeiro/i }))
    expect(onRequestFinancialCharge).toHaveBeenCalledWith('c1')
  })
})
