import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { MaterialColumn } from './MaterialColumn'
import type { CategoryRow, MaterialRow } from './types'

const categories: CategoryRow[] = [{ id: 'c1', name: 'Elétrica', slug: 'eletrica', icon: 'zap' }]

const materials: MaterialRow[] = [
  { id: 'm1', name: 'Cimento', categoryId: 'c1', supplierCount: 3, icon: 'layers' },
  { id: 'm2', name: 'Cabo elétrico', categoryId: 'c1', supplierCount: 1, icon: 'zap' },
]

function baseProps() {
  return {
    materials,
    categories,
    selectedCategoryId: null as string | null,
    selectedMaterialId: null as string | null,
    onSelectMaterial: vi.fn(),
    onCreateMaterial: vi.fn(),
    onUpdateMaterial: vi.fn(),
    onDeleteMaterial: vi.fn(),
    supplierSearch: '',
    onSupplierSearchChange: vi.fn(),
    onOpenReport: vi.fn(),
  }
}

describe('MaterialColumn', () => {
  it('lista os materiais com a contagem de fornecedores e um ícone', () => {
    render(<MaterialColumn {...baseProps()} />)
    const row = screen.getByText('Cimento').closest('div')
    expect(screen.getByText('Cimento')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(row?.querySelector('svg')).toBeInTheDocument()
  })

  it('filtra pela busca de material digitada', async () => {
    render(<MaterialColumn {...baseProps()} />)

    await userEvent.type(screen.getByPlaceholderText('Buscar material'), 'cabo')

    expect(screen.queryByText('Cimento')).not.toBeInTheDocument()
    expect(screen.getByText('Cabo elétrico')).toBeInTheDocument()
  })

  it('chama onSelectMaterial ao clicar em um material', async () => {
    const props = baseProps()
    render(<MaterialColumn {...props} />)

    await userEvent.click(screen.getByText('Cimento'))

    expect(props.onSelectMaterial).toHaveBeenCalledWith('m1')
  })

  it('abre o formulário de novo material, sugere um ícone pelo nome e cria ao enviar', async () => {
    const props = baseProps()
    render(<MaterialColumn {...props} />)

    await userEvent.click(screen.getByRole('button', { name: '+ Novo' }))
    await userEvent.type(screen.getByLabelText('Nome do material'), 'Cabo de Aço')
    await userEvent.selectOptions(screen.getByLabelText('Categoria'), 'c1')
    await userEvent.click(screen.getByRole('button', { name: 'Criar material' }))

    expect(props.onCreateMaterial).toHaveBeenCalledWith('Cabo de Aço', 'c1', 'zap')
  })

  it('permite trocar manualmente o ícone sugerido antes de criar', async () => {
    const props = baseProps()
    render(<MaterialColumn {...props} />)

    await userEvent.click(screen.getByRole('button', { name: '+ Novo' }))
    await userEvent.type(screen.getByLabelText('Nome do material'), 'Cabo de Aço')
    await userEvent.click(screen.getByRole('button', { name: 'wrench' }))
    await userEvent.click(screen.getByRole('button', { name: 'Criar material' }))

    expect(props.onCreateMaterial).toHaveBeenCalledWith('Cabo de Aço', 'c1', 'wrench')
  })

  it('chama onDeleteMaterial ao clicar em excluir', async () => {
    const props = baseProps()
    render(<MaterialColumn {...props} />)

    await userEvent.click(screen.getByRole('button', { name: 'Excluir Cimento' }))

    expect(props.onDeleteMaterial).toHaveBeenCalledWith('m1')
  })

  it('edita um material existente (nome, categoria e ícone)', async () => {
    const props = baseProps()
    render(<MaterialColumn {...props} />)

    await userEvent.click(screen.getByRole('button', { name: 'Editar Cimento' }))
    const nameInput = screen.getByLabelText('Nome do material')
    await userEvent.clear(nameInput)
    await userEvent.type(nameInput, 'Cimento CP-II')
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }))

    expect(props.onUpdateMaterial).toHaveBeenCalledWith('m1', 'Cimento CP-II', 'c1', 'layers')
  })

  it('chama onSupplierSearchChange ao digitar na busca de fornecedor', async () => {
    const props = baseProps()
    render(<MaterialColumn {...props} />)

    await userEvent.type(screen.getByPlaceholderText('Buscar fornecedor'), 'a')

    expect(props.onSupplierSearchChange).toHaveBeenCalled()
  })

  it('chama onOpenReport ao clicar no botão de relatório', async () => {
    const props = baseProps()
    render(<MaterialColumn {...props} />)

    await userEvent.click(screen.getByRole('button', { name: /Relatório de Fornecedores/ }))

    expect(props.onOpenReport).toHaveBeenCalledTimes(1)
  })
})
