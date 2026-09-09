import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { QuoteRequestModal } from './QuoteRequestModal'

const suppliersWithEmail = [
  { id: 's1', name: 'Fornecedor Alfa', email: 'alfa@example.com' },
  { id: 's2', name: 'Fornecedor Beta', email: 'beta@example.com' },
]

const units = [
  { id: 'u1', name: 'Obra Centro' },
  { id: 'u2', name: 'Obra Norte' },
]

describe('QuoteRequestModal', () => {
  it('lista os fornecedores com e-mail e o aviso de cópia oculta', () => {
    render(
      <QuoteRequestModal
        isOpen
        onClose={vi.fn()}
        materialName="Cimento"
        suppliersWithEmail={suppliersWithEmail}
        units={units}
      />,
    )
    expect(screen.getByText('Fornecedor Alfa')).toBeInTheDocument()
    expect(screen.getByText('Fornecedor Beta')).toBeInTheDocument()
    expect(screen.getByText(/cópia oculta/i)).toBeInTheDocument()
  })

  it('mostra o material pré-preenchido e somente leitura', () => {
    render(
      <QuoteRequestModal
        isOpen
        onClose={vi.fn()}
        materialName="Cimento"
        suppliersWithEmail={suppliersWithEmail}
        units={units}
      />,
    )
    const materialField = screen.getByLabelText('Material') as HTMLInputElement
    expect(materialField.value).toBe('Cimento')
    expect(materialField).toHaveAttribute('readonly')
  })

  it('monta o link mailto com os fornecedores em BCC', () => {
    render(
      <QuoteRequestModal
        isOpen
        onClose={vi.fn()}
        materialName="Cimento"
        suppliersWithEmail={suppliersWithEmail}
        units={units}
      />,
    )
    const link = screen.getByRole('link', { name: 'Abrir no Outlook' })
    const href = decodeURIComponent(link.getAttribute('href') ?? '')
    expect(href).toContain('mailto:')
    expect(href).toContain('bcc=alfa@example.com,beta@example.com')
    expect(href).toContain('Cimento')
  })

  it('inclui a obra e o número da SOL escolhidos no corpo do e-mail', async () => {
    render(
      <QuoteRequestModal
        isOpen
        onClose={vi.fn()}
        materialName="Cimento"
        suppliersWithEmail={suppliersWithEmail}
        units={units}
      />,
    )

    await userEvent.selectOptions(screen.getByLabelText('Obra'), 'u2')
    await userEvent.type(screen.getByLabelText('N° da SOL'), '1234')

    const link = screen.getByRole('link', { name: 'Abrir no Outlook' })
    const href = decodeURIComponent(link.getAttribute('href') ?? '')
    expect(href).toContain('Obra Norte')
    expect(href).toContain('1234')
  })

  it('chama onClose ao clicar em Cancelar', async () => {
    const onClose = vi.fn()
    render(
      <QuoteRequestModal
        isOpen
        onClose={onClose}
        materialName="Cimento"
        suppliersWithEmail={suppliersWithEmail}
        units={units}
      />,
    )

    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }))

    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
