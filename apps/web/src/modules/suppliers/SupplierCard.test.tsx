import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { getSupplierColor } from './supplierColor'
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

  it('usa a cor consistente do fornecedor no avatar', () => {
    render(<SupplierCard {...baseProps()} />)
    expect(screen.getByText('F').className).toContain(getSupplierColor('s1').avatar)
  })

  it('mostra um indicador de status com bolinha verde quando ativo', () => {
    render(<SupplierCard {...baseProps()} />)
    expect(screen.getByTestId('status-dot').className).toContain('bg-emerald')
  })

  it('mostra um indicador de status com bolinha cinza quando inativo', () => {
    render(<SupplierCard {...baseProps()} supplier={{ ...supplier, status: 'inactive' }} />)
    expect(screen.getByText('Inativo')).toBeInTheDocument()
    expect(screen.getByTestId('status-dot').className).not.toContain('bg-emerald')
  })

  it('editar, avaliar, copiar e copiar para setor têm o mesmo tamanho e cor de fundo', () => {
    render(<SupplierCard {...baseProps()} />)
    const editar = screen.getByRole('button', { name: 'Editar' }).className
    const avaliar = screen.getByRole('button', { name: 'Avaliar' }).className
    const copiar = screen.getByRole('button', { name: 'Copiar' }).className
    const copiarParaSetor = screen.getByRole('button', { name: 'Copiar para setor' }).className

    expect(avaliar).toBe(editar)
    expect(copiar).toBe(editar)
    expect(copiarParaSetor).toBe(editar)
  })

  it('excluir tem o mesmo tamanho dos demais botões, mas preenchido em vermelho', () => {
    render(<SupplierCard {...baseProps()} />)
    const editarClass = screen.getByRole('button', { name: 'Editar' }).className
    const excluirClass = screen.getByRole('button', { name: 'Excluir' }).className

    const sizeClasses = ['rounded-md', 'px-4', 'py-2', 'text-sm', 'font-medium']
    for (const sizeClass of sizeClasses) {
      expect(editarClass).toContain(sizeClass)
      expect(excluirClass).toContain(sizeClass)
    }
    expect(excluirClass).toContain('bg-red')
  })

  it('mostra a seção de contatos da empresa com estado vazio', () => {
    render(<SupplierCard {...baseProps()} />)
    expect(screen.getByText('Contatos da empresa')).toBeInTheDocument()
    expect(screen.getByText('Nenhum contato extra. Clique em + Adicionar.')).toBeInTheDocument()
  })
})
