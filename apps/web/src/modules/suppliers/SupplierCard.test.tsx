import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { SupplierCard } from './SupplierCard'
import type { SupplierRow } from './types'

const supplier: SupplierRow = {
  id: 's1',
  name: 'Fornecedor Alfa',
  city: 'São Paulo',
  type: 'Distribuidor',
  status: 'active',
  mainContact: { name: 'Ana Souza', phone: '11999999999', email: 'ana@alfa.com' },
  createdByName: 'Marcelo Souza',
}

function baseProps() {
  return {
    supplier,
    isFavorite: false,
    onToggleFavorite: vi.fn(),
    onOpenPopup: vi.fn(),
    onEdit: vi.fn(),
    onDelete: vi.fn(),
  }
}

describe('SupplierCard', () => {
  it('renderiza nome, cidade, tipo, status e o contato principal', () => {
    render(<SupplierCard {...baseProps()} />)
    expect(screen.getByText('Fornecedor Alfa')).toBeInTheDocument()
    expect(screen.getByText('São Paulo')).toBeInTheDocument()
    expect(screen.getByText('Distribuidor')).toBeInTheDocument()
    expect(screen.getByText('Ativo')).toBeInTheDocument()
    expect(screen.getByText('Ana Souza')).toBeInTheDocument()
    expect(screen.getByText('Cadastrado por Marcelo Souza')).toBeInTheDocument()
  })

  it('chama onToggleFavorite ao clicar na estrela', async () => {
    const props = baseProps()
    render(<SupplierCard {...props} />)

    await userEvent.click(screen.getByRole('button', { name: /favorito/i }))

    expect(props.onToggleFavorite).toHaveBeenCalledWith('s1')
  })

  it.each(['certificados', 'prazo', 'materiais', 'avaliacoes'] as const)(
    'abre o pop-up %s ao clicar no indicador',
    async (kind) => {
      const props = baseProps()
      render(<SupplierCard {...props} />)

      await userEvent.click(screen.getByTestId(`indicator-${kind}`))

      expect(props.onOpenPopup).toHaveBeenCalledWith(kind, 's1')
    },
  )

  it('chama onEdit e onDelete pelos botões de ação', async () => {
    const props = baseProps()
    render(<SupplierCard {...props} />)

    await userEvent.click(screen.getByRole('button', { name: 'Editar' }))
    expect(props.onEdit).toHaveBeenCalledWith('s1')

    await userEvent.click(screen.getByRole('button', { name: 'Excluir' }))
    expect(props.onDelete).toHaveBeenCalledWith('s1')
  })

  it('mostra "Em breve" ao clicar em Copiar ou Copiar para setor', async () => {
    render(<SupplierCard {...baseProps()} />)

    await userEvent.click(screen.getByRole('button', { name: 'Copiar' }))

    expect(screen.getByText('Em breve')).toBeInTheDocument()
  })
})
