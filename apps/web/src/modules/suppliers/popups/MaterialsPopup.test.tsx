import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { MaterialsPopup } from './MaterialsPopup'
import type { MaterialRow, MaterialVariantRow } from '../types'
import type { SupplierMaterialLinkRow } from './types'

const links: SupplierMaterialLinkRow[] = [
  { materialVariantId: 'v1', materialName: 'Cimento', code: null, description: null },
]

const allMaterials: MaterialRow[] = [
  { id: 'm1', name: 'Cimento', categoryId: 'c1', supplierCount: 1, icon: 'layers' },
  { id: 'm2', name: 'Areia', categoryId: 'c1', supplierCount: 0, icon: 'layers' },
  { id: 'm3', name: 'Aço', categoryId: 'c1', supplierCount: 2, icon: 'layers' },
]

const allMaterialVariants: MaterialVariantRow[] = [
  { id: 'v1', materialId: 'm1', materialName: 'Cimento', code: null, description: null },
  { id: 'v2', materialId: 'm2', materialName: 'Areia', code: 'ARE-1', description: null },
  { id: 'v3', materialId: 'm3', materialName: 'Aço', code: 'CA-50', description: 'Vergalhão 10mm' },
  { id: 'v4', materialId: 'm3', materialName: 'Aço', code: 'CA-60', description: null },
]

function baseProps() {
  return {
    isOpen: true as const,
    onClose: vi.fn(),
    links,
    allMaterials,
    allMaterialVariants,
    onAddLink: vi.fn(),
    onRemoveLink: vi.fn(),
    onCreateVariant: vi.fn(),
  }
}

describe('MaterialsPopup', () => {
  it('lista os materiais já vinculados', () => {
    render(<MaterialsPopup {...baseProps()} />)
    expect(screen.getByText('Cimento')).toBeInTheDocument()
  })

  it('chama onRemoveLink ao clicar em remover', async () => {
    const onRemoveLink = vi.fn()
    render(<MaterialsPopup {...baseProps()} onRemoveLink={onRemoveLink} />)

    await userEvent.click(screen.getByRole('button', { name: 'Remover Cimento' }))

    expect(onRemoveLink).toHaveBeenCalledWith('v1')
  })

  it('busca e adiciona uma variante ainda não vinculada, pelo código', async () => {
    const onAddLink = vi.fn()
    render(<MaterialsPopup {...baseProps()} onAddLink={onAddLink} />)

    await userEvent.type(screen.getByPlaceholderText('Buscar por código ou descrição'), 'are-1')
    await userEvent.click(screen.getByRole('button', { name: /Adicionar Areia/ }))

    expect(onAddLink).toHaveBeenCalledWith('v2')
  })

  it('mostra o código da variante vinculada, para diferenciar variantes do mesmo material', () => {
    render(
      <MaterialsPopup
        {...baseProps()}
        links={[{ materialVariantId: 'v3', materialName: 'Aço', code: 'CA-50', description: 'Vergalhão 10mm' }]}
      />,
    )
    expect(screen.getByText(/CA-50/)).toBeInTheDocument()
  })

  it('distingue sugestões do mesmo material pelo código, na busca e no rótulo do botão', async () => {
    const onAddLink = vi.fn()
    render(<MaterialsPopup {...baseProps()} onAddLink={onAddLink} />)

    await userEvent.type(screen.getByPlaceholderText('Buscar por código ou descrição'), 'CA-')

    await userEvent.click(screen.getByRole('button', { name: /Adicionar Aço.*CA-60/ }))
    expect(onAddLink).toHaveBeenCalledWith('v4')
  })

  it('busca sugestões também pela descrição da variante', async () => {
    const onAddLink = vi.fn()
    render(<MaterialsPopup {...baseProps()} onAddLink={onAddLink} />)

    await userEvent.type(screen.getByPlaceholderText('Buscar por código ou descrição'), 'vergalhão')
    await userEvent.click(screen.getByRole('button', { name: /Adicionar Aço.*CA-50/ }))
    expect(onAddLink).toHaveBeenCalledWith('v3')
  })

  it('sem sugestões, oferece cadastrar o texto buscado como nova variante de um material escolhido', async () => {
    const onCreateVariant = vi.fn().mockResolvedValue({
      id: 'v5',
      materialId: 'm3',
      materialName: 'Aço',
      code: 'CA-25',
      description: 'Vergalhão 6mm',
    })
    const onAddLink = vi.fn()
    render(<MaterialsPopup {...baseProps()} onCreateVariant={onCreateVariant} onAddLink={onAddLink} />)

    await userEvent.type(screen.getByPlaceholderText('Buscar por código ou descrição'), 'CA-25')
    await userEvent.selectOptions(screen.getByLabelText('Material'), 'm3')
    await userEvent.type(screen.getByLabelText('Descrição'), 'Vergalhão 6mm')
    await userEvent.click(screen.getByRole('button', { name: '+ Adicionar variante' }))

    expect(onCreateVariant).toHaveBeenCalledWith('m3', 'CA-25', 'Vergalhão 6mm')
    expect(onAddLink).toHaveBeenCalledWith('v5')
  })
})
