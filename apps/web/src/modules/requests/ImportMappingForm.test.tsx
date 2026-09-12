import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ImportMappingForm } from './ImportMappingForm'

const columns = ['Obra', 'Insumo', 'Qtd', 'Prazo', 'SOL']

describe('ImportMappingForm', () => {
  it('lista as colunas encontradas em cada campo obrigatório', () => {
    render(<ImportMappingForm columns={columns} onConfirm={vi.fn()} onCancel={vi.fn()} />)
    expect(screen.getByLabelText('Unidade')).toBeInTheDocument()
    expect(screen.getByLabelText('Material')).toBeInTheDocument()
    expect(screen.getByLabelText('Quantidade')).toBeInTheDocument()
  })

  it('pré-preenche com o mapeamento salvo quando fornecido', () => {
    render(
      <ImportMappingForm
        columns={columns}
        initialMapping={{
          unit: 'Obra',
          material: 'Insumo',
          materialCode: '',
          quantity: 'Qtd',
          neededBy: 'Prazo',
          externalRef: 'SOL',
        }}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    )
    expect(screen.getByLabelText('Unidade')).toHaveValue('Obra')
    expect(screen.getByLabelText('Prazo')).toHaveValue('Prazo')
  })

  it('mostra o campo opcional de código do insumo', () => {
    render(<ImportMappingForm columns={columns} onConfirm={vi.fn()} onCancel={vi.fn()} />)
    expect(screen.getByLabelText('Código do insumo')).toBeInTheDocument()
  })

  it('exige que os campos obrigatórios sejam mapeados', async () => {
    const user = userEvent.setup()
    const onConfirm = vi.fn()
    render(<ImportMappingForm columns={columns} onConfirm={onConfirm} onCancel={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: /confirmar mapeamento/i }))

    expect(await screen.findAllByText('Selecione a coluna correspondente.')).toHaveLength(3)
    expect(onConfirm).not.toHaveBeenCalled()
  })

  it('confirma o mapeamento preenchido', async () => {
    const user = userEvent.setup()
    const onConfirm = vi.fn()
    render(<ImportMappingForm columns={columns} onConfirm={onConfirm} onCancel={vi.fn()} />)

    await user.selectOptions(screen.getByLabelText('Unidade'), 'Obra')
    await user.selectOptions(screen.getByLabelText('Material'), 'Insumo')
    await user.selectOptions(screen.getByLabelText('Quantidade'), 'Qtd')
    await user.click(screen.getByRole('button', { name: /confirmar mapeamento/i }))

    expect(onConfirm).toHaveBeenCalledWith({
      unit: 'Obra',
      material: 'Insumo',
      materialCode: '',
      quantity: 'Qtd',
      neededBy: '',
      externalRef: '',
    })
  })
})
