import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { SupplierFormModal } from './SupplierFormModal'
import type { MaterialRow } from './types'

const allMaterials: MaterialRow[] = [
  { id: 'm1', name: 'Cimento', categoryId: 'c1', supplierCount: 3, icon: 'layers' },
  { id: 'm2', name: 'Areia', categoryId: 'c1', supplierCount: 1, icon: 'layers' },
]

function baseProps() {
  return {
    isOpen: true,
    onClose: vi.fn(),
    mode: 'create' as const,
    allMaterials,
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

  it('filtra os materiais pela busca e envia os selecionados', async () => {
    const props = baseProps()
    render(<SupplierFormModal {...props} />)

    await userEvent.type(screen.getByLabelText('Nome', { exact: true }), 'Fornecedor Teste')
    await userEvent.type(screen.getByPlaceholderText('Buscar material'), 'cimento')

    expect(screen.queryByLabelText('Areia')).not.toBeInTheDocument()
    await userEvent.click(screen.getByLabelText('Cimento'))

    await userEvent.click(screen.getByRole('button', { name: 'Cadastrar fornecedor' }))

    expect(props.onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Fornecedor Teste', materialIds: ['m1'] }),
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
          materialIds: ['m2'],
        }}
      />,
    )

    expect(screen.getByLabelText('Nome', { exact: true })).toHaveValue('Fornecedor Existente')
    expect(screen.getByLabelText(/CNPJ/)).toHaveValue('12.345.678/0001-90')
    expect(screen.getByRole('button', { name: 'Salvar alterações' })).toBeInTheDocument()
  })
})
