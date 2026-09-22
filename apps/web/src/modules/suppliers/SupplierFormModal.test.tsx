import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { SupplierFormModal } from './SupplierFormModal'
import type { MaterialVariantRow } from './types'

const allMaterialVariants: MaterialVariantRow[] = [
  { id: 'v1', materialId: 'm1', materialName: 'Cimento', code: '1023', description: null },
  { id: 'v2', materialId: 'm2', materialName: 'Areia', code: '1024', description: null },
]

function baseProps() {
  return {
    isOpen: true,
    onClose: vi.fn(),
    mode: 'create' as const,
    allMaterialVariants,
    onSubmit: vi.fn(),
    isSubmitting: false,
  }
}

describe('SupplierFormModal', () => {
  it('exibe erro de validação quando o nome não é informado', async () => {
    render(<SupplierFormModal {...baseProps()} />)

    await userEvent.click(screen.getByRole('button', { name: 'Cadastrar fornecedor' }))

    expect(await screen.findByText('Informe o nome.')).toBeInTheDocument()
  })

  it('começa com um campo de CNPJ e permite adicionar mais um', async () => {
    render(<SupplierFormModal {...baseProps()} />)

    expect(screen.getAllByRole('textbox', { name: /^CNPJ/ })).toHaveLength(1)

    await userEvent.click(screen.getByRole('button', { name: '+ Adicionar CNPJ' }))

    expect(screen.getAllByRole('textbox', { name: /^CNPJ/ })).toHaveLength(2)
  })

  it('filtra as variantes pela busca de código e envia as selecionadas', async () => {
    const props = baseProps()
    render(<SupplierFormModal {...props} />)

    await userEvent.type(screen.getByLabelText('Nome', { exact: true }), 'Fornecedor Teste')
    await userEvent.type(screen.getByPlaceholderText('Buscar por código ou descrição'), '1023')

    expect(screen.queryByText(/Areia/)).not.toBeInTheDocument()
    await userEvent.click(screen.getByLabelText(/Cimento/))

    await userEvent.click(screen.getByRole('button', { name: 'Cadastrar fornecedor' }))

    expect(props.onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Fornecedor Teste', materialVariantIds: ['v1'] }),
    )
  })

  it('no modo edição, pré-preenche os campos e mostra "Salvar alterações"', () => {
    render(
      <SupplierFormModal
        {...baseProps()}
        mode="edit"
        initialValues={{
          name: 'Fornecedor Existente',
          type: 'Distribuidor',
          city: 'São Paulo',
          status: 'inactive',
          notes: 'Observação interna',
          cnpjs: ['12.345.678/0001-90'],
          contactName: 'Ana',
          contactPhone: '11999999999',
          contactEmail: 'ana@fornecedor.com',
          materialVariantIds: ['v2'],
        }}
      />,
    )

    expect(screen.getByLabelText('Nome', { exact: true })).toHaveValue('Fornecedor Existente')
    expect(screen.getByLabelText(/CNPJ/)).toHaveValue('12.345.678/0001-90')
    expect(screen.getByRole('button', { name: 'Salvar alterações' })).toBeInTheDocument()
  })
})
