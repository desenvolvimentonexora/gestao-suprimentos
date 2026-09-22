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
    materialSearch: '',
    showNewForm: false,
    onCloseNewForm: vi.fn(),
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

  it('filtra pela busca de material recebida por prop (o input mora na página)', () => {
    render(<MaterialColumn {...baseProps()} materialSearch="cabo" />)

    expect(screen.queryByText('Cimento')).not.toBeInTheDocument()
    expect(screen.getByText('Cabo elétrico')).toBeInTheDocument()
  })

  it('chama onSelectMaterial ao clicar em um material', async () => {
    const props = baseProps()
    render(<MaterialColumn {...props} />)

    await userEvent.click(screen.getByText('Cimento'))

    expect(props.onSelectMaterial).toHaveBeenCalledWith('m1')
  })

  it('mostra o formulário de novo material quando showNewForm é true, sugere um ícone pelo nome e cria ao enviar', async () => {
    const props = baseProps()
    render(<MaterialColumn {...props} showNewForm />)

    await userEvent.type(screen.getByLabelText('Nome do material'), 'Cabo de Aço')
    await userEvent.selectOptions(screen.getByLabelText('Categoria'), 'c1')
    await userEvent.click(screen.getByRole('button', { name: 'Criar material' }))

    expect(props.onCreateMaterial).toHaveBeenCalledWith('Cabo de Aço', 'c1', 'zap')
    expect(props.onCloseNewForm).toHaveBeenCalledTimes(1)
  })

  it('permite trocar manualmente o ícone sugerido antes de criar', async () => {
    const props = baseProps()
    render(<MaterialColumn {...props} showNewForm />)

    await userEvent.type(screen.getByLabelText('Nome do material'), 'Cabo de Aço')
    await userEvent.click(screen.getByRole('button', { name: 'wrench' }))
    await userEvent.click(screen.getByRole('button', { name: 'Criar material' }))

    expect(props.onCreateMaterial).toHaveBeenCalledWith('Cabo de Aço', 'c1', 'wrench')
  })

  it('chama onCloseNewForm ao cancelar o formulário de novo material', async () => {
    const props = baseProps()
    render(<MaterialColumn {...props} showNewForm />)

    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }))

    expect(props.onCloseNewForm).toHaveBeenCalledTimes(1)
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

  it('chama onOpenReport ao clicar no botão de relatório', async () => {
    const props = baseProps()
    render(<MaterialColumn {...props} />)

    await userEvent.click(screen.getByRole('button', { name: /Relatório de Fornecedores/ }))

    expect(props.onOpenReport).toHaveBeenCalledTimes(1)
  })

  it('usa uma cor de destaque própria no botão de relatório', () => {
    render(<MaterialColumn {...baseProps()} />)
    expect(screen.getByRole('button', { name: /Relatório de Fornecedores/ }).className).toContain('bg-blue')
  })

  it('destaca o material selecionado com a cor da marca', () => {
    render(<MaterialColumn {...baseProps()} selectedMaterialId="m1" />)
    const row = screen.getByText('Cimento').closest('div[class*="border-l-4"]')
    expect(row?.className).toContain('border-primary')
  })

  it('ícone de editar em âmbar e de excluir em cinza que fica vermelho no hover', () => {
    render(<MaterialColumn {...baseProps()} />)
    expect(screen.getByRole('button', { name: 'Editar Cimento' }).className).toContain('text-amber')
    const deleteClass = screen.getByRole('button', { name: 'Excluir Cimento' }).className
    expect(deleteClass).toContain('text-ink-muted')
    expect(deleteClass).toContain('hover:text-red')
  })
})
