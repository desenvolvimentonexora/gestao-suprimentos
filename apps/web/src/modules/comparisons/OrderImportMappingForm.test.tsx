import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { OrderImportMappingForm } from './OrderImportMappingForm'

const columns = ['SOL', 'Pedido', 'Fornecedor', 'Material', 'Qtd', 'Preço', 'Entrega']

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

  it('mostra os campos opcionais de código do insumo e data de entrega', () => {
    render(<OrderImportMappingForm columns={columns} onConfirm={vi.fn()} onCancel={vi.fn()} />)
    expect(screen.getByLabelText('Código do insumo')).toBeInTheDocument()
    expect(screen.getByLabelText('Data prevista de entrega')).toBeInTheDocument()
  })

  it('pré-preenche com o mapeamento salvo quando fornecido', () => {
    render(
      <OrderImportMappingForm
        columns={columns}
        initialMapping={{
          externalRef: 'SOL',
          orderNumber: 'Pedido',
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
    expect(screen.getByLabelText('Data prevista de entrega')).toHaveValue('Entrega')
  })

  it('exige que os campos obrigatórios sejam mapeados', async () => {
    const user = userEvent.setup()
    const onConfirm = vi.fn()
    render(<OrderImportMappingForm columns={columns} onConfirm={onConfirm} onCancel={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: /confirmar mapeamento/i }))

    expect(await screen.findAllByText('Selecione a coluna correspondente.')).toHaveLength(6)
    expect(onConfirm).not.toHaveBeenCalled()
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
      supplier: 'Fornecedor',
      material: 'Material',
      materialCode: '',
      quantity: 'Qtd',
      unitPrice: 'Preço',
      expectedDeliveryDate: '',
    })
  })
})
