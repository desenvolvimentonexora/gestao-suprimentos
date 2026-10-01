import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { TaskCardAttachmentsSection } from './TaskCardAttachmentsSection'
import * as api from './api'

vi.mock('./api', () => ({
  fetchTaskCardAttachments: vi.fn(),
  uploadTaskCardAttachment: vi.fn(),
  deleteTaskCardAttachment: vi.fn(),
}))

function renderSection() {
  const queryClient = new QueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      <TaskCardAttachmentsSection taskCardId="c1" tenantId="tenant-1" userId="user-1" />
    </QueryClientProvider>,
  )
}

describe('TaskCardAttachmentsSection', () => {
  it('lista os anexos existentes com link para abrir', async () => {
    vi.mocked(api.fetchTaskCardAttachments).mockResolvedValue([
      { id: 'a1', fileName: 'foto.png', filePath: 'tenant-1/c1/foto.png', url: 'https://x/foto.png' },
    ])
    renderSection()

    const link = await screen.findByRole('link', { name: 'foto.png' })
    expect(link).toHaveAttribute('href', 'https://x/foto.png')
  })

  it('mostra mensagem de carregando antes dos dados chegarem', () => {
    vi.mocked(api.fetchTaskCardAttachments).mockReturnValue(new Promise(() => {}))
    renderSection()
    expect(screen.getByText('Carregando anexos...')).toBeInTheDocument()
  })

  it('envia um arquivo novo ao selecioná-lo no input', async () => {
    vi.mocked(api.fetchTaskCardAttachments).mockResolvedValue([])
    vi.mocked(api.uploadTaskCardAttachment).mockResolvedValue(undefined)
    renderSection()

    const file = new File(['conteudo'], 'relatorio.pdf', { type: 'application/pdf' })
    const input = screen.getByLabelText('Anexar imagem ou arquivo')
    await userEvent.upload(input, file)

    await waitFor(() =>
      expect(api.uploadTaskCardAttachment).toHaveBeenCalledWith('tenant-1', 'c1', 'user-1', file),
    )
  })

  it('exclui um anexo ao clicar na lixeira', async () => {
    vi.mocked(api.fetchTaskCardAttachments).mockResolvedValue([
      { id: 'a1', fileName: 'foto.png', filePath: 'tenant-1/c1/foto.png', url: 'https://x/foto.png' },
    ])
    vi.mocked(api.deleteTaskCardAttachment).mockResolvedValue(undefined)
    renderSection()

    await userEvent.click(await screen.findByRole('button', { name: 'Excluir foto.png' }))

    await waitFor(() =>
      expect(api.deleteTaskCardAttachment).toHaveBeenCalledWith('a1', 'tenant-1/c1/foto.png'),
    )
  })
})
