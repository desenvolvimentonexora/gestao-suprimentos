import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ImportMappingForm } from './ImportMappingForm'

const columns = ['Obra', 'Insumo', 'Qtd', 'Prazo', 'SOL', 'Sit']

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
          unitOfMeasure: '',
          neededBy: 'Prazo',
          externalRef: 'SOL',
          status: '',
          openStatusValue: '',
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

  it('mostra o campo opcional de unidade de medida', () => {
    render(<ImportMappingForm columns={columns} onConfirm={vi.fn()} onCancel={vi.fn()} />)
    expect(screen.getByLabelText('Unidade de medida')).toBeInTheDocument()
  })

  it('exige que os campos obrigatórios sejam mapeados', async () => {
    const user = userEvent.setup()
    const onConfirm = vi.fn()
    render(<ImportMappingForm columns={columns} onConfirm={onConfirm} onCancel={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: /confirmar mapeamento/i }))

    expect(await screen.findAllByText('Selecione a coluna correspondente.')).toHaveLength(2)
    expect(screen.getByText('Mapeie pelo menos o material ou o código do insumo.')).toBeInTheDocument()
    expect(onConfirm).not.toHaveBeenCalled()
  })

  it('aceita mapear só o código do insumo quando não há coluna de material genérico', async () => {
    const user = userEvent.setup()
    const onConfirm = vi.fn()
    render(<ImportMappingForm columns={columns} onConfirm={onConfirm} onCancel={vi.fn()} />)

    await user.selectOptions(screen.getByLabelText('Unidade'), 'Obra')
    await user.selectOptions(screen.getByLabelText('Código do insumo'), 'Insumo')
    await user.selectOptions(screen.getByLabelText('Quantidade'), 'Qtd')
    await user.click(screen.getByRole('button', { name: /confirmar mapeamento/i }))

    expect(onConfirm).toHaveBeenCalledWith({
      unit: 'Obra',
      material: '',
      materialCode: 'Insumo',
      quantity: 'Qtd',
      unitOfMeasure: '',
      neededBy: '',
      externalRef: '',
      status: '',
      openStatusValue: '',
    })
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
      unitOfMeasure: '',
      neededBy: '',
      externalRef: '',
      status: '',
      openStatusValue: '',
    })
  })

  it('mostra o campo de valor "aberto" só depois de mapear a coluna de situação', async () => {
    const user = userEvent.setup()
    render(<ImportMappingForm columns={columns} onConfirm={vi.fn()} onCancel={vi.fn()} />)

    expect(screen.queryByLabelText('Valor que indica SOL aberta')).not.toBeInTheDocument()

    await user.selectOptions(screen.getByLabelText('Situação da SOL'), 'Sit')

    expect(screen.getByLabelText('Valor que indica SOL aberta')).toBeInTheDocument()
  })

  it('exige o valor de "aberto" quando a coluna de situação é mapeada', async () => {
    const user = userEvent.setup()
    const onConfirm = vi.fn()
    render(<ImportMappingForm columns={columns} onConfirm={onConfirm} onCancel={vi.fn()} />)

    await user.selectOptions(screen.getByLabelText('Unidade'), 'Obra')
    await user.selectOptions(screen.getByLabelText('Material'), 'Insumo')
    await user.selectOptions(screen.getByLabelText('Quantidade'), 'Qtd')
    await user.selectOptions(screen.getByLabelText('Situação da SOL'), 'Sit')
    await user.click(screen.getByRole('button', { name: /confirmar mapeamento/i }))

    expect(await screen.findByText('Informe qual valor da coluna indica uma SOL aberta.')).toBeInTheDocument()
    expect(onConfirm).not.toHaveBeenCalled()
  })

  it('inclui a situação e o valor de "aberto" no mapeamento confirmado', async () => {
    const user = userEvent.setup()
    const onConfirm = vi.fn()
    render(<ImportMappingForm columns={columns} onConfirm={onConfirm} onCancel={vi.fn()} />)

    await user.selectOptions(screen.getByLabelText('Unidade'), 'Obra')
    await user.selectOptions(screen.getByLabelText('Material'), 'Insumo')
    await user.selectOptions(screen.getByLabelText('Quantidade'), 'Qtd')
    await user.selectOptions(screen.getByLabelText('Situação da SOL'), 'Sit')
    await user.type(screen.getByLabelText('Valor que indica SOL aberta'), 'AB')
    await user.click(screen.getByRole('button', { name: /confirmar mapeamento/i }))

    expect(onConfirm).toHaveBeenCalledWith({
      unit: 'Obra',
      material: 'Insumo',
      materialCode: '',
      quantity: 'Qtd',
      unitOfMeasure: '',
      neededBy: '',
      externalRef: '',
      status: 'Sit',
      openStatusValue: 'AB',
    })
  })
})
