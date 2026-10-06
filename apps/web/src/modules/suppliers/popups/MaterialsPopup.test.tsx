import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { MaterialsPopup } from './MaterialsPopup'
import type { MaterialRow, MaterialVariantRow } from '../types'
import type { SupplierMaterialLinkRow } from './types'

const links: SupplierMaterialLinkRow[] = [
  {
    materialVariantId: 'v1',
    materialName: 'Cimento',
    code: null,
    description: null,
    unitOfMeasure: null,
    purchaseDays: null,
    pickingDays: null,
    deliveryDays: null,
  },
]

const allMaterials: MaterialRow[] = [
  { id: 'm1', name: 'Cimento', categoryId: 'c1', supplierCount: 1, icon: 'layers' },
  { id: 'm2', name: 'Areia', categoryId: 'c1', supplierCount: 0, icon: 'layers' },
  { id: 'm3', name: 'Aço', categoryId: 'c1', supplierCount: 2, icon: 'layers' },
]

const allMaterialVariants: MaterialVariantRow[] = [
  { id: 'v1', materialId: 'm1', materialName: 'Cimento', code: null, description: null, unitOfMeasure: null },
  {
    id: 'v2',
    materialId: 'm2',
    materialName: 'Areia',
    code: 'ARE-1',
    description: null,
    unitOfMeasure: 'm3',
  },
  {
    id: 'v3',
    materialId: 'm3',
    materialName: 'Aço',
    code: 'CA-50',
    description: 'Vergalhão 10mm',
    unitOfMeasure: 'un',
  },
  { id: 'v4', materialId: 'm3', materialName: 'Aço', code: 'CA-60', description: null, unitOfMeasure: null },
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
    onUpdateLeadTimes: vi.fn(),
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
        links={[
          {
            materialVariantId: 'v3',
            materialName: 'Aço',
            code: 'CA-50',
            description: 'Vergalhão 10mm',
            unitOfMeasure: 'un',
            purchaseDays: null,
            pickingDays: null,
            deliveryDays: null,
          },
        ]}
      />,
    )
    expect(screen.getByText('CA-50')).toBeInTheDocument()
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

  it('o botão "+ Nova variação" abre o formulário de cadastro direto, sem precisar buscar antes', async () => {
    render(<MaterialsPopup {...baseProps()} />)

    expect(screen.queryByLabelText('Material')).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: '+ Nova variação' }))

    expect(screen.getByLabelText('Material')).toBeInTheDocument()
    expect(screen.getByLabelText('Código')).toBeInTheDocument()
    expect(screen.getByLabelText('Unidade')).toBeInTheDocument()
  })

  it('cadastra uma nova variante pelo formulário aberto no botão', async () => {
    const onCreateVariant = vi.fn().mockResolvedValue({
      id: 'v5',
      materialId: 'm3',
      materialName: 'Aço',
      code: 'CA-25',
      description: 'Vergalhão 6mm',
      unitOfMeasure: 'un',
    })
    const onAddLink = vi.fn()
    render(<MaterialsPopup {...baseProps()} onCreateVariant={onCreateVariant} onAddLink={onAddLink} />)

    await userEvent.click(screen.getByRole('button', { name: '+ Nova variação' }))
    await userEvent.selectOptions(screen.getByLabelText('Material'), 'm3')
    await userEvent.type(screen.getByLabelText('Código'), 'CA-25')
    await userEvent.type(screen.getByLabelText('Descrição'), 'Vergalhão 6mm')
    await userEvent.type(screen.getByLabelText('Unidade'), 'un')
    await userEvent.click(screen.getByRole('button', { name: '+ Adicionar variante' }))

    expect(onCreateVariant).toHaveBeenCalledWith('m3', 'CA-25', 'Vergalhão 6mm', 'un')
    expect(onAddLink).toHaveBeenCalledWith('v5')
  })

  it('pré-preenche o código no formulário com o que já foi digitado na busca', async () => {
    render(<MaterialsPopup {...baseProps()} />)

    await userEvent.type(screen.getByPlaceholderText('Buscar por código ou descrição'), 'CA-25')
    await userEvent.click(screen.getByRole('button', { name: '+ Nova variação' }))

    expect(screen.getByLabelText('Código')).toHaveValue('CA-25')
  })

  it('cancelar fecha o formulário de nova variação', async () => {
    render(<MaterialsPopup {...baseProps()} />)

    await userEvent.click(screen.getByRole('button', { name: '+ Nova variação' }))
    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }))

    expect(screen.queryByLabelText('Material')).not.toBeInTheDocument()
  })

  it('mostra unidade e o prazo (compra, picking, entrega) de cada insumo vinculado', () => {
    render(
      <MaterialsPopup
        {...baseProps()}
        links={[
          {
            materialVariantId: 'v3',
            materialName: 'Aço',
            code: 'CA-50',
            description: 'Vergalhão 10mm',
            unitOfMeasure: 'un',
            purchaseDays: 5,
            pickingDays: 1,
            deliveryDays: 2,
          },
        ]}
      />,
    )

    expect(screen.getByText('un')).toBeInTheDocument()
    expect(screen.getByLabelText('Compra Aço — CA-50 — Vergalhão 10mm')).toHaveValue(5)
    expect(screen.getByLabelText('Picking Aço — CA-50 — Vergalhão 10mm')).toHaveValue(1)
    expect(screen.getByLabelText('Entrega Aço — CA-50 — Vergalhão 10mm')).toHaveValue(2)
    expect(screen.getByText('8')).toBeInTheDocument()
  })

  it('mostra "ver mais" só para descrições longas e expande/recolhe a linha', async () => {
    const longDescription =
      'Prego de aço 2,5 polegadas com cabeça chata galvanizado para fixação em madeira de grande espessura'
    render(
      <MaterialsPopup
        {...baseProps()}
        links={[
          {
            materialVariantId: 'v3',
            materialName: 'Aço',
            code: 'CA-50',
            description: longDescription,
            unitOfMeasure: 'un',
            purchaseDays: null,
            pickingDays: null,
            deliveryDays: null,
          },
          {
            materialVariantId: 'v4',
            materialName: 'Aço',
            code: 'CA-60',
            description: 'Curto',
            unitOfMeasure: null,
            purchaseDays: null,
            pickingDays: null,
            deliveryDays: null,
          },
        ]}
      />,
    )

    expect(screen.getAllByRole('button', { name: /Ver mais/ })).toHaveLength(1)
    const toggle = screen.getByRole('button', { name: /Ver mais Aço — CA-50/ })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')

    await userEvent.click(toggle)
    expect(screen.getByRole('button', { name: /Ver menos Aço — CA-50/ })).toHaveAttribute('aria-expanded', 'true')

    await userEvent.click(screen.getByRole('button', { name: /Ver menos Aço — CA-50/ }))
    expect(screen.getByRole('button', { name: /Ver mais Aço — CA-50/ })).toHaveAttribute('aria-expanded', 'false')
  })

  it('chama onUpdateLeadTimes com os 3 valores ao editar um campo de prazo', async () => {
    const onUpdateLeadTimes = vi.fn()
    render(
      <MaterialsPopup
        {...baseProps()}
        onUpdateLeadTimes={onUpdateLeadTimes}
        links={[
          {
            materialVariantId: 'v3',
            materialName: 'Aço',
            code: 'CA-50',
            description: 'Vergalhão 10mm',
            unitOfMeasure: 'un',
            purchaseDays: 5,
            pickingDays: 1,
            deliveryDays: 2,
          },
        ]}
      />,
    )

    const pickingInput = screen.getByLabelText('Picking Aço — CA-50 — Vergalhão 10mm')
    await userEvent.clear(pickingInput)
    await userEvent.type(pickingInput, '3')
    await userEvent.tab()

    expect(onUpdateLeadTimes).toHaveBeenCalledWith('v3', {
      purchaseDays: 5,
      pickingDays: 3,
      deliveryDays: 2,
    })
  })
})
