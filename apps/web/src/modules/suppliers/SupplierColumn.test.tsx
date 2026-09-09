import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { SupplierColumn } from './SupplierColumn'
import type { SupplierRow } from './types'

const suppliers: SupplierRow[] = [
  {
    id: 's1',
    name: 'Fornecedor Alfa',
    city: 'São Paulo',
    type: 'Distribuidor',
    status: 'active',
    mainContact: null,
    createdByName: null,
  },
]

function baseProps() {
  return {
    materialName: 'Cimento',
    suppliers,
    totalCount: 1,
    page: 0,
    pageSize: 20,
    onPageChange: vi.fn(),
    search: '',
    onSearchChange: vi.fn(),
    typeFilter: null as string | null,
    onTypeFilterChange: vi.fn(),
    availableTypes: ['Distribuidor', 'Fabricante'],
    onRequestQuote: vi.fn(),
    onAddSupplier: vi.fn(),
    favoriteIds: new Set<string>(),
    onToggleFavorite: vi.fn(),
    onOpenPopup: vi.fn(),
    onEditSupplier: vi.fn(),
    onDeleteSupplier: vi.fn(),
  }
}

describe('SupplierColumn', () => {
  it('convida a selecionar um material quando nenhum está selecionado', () => {
    render(<SupplierColumn {...baseProps()} materialName={null} suppliers={[]} totalCount={0} />)
    expect(screen.getByText(/selecione um material/i)).toBeInTheDocument()
  })

  it('mostra o nome do material e a contagem no cabeçalho', () => {
    render(<SupplierColumn {...baseProps()} />)
    expect(screen.getByRole('heading', { name: 'Cimento' })).toBeInTheDocument()
    expect(screen.getByText('1 fornecedor')).toBeInTheDocument()
  })

  it('mostra o estado vazio quando o material não tem fornecedores', () => {
    render(<SupplierColumn {...baseProps()} suppliers={[]} totalCount={0} />)
    expect(
      screen.getByText('Nenhum fornecedor cadastrado para este material ainda. Adicione o primeiro.'),
    ).toBeInTheDocument()
  })

  it('renderiza um card por fornecedor', () => {
    render(<SupplierColumn {...baseProps()} />)
    expect(screen.getByText('Fornecedor Alfa')).toBeInTheDocument()
  })

  it('avança de página ao clicar em Próxima', async () => {
    const props = baseProps()
    render(<SupplierColumn {...props} totalCount={50} />)

    await userEvent.click(screen.getByRole('button', { name: 'Próxima' }))

    expect(props.onPageChange).toHaveBeenCalledWith(1)
  })

  it('chama onRequestQuote e onAddSupplier pelos botões do cabeçalho', async () => {
    const props = baseProps()
    render(<SupplierColumn {...props} />)

    await userEvent.click(screen.getByRole('button', { name: /Pedir Orçamento/ }))
    expect(props.onRequestQuote).toHaveBeenCalledTimes(1)

    await userEvent.click(screen.getByRole('button', { name: /Adicionar Fornecedor/ }))
    expect(props.onAddSupplier).toHaveBeenCalledTimes(1)
  })
})
