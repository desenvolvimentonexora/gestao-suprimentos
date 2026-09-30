import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { OrderImportMappingForm } from './OrderImportMappingForm'

const columns = ['SOL', 'Pedido', 'Unidade', 'Fornecedor', 'Material', 'Código', 'Qtd', 'Preço', 'Entrega']

describe('OrderImportMappingForm', () => {
  it('lista as colunas encontradas em cada campo obrigatório', () => {
    render(<OrderImportMappingForm columns={columns} onConfirm={vi.fn()} onCancel={vi.fn()} />)
    expect(screen.getByLabelText('N° da SOL')).toBeInTheDocument()
    expect(screen.getByLabelText('N° do pedido')).toBeInTheDocument()
    expect(screen.getByLabelText('Fornecedor')).toBeInTheDocument()
    expect(screen.getByLabelText('Material')).toBeInTheDocument()
    expect(screen.getByLabelText('Quantidade')).toBeInTheDocument()
    expect(screen.getByLabelText('Preço unitário')).toBeInTheDocument()
  })

  it('mostra os campos opcionais de código do insumo, unidade e data de entrega', () => {
    render(<OrderImportMappingForm columns={columns} onConfirm={vi.fn()} onCancel={vi.fn()} />)
    expect(screen.getByLabelText('Código do insumo')).toBeInTheDocument()
    expect(screen.getByLabelText('Unidade')).toBeInTheDocument()
    expect(screen.getByLabelText('Data prevista de entrega')).toBeInTheDocument()
  })

  it('pré-preenche com o mapeamento salvo quando fornecido', () => {
    render(
      <OrderImportMappingForm
        columns={columns}
        initialMapping={{
          externalRef: 'SOL',
          orderNumber: 'Pedido',
          unit: 'Unidade',
          supplier: 'Fornecedor',
          material: 'Material',
          materialCode: '',
          quantity: 'Qtd',
          unitPrice: 'Preço',
          expectedDeliveryDate: 'Entrega',
        }}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    )
    expect(screen.getByLabelText('N° da SOL')).toHaveValue('SOL')
    expect(screen.getByLabelText('Unidade')).toHaveValue('Unidade')
    expect(screen.getByLabelText('Data prevista de entrega')).toHaveValue('Entrega')
  })

  it('exige que os campos obrigatórios sejam mapeados (SOL e Unidade ficam de fora — nenhum dos dois é obrigatório sozinho)', async () => {
    const user = userEvent.setup()
    const onConfirm = vi.fn()
    render(<OrderImportMappingForm columns={columns} onConfirm={onConfirm} onCancel={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: /confirmar mapeamento/i }))

    expect(await screen.findAllByText('Selecione a coluna correspondente.')).toHaveLength(4)
    expect(screen.getByText('Mapeie pelo menos o material ou o código do insumo.')).toBeInTheDocument()
    expect(onConfirm).not.toHaveBeenCalled()
  })

  it('aceita mapear só o código do insumo quando não há coluna de material genérico', async () => {
    const user = userEvent.setup()
    const onConfirm = vi.fn()
    render(<OrderImportMappingForm columns={columns} onConfirm={onConfirm} onCancel={vi.fn()} />)

    await user.selectOptions(screen.getByLabelText('N° do pedido'), 'Pedido')
    await user.selectOptions(screen.getByLabelText('Fornecedor'), 'Fornecedor')
    await user.selectOptions(screen.getByLabelText('Código do insumo'), 'Código')
    await user.selectOptions(screen.getByLabelText('Quantidade'), 'Qtd')
    await user.selectOptions(screen.getByLabelText('Preço unitário'), 'Preço')
    await user.click(screen.getByRole('button', { name: /confirmar mapeamento/i }))

    expect(onConfirm).toHaveBeenCalledWith({
      externalRef: '',
      orderNumber: 'Pedido',
      unit: '',
      supplier: 'Fornecedor',
      material: '',
      materialCode: 'Código',
      quantity: 'Qtd',
      unitPrice: 'Preço',
      expectedDeliveryDate: '',
    })
  })

  it('confirma o mapeamento preenchido', async () => {
    const user = userEvent.setup()
    const onConfirm = vi.fn()
    render(<OrderImportMappingForm columns={columns} onConfirm={onConfirm} onCancel={vi.fn()} />)

    await user.selectOptions(screen.getByLabelText('N° da SOL'), 'SOL')
    await user.selectOptions(screen.getByLabelText('N° do pedido'), 'Pedido')
    await user.selectOptions(screen.getByLabelText('Fornecedor'), 'Fornecedor')
    await user.selectOptions(screen.getByLabelText('Material'), 'Material')
    await user.selectOptions(screen.getByLabelText('Quantidade'), 'Qtd')
    await user.selectOptions(screen.getByLabelText('Preço unitário'), 'Preço')
    await user.click(screen.getByRole('button', { name: /confirmar mapeamento/i }))

    expect(onConfirm).toHaveBeenCalledWith({
      externalRef: 'SOL',
      orderNumber: 'Pedido',
      unit: '',
      supplier: 'Fornecedor',
      material: 'Material',
      materialCode: '',
      quantity: 'Qtd',
      unitPrice: 'Preço',
      expectedDeliveryDate: '',
    })
  })

  it('confirma pedido avulso sem SOL, mapeando a unidade da própria planilha', async () => {
    const user = userEvent.setup()
    const onConfirm = vi.fn()
    render(<OrderImportMappingForm columns={columns} onConfirm={onConfirm} onCancel={vi.fn()} />)

    await user.selectOptions(screen.getByLabelText('N° do pedido'), 'Pedido')
    await user.selectOptions(screen.getByLabelText('Unidade'), 'Unidade')
    await user.selectOptions(screen.getByLabelText('Fornecedor'), 'Fornecedor')
    await user.selectOptions(screen.getByLabelText('Material'), 'Material')
    await user.selectOptions(screen.getByLabelText('Quantidade'), 'Qtd')
    await user.selectOptions(screen.getByLabelText('Preço unitário'), 'Preço')
    await user.click(screen.getByRole('button', { name: /confirmar mapeamento/i }))

    expect(onConfirm).toHaveBeenCalledWith({
      externalRef: '',
      orderNumber: 'Pedido',
      unit: 'Unidade',
      supplier: 'Fornecedor',
      material: 'Material',
      materialCode: '',
      quantity: 'Qtd',
      unitPrice: 'Preço',
      expectedDeliveryDate: '',
    })
  })
})
