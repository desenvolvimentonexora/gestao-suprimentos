import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { RequestFormModal } from './RequestFormModal'
import type { MaterialOption, UnitOption } from './types'

const units: UnitOption[] = [
  { id: 'u1', name: 'UP Graça' },
  { id: 'u2', name: 'UP Barra' },
]

const materials: MaterialOption[] = [
  { id: 'm1', materialName: 'Cimento', code: '1023', description: null },
  { id: 'm2', materialName: 'Areia', code: null, description: null },
]

function baseProps() {
  return {
    isOpen: true,
    onClose: vi.fn(),
    mode: 'create' as const,
    units,
    materials,
    onSubmit: vi.fn(),
    isSubmitting: false,
  }
}

describe('RequestFormModal', () => {
  it('mostra o título de criação', () => {
    render(<RequestFormModal {...baseProps()} />)
    expect(screen.getByText('Nova requisição')).toBeInTheDocument()
  })

  it('mostra o título de edição', () => {
    render(<RequestFormModal {...baseProps()} mode="edit" />)
    expect(screen.getByText('Editar requisição')).toBeInTheDocument()
  })

  it('usa "Unidade" como rótulo padrão do campo de unidade', () => {
    render(<RequestFormModal {...baseProps()} />)
    expect(screen.getByLabelText('Unidade')).toBeInTheDocument()
  })

  it('usa o rótulo de vocabulário do cliente para o campo de unidade, quando informado', () => {
    render(<RequestFormModal {...baseProps()} unitLabel="Obra" />)
    expect(screen.getByLabelText('Obra')).toBeInTheDocument()
  })

  it('começa com um item vazio para preencher', () => {
    render(<RequestFormModal {...baseProps()} />)
    expect(screen.getAllByLabelText(/material/i)).toHaveLength(1)
  })

  it('exige unidade e ao menos um item válido ao enviar', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<RequestFormModal {...baseProps()} onSubmit={onSubmit} />)

    await user.click(screen.getByRole('button', { name: /criar requisição/i }))

    expect(await screen.findByText('Selecione a unidade.')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('adiciona e remove itens', async () => {
    const user = userEvent.setup()
    render(<RequestFormModal {...baseProps()} />)

    await user.click(screen.getByRole('button', { name: /adicionar item/i }))
    expect(screen.getAllByLabelText(/material/i)).toHaveLength(2)

    await user.click(screen.getAllByRole('button', { name: /remover item/i })[0]!)
    expect(screen.getAllByLabelText(/material/i)).toHaveLength(1)
  })

  it('envia os valores preenchidos', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<RequestFormModal {...baseProps()} onSubmit={onSubmit} />)

    await user.selectOptions(screen.getByLabelText('Unidade'), 'u1')
    await user.selectOptions(screen.getAllByLabelText(/material/i)[0]!, 'm1')
    await user.type(screen.getAllByLabelText(/quantidade/i)[0]!, '10')
    await user.click(screen.getByRole('button', { name: /criar requisição/i }))

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        unitId: 'u1',
        items: [expect.objectContaining({ materialId: 'm1', quantity: 10 })],
      }),
    )
  })

  it('inclui itens adicionados dinamicamente ao enviar', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<RequestFormModal {...baseProps()} onSubmit={onSubmit} />)

    await user.selectOptions(screen.getByLabelText('Unidade'), 'u1')
    await user.selectOptions(screen.getAllByLabelText(/material/i)[0]!, 'm1')
    await user.type(screen.getAllByLabelText(/quantidade/i)[0]!, '10')

    await user.click(screen.getByRole('button', { name: /adicionar item/i }))
    await user.selectOptions(screen.getAllByLabelText(/material/i)[1]!, 'm2')
    await user.type(screen.getAllByLabelText(/quantidade/i)[1]!, '5')

    await user.click(screen.getByRole('button', { name: /criar requisição/i }))

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        items: [
          expect.objectContaining({ materialId: 'm1', quantity: 10 }),
          expect.objectContaining({ materialId: 'm2', quantity: 5 }),
        ],
      }),
    )
  })

  it('mostra o código do material junto ao nome, quando existe', () => {
    render(<RequestFormModal {...baseProps()} />)
    expect(screen.getByRole('option', { name: '1023 · Cimento' })).toBeInTheDocument()
  })

  it('mostra só o nome quando o material não tem código', () => {
    render(<RequestFormModal {...baseProps()} />)
    expect(screen.getByRole('option', { name: 'Areia' })).toBeInTheDocument()
  })

  it('mostra a descrição da variante (o insumo específico), não o nome do material, quando há descrição — evita opções ambíguas quando duas variantes compartilham o mesmo material', () => {
    const props = baseProps()
    render(
      <RequestFormModal
        {...props}
        materials={[
          { id: 'v1', materialName: 'Abraçadeira Tipo U', code: '027818-005', description: 'ABRAÇADEIRA TIPO "U" 5" X 150 MM' },
          { id: 'v2', materialName: 'Abraçadeira Tipo U', code: '027818-006', description: 'ABRAÇADEIRA TIPO "U" 6" X 200 MM' },
        ]}
      />,
    )
    expect(screen.getByRole('option', { name: '027818-005 · ABRAÇADEIRA TIPO "U" 5" X 150 MM' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: '027818-006 · ABRAÇADEIRA TIPO "U" 6" X 200 MM' })).toBeInTheDocument()
  })

  it('agrupa as variantes do dropdown por material (optgroup), pra deixar claro o que cada material tem cadastrado', () => {
    render(
      <RequestFormModal
        {...baseProps()}
        materials={[
          { id: 'v1', materialName: 'Abraçadeira Tipo U', code: '027818-005', description: 'ABRAÇADEIRA "U" 5"' },
          { id: 'v2', materialName: 'Abraçadeira Tipo U', code: '027818-006', description: 'ABRAÇADEIRA "U" 6"' },
          { id: 'v3', materialName: 'Argamassa', code: null, description: null },
        ]}
      />,
    )
    const groups = document.querySelectorAll('optgroup')
    const labels = [...groups].map((group) => group.getAttribute('label'))
    expect(labels).toEqual(['Abraçadeira Tipo U', 'Argamassa'])

    const abracadeiraGroup = [...groups].find((group) => group.getAttribute('label') === 'Abraçadeira Tipo U')
    expect(abracadeiraGroup?.querySelectorAll('option')).toHaveLength(2)
  })
})
