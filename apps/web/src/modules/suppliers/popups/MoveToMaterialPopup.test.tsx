import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { MoveToMaterialPopup } from './MoveToMaterialPopup'
import type { CategoryRow, MaterialRow, MaterialVariantRow } from '../types'

const categories: CategoryRow[] = [
  { id: 'c1', name: 'Serralheria', slug: 'serralheria', icon: 'wrench' },
  { id: 'c2', name: 'Elétrica', slug: 'eletrica', icon: 'zap' },
]

const materials: MaterialRow[] = [
  { id: 'm1', name: 'Cabo CCI', categoryId: 'c2', supplierCount: 1, icon: 'cable' },
  { id: 'm2', name: 'Abraçadeira Tipo U', categoryId: 'c1', supplierCount: 2, icon: 'wrench' },
]

const materialVariants: MaterialVariantRow[] = [
  { id: 'v1', materialId: 'm1', materialName: 'Cabo CCI', code: '001', description: null },
  { id: 'v2', materialId: 'm2', materialName: 'Abraçadeira Tipo U', code: '005', description: 'ABRAÇADEIRA "U" 5"' },
  { id: 'v3', materialId: 'm2', materialName: 'Abraçadeira Tipo U', code: '006', description: 'ABRAÇADEIRA "U" 6"' },
]

function baseProps() {
  return {
    isOpen: true,
    onClose: vi.fn(),
    currentMaterialName: 'Argamassa',
    categories,
    materials,
    materialVariants,
    onConfirm: vi.fn(),
    isSubmitting: false,
  }
}

describe('MoveToMaterialPopup', () => {
  it('avisa que o fornecedor sai do material atual', () => {
    render(<MoveToMaterialPopup {...baseProps()} />)
    expect(screen.getByText(/deixará de aparecer em/i)).toBeInTheDocument()
    expect(screen.getByText('Argamassa')).toBeInTheDocument()
  })

  it('agrupa os materiais de destino por categoria', () => {
    render(<MoveToMaterialPopup {...baseProps()} />)
    const select = screen.getByLabelText('Material de destino')
    const groups = select.querySelectorAll('optgroup')
    expect(groups).toHaveLength(2)
    expect(groups[0]?.getAttribute('label')).toBe('Serralheria')
    expect(groups[1]?.getAttribute('label')).toBe('Elétrica')
  })

  it('não mostra seletor de variação quando o material só tem uma', () => {
    render(<MoveToMaterialPopup {...baseProps()} />)
    expect(screen.queryByLabelText('Variação')).not.toBeInTheDocument()
  })

  it('mostra seletor de variação quando o material tem mais de uma, e chama onConfirm com a variação escolhida', async () => {
    const user = userEvent.setup()
    const onConfirm = vi.fn()
    render(<MoveToMaterialPopup {...baseProps()} onConfirm={onConfirm} />)

    await user.selectOptions(screen.getByLabelText('Material de destino'), 'm2')
    expect(screen.getByLabelText('Variação')).toBeInTheDocument()

    await user.selectOptions(screen.getByLabelText('Variação'), 'v3')
    await user.click(screen.getByRole('button', { name: 'Mover' }))

    expect(onConfirm).toHaveBeenCalledWith('v3')
  })

  it('chama onConfirm com a única variação do material selecionado por padrão', async () => {
    const user = userEvent.setup()
    const onConfirm = vi.fn()
    render(<MoveToMaterialPopup {...baseProps()} onConfirm={onConfirm} />)

    await user.click(screen.getByRole('button', { name: 'Mover' }))

    expect(onConfirm).toHaveBeenCalledWith('v1')
  })

  it('chama onClose ao clicar em cancelar', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(<MoveToMaterialPopup {...baseProps()} onClose={onClose} />)

    await user.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(onClose).toHaveBeenCalled()
  })
})
