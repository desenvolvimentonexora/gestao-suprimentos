import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { CertificatesPopup } from './CertificatesPopup'
import type { CertificateRow } from './types'

const certificates: CertificateRow[] = [
  { id: 'cert1', fileName: 'iso9001.pdf', filePath: 't1/s1/iso9001.pdf', url: 'https://signed.example/iso9001.pdf' },
]

describe('CertificatesPopup', () => {
  it('lista os certificados como links para download', () => {
    render(
      <CertificatesPopup
        isOpen
        onClose={vi.fn()}
        certificates={certificates}
        onUpload={vi.fn()}
        onDelete={vi.fn()}
        isUploading={false}
      />,
    )
    expect(screen.getByRole('link', { name: 'iso9001.pdf' })).toHaveAttribute(
      'href',
      'https://signed.example/iso9001.pdf',
    )
  })

  it('mostra estado vazio quando não há certificados', () => {
    render(
      <CertificatesPopup
        isOpen
        onClose={vi.fn()}
        certificates={[]}
        onUpload={vi.fn()}
        onDelete={vi.fn()}
        isUploading={false}
      />,
    )
    expect(screen.getByText(/nenhum certificado/i)).toBeInTheDocument()
  })

  it('chama onDelete ao clicar em excluir', async () => {
    const onDelete = vi.fn()
    render(
      <CertificatesPopup
        isOpen
        onClose={vi.fn()}
        certificates={certificates}
        onUpload={vi.fn()}
        onDelete={onDelete}
        isUploading={false}
      />,
    )

    await userEvent.click(screen.getByRole('button', { name: 'Excluir iso9001.pdf' }))

    expect(onDelete).toHaveBeenCalledWith('cert1')
  })

  it('chama onUpload com o arquivo selecionado', async () => {
    const onUpload = vi.fn()
    render(
      <CertificatesPopup
        isOpen
        onClose={vi.fn()}
        certificates={[]}
        onUpload={onUpload}
        onDelete={vi.fn()}
        isUploading={false}
      />,
    )

    const file = new File(['conteudo'], 'novo.pdf', { type: 'application/pdf' })
    await userEvent.upload(screen.getByLabelText(/enviar certificado/i), file)

    expect(onUpload).toHaveBeenCalledWith(file)
  })
})
