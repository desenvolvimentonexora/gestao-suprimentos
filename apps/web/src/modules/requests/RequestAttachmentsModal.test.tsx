import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { RequestAttachmentsModal } from './RequestAttachmentsModal'
import type { RequestAttachmentRow } from './types'

function baseProps() {
  return {
    isOpen: true,
    onClose: vi.fn(),
    requestLabel: 'SOL 1026',
    attachments: [] as RequestAttachmentRow[],
    isLoading: false,
    onView: vi.fn(),
  }
}

describe('RequestAttachmentsModal', () => {
  it('mostra estado de carregamento', () => {
    render(<RequestAttachmentsModal {...baseProps()} isLoading />)
    expect(screen.getByText(/carregando arquivos/i)).toBeInTheDocument()
  })

  it('mostra mensagem quando não há PDF da solicitação ainda', () => {
    render(<RequestAttachmentsModal {...baseProps()} />)
    expect(screen.getByText(/pdf da solicitação ainda não gerado/i)).toBeInTheDocument()
  })

  it('mostra mensagem quando não há cotações recebidas', () => {
    render(<RequestAttachmentsModal {...baseProps()} />)
    expect(screen.getByText(/nenhuma cotação recebida ainda/i)).toBeInTheDocument()
  })

  it('mostra o PDF da solicitação e chama onView com kind "sol"', async () => {
    const user = userEvent.setup()
    const onView = vi.fn()
    render(
      <RequestAttachmentsModal
        {...baseProps()}
        onView={onView}
        attachments={[{ id: 'att-1', fileName: 'SOL_1026.pdf', kind: 'sol', supplierName: null }]}
      />,
    )
    expect(screen.getByText('SOL_1026.pdf')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Ver' }))
    expect(onView).toHaveBeenCalledWith({ id: 'att-1', kind: 'sol' })
  })

  it('mostra as cotações recebidas com o nome do fornecedor e chama onView com kind "quotation"', async () => {
    const user = userEvent.setup()
    const onView = vi.fn()
    render(
      <RequestAttachmentsModal
        {...baseProps()}
        onView={onView}
        attachments={[
          { id: 'att-2', fileName: 'cotacao.pdf', kind: 'quotation', supplierName: 'Fornecedor A' },
          { id: 'att-3', fileName: 'cotacao2.pdf', kind: 'quotation', supplierName: 'Fornecedor B' },
        ]}
      />,
    )
    expect(screen.getByText('Fornecedor A')).toBeInTheDocument()
    expect(screen.getByText('Fornecedor B')).toBeInTheDocument()

    const buttons = screen.getAllByRole('button', { name: 'Ver' })
    await user.click(buttons[0]!)
    expect(onView).toHaveBeenCalledWith({ id: 'att-2', kind: 'quotation' })
  })

  it('mostra o título com o número da SOL', () => {
    render(<RequestAttachmentsModal {...baseProps()} requestLabel="SOL 42" />)
    expect(screen.getByText('Arquivos — SOL 42')).toBeInTheDocument()
  })
})
