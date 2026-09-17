import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { MaterialsPopup } from './MaterialsPopup'
import type { MaterialRow } from '../types'
import type { SupplierMaterialLinkRow } from './types'

const links: SupplierMaterialLinkRow[] = [{ materialId: 'm1', materialName: 'Cimento', materialCode: null }]

const allMaterials: MaterialRow[] = [
  { id: 'm1', name: 'Cimento', categoryId: 'c1', supplierCount: 1, icon: 'layers', code: null, description: null },
  { id: 'm2', name: 'Areia', categoryId: 'c1', supplierCount: 0, icon: 'layers', code: null, description: null },
  { id: 'm3', name: 'Aço', categoryId: 'c1', supplierCount: 2, icon: 'layers', code: 'CA-50', description: null },
  { id: 'm4', name: 'Aço', categoryId: 'c1', supplierCount: 1, icon: 'layers', code: 'CA-60', description: null },
]

describe('MaterialsPopup', () => {
  it('lista os materiais já vinculados', () => {
    render(
      <MaterialsPopup
        isOpen
        onClose={vi.fn()}
        links={links}
        allMaterials={allMaterials}
        onAddLink={vi.fn()}
        onRemoveLink={vi.fn()}
      />,
    )
    expect(screen.getByText('Cimento')).toBeInTheDocument()
  })

  it('chama onRemoveLink ao clicar em remover', async () => {
    const onRemoveLink = vi.fn()
    render(
      <MaterialsPopup
        isOpen
        onClose={vi.fn()}
        links={links}
        allMaterials={allMaterials}
        onAddLink={vi.fn()}
        onRemoveLink={onRemoveLink}
      />,
    )

    await userEvent.click(screen.getByRole('button', { name: 'Remover Cimento' }))

    expect(onRemoveLink).toHaveBeenCalledWith('m1')
  })

  it('busca e adiciona um material ainda não vinculado', async () => {
    const onAddLink = vi.fn()
    render(
      <MaterialsPopup
        isOpen
        onClose={vi.fn()}
        links={links}
        allMaterials={allMaterials}
        onAddLink={onAddLink}
        onRemoveLink={vi.fn()}
      />,
    )

    await userEvent.type(screen.getByPlaceholderText('Buscar material para adicionar'), 'are')
    await userEvent.click(screen.getByRole('button', { name: 'Adicionar Areia' }))

    expect(onAddLink).toHaveBeenCalledWith('m2')
  })

  it('mostra o código do material vinculado, para diferenciar materiais com o mesmo nome', () => {
    render(
      <MaterialsPopup
        isOpen
        onClose={vi.fn()}
        links={[{ materialId: 'm3', materialName: 'Aço', materialCode: 'CA-50' }]}
        allMaterials={allMaterials}
        onAddLink={vi.fn()}
        onRemoveLink={vi.fn()}
      />,
    )
    expect(screen.getByText('CA-50')).toBeInTheDocument()
  })

  it('distingue sugestões com o mesmo nome pelo código, na busca e no rótulo do botão', async () => {
    const onAddLink = vi.fn()
    render(
      <MaterialsPopup
        isOpen
        onClose={vi.fn()}
        links={links}
        allMaterials={allMaterials}
        onAddLink={onAddLink}
        onRemoveLink={vi.fn()}
      />,
    )

    await userEvent.type(screen.getByPlaceholderText('Buscar material para adicionar'), 'aço')

    await userEvent.click(screen.getByRole('button', { name: /Adicionar Aço.*CA-60/ }))
    expect(onAddLink).toHaveBeenCalledWith('m4')
  })

  it('busca sugestões também pelo código do material', async () => {
    const onAddLink = vi.fn()
    render(
      <MaterialsPopup
        isOpen
        onClose={vi.fn()}
        links={links}
        allMaterials={allMaterials}
        onAddLink={onAddLink}
        onRemoveLink={vi.fn()}
      />,
    )

    await userEvent.type(screen.getByPlaceholderText('Buscar material para adicionar'), 'CA-60')
    await userEvent.click(screen.getByRole('button', { name: /Adicionar Aço.*CA-60/ }))
    expect(onAddLink).toHaveBeenCalledWith('m4')
  })
})
