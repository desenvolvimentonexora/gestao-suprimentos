import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { InsumosModal } from './InsumosModal'
import type { MaterialRow, MaterialVariantRow } from './types'

const materials: MaterialRow[] = [
  { id: 'm1', name: 'Cimento', categoryId: 'c1', supplierCount: 2, icon: 'layers' },
  { id: 'm2', name: 'Parafuso', categoryId: 'c1', supplierCount: 1, icon: 'wrench' },
]

const variants: MaterialVariantRow[] = [
  {
    id: 'v1',
    materialId: 'm1',
    materialName: 'Cimento',
    code: 'CP-II',
    description: '50kg',
    unitOfMeasure: null,
  },
  {
    id: 'v2',
    materialId: 'm2',
    materialName: 'Parafuso',
    code: '3/4',
    description: 'rosca soberba',
    unitOfMeasure: null,
  },
]

function baseProps() {
  return {
    isOpen: true,
    onClose: vi.fn(),
    materials,
    variants,
    onCreateVariant: vi.fn(),
    isCreating: false,
    onDeleteVariant: vi.fn(),
    isDeleting: false,
  }
}

describe('InsumosModal', () => {
  it('lista todos os insumos já cadastrados', () => {
    render(<InsumosModal {...baseProps()} />)
    expect(screen.getByText('Cimento — CP-II — 50kg')).toBeInTheDocument()
    expect(screen.getByText('Parafuso — 3/4 — rosca soberba')).toBeInTheDocument()
  })

  it('filtra os insumos pela busca', async () => {
    render(<InsumosModal {...baseProps()} />)
    await userEvent.type(
      screen.getByPlaceholderText('Buscar por material, código ou descrição'),
      'parafuso',
    )
    expect(screen.queryByText('Cimento — CP-II — 50kg')).not.toBeInTheDocument()
    expect(screen.getByText('Parafuso — 3/4 — rosca soberba')).toBeInTheDocument()
  })

  it('mostra estado vazio quando não há insumos', () => {
    render(<InsumosModal {...baseProps()} variants={[]} />)
    expect(screen.getByText('Nenhum insumo encontrado.')).toBeInTheDocument()
  })

  it('abre o formulário de novo insumo e chama onCreateVariant', async () => {
    const onCreateVariant = vi.fn()
    render(<InsumosModal {...baseProps()} onCreateVariant={onCreateVariant} />)

    await userEvent.click(screen.getByRole('button', { name: '+ Novo insumo' }))
    await userEvent.selectOptions(screen.getByLabelText('Material'), 'm2')
    await userEvent.type(screen.getByLabelText('Código'), '1/2')
    await userEvent.type(screen.getByLabelText('Descrição'), 'rosca fina')
    await userEvent.type(screen.getByLabelText('Unidade'), 'un')
    await userEvent.click(screen.getByRole('button', { name: 'Adicionar insumo' }))

    expect(onCreateVariant).toHaveBeenCalledWith('m2', '1/2', 'rosca fina', 'un')
  })

  it('cancela o formulário de novo insumo sem chamar onCreateVariant', async () => {
    const onCreateVariant = vi.fn()
    render(<InsumosModal {...baseProps()} onCreateVariant={onCreateVariant} />)

    await userEvent.click(screen.getByRole('button', { name: '+ Novo insumo' }))
    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }))

    expect(onCreateVariant).not.toHaveBeenCalled()
    expect(screen.queryByLabelText('Código')).not.toBeInTheDocument()
  })

  it('não mostra nada quando fechado', () => {
    render(<InsumosModal {...baseProps()} isOpen={false} />)
    expect(screen.queryByText('Insumos')).not.toBeInTheDocument()
  })

  it('chama onDeleteVariant ao clicar no ícone de excluir de um insumo', async () => {
    const onDeleteVariant = vi.fn()
    render(<InsumosModal {...baseProps()} onDeleteVariant={onDeleteVariant} />)

    await userEvent.click(screen.getByRole('button', { name: 'Excluir Cimento — CP-II — 50kg' }))

    expect(onDeleteVariant).toHaveBeenCalledWith('v1')
  })

  it('desabilita os botões de excluir enquanto isDeleting é true', () => {
    render(<InsumosModal {...baseProps()} isDeleting />)

    expect(screen.getByRole('button', { name: 'Excluir Cimento — CP-II — 50kg' })).toBeDisabled()
  })

  it('mostra a unidade junto com o insumo quando cadastrada', () => {
    render(
      <InsumosModal
        {...baseProps()}
        variants={[
          {
            id: 'v1',
            materialId: 'm1',
            materialName: 'Cimento',
            code: 'CP-II',
            description: '50kg',
            unitOfMeasure: 'sc',
          },
        ]}
      />,
    )

    expect(screen.getByText('Cimento — CP-II — 50kg (sc)')).toBeInTheDocument()
  })
})
