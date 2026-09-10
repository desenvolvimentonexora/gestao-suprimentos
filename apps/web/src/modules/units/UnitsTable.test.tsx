import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { UnitsTable } from './UnitsTable'
import type { UnitRow } from './types'

const units: UnitRow[] = [
  {
    id: 'u1',
    name: 'UP Graça',
    cnpj: null,
    zipCode: null,
    street: null,
    number: null,
    neighborhood: null,
    city: 'Salvador',
    state: 'BA',
    type: 'obra',
    status: 'active',
    startDate: null,
    endDate: null,
    engineerName: 'Rafael Nogueira',
    engineerPhone: null,
    engineerEmail: null,
    adminName: null,
    adminPhone: null,
    adminEmail: null,
  },
]

function baseProps() {
  return {
    units,
    search: '',
    onSearchChange: vi.fn(),
    statusFilter: null,
    onStatusFilterChange: vi.fn(),
    typeFilter: null,
    onTypeFilterChange: vi.fn(),
    onAddUnit: vi.fn(),
    onEditUnit: vi.fn(),
    onDeleteUnit: vi.fn(),
  }
}

describe('UnitsTable', () => {
  it('mostra as unidades com nome, cidade/UF, tipo, status e responsável técnico', () => {
    render(<UnitsTable {...baseProps()} />)
    expect(screen.getByText('UP Graça')).toBeInTheDocument()
    expect(screen.getByText('Salvador/BA')).toBeInTheDocument()
    expect(screen.getByText('Rafael Nogueira')).toBeInTheDocument()
    expect(screen.getByText('Ativa', { selector: 'span' })).toBeInTheDocument()
  })

  it('mostra o estado vazio quando não há unidades', () => {
    render(<UnitsTable {...baseProps()} units={[]} />)
    expect(
      screen.getByText('Nenhuma unidade cadastrada ainda. Cadastre a primeira.'),
    ).toBeInTheDocument()
  })

  it('chama onAddUnit ao clicar em nova unidade', async () => {
    const user = userEvent.setup()
    const onAddUnit = vi.fn()
    render(<UnitsTable {...baseProps()} onAddUnit={onAddUnit} />)
    await user.click(screen.getByRole('button', { name: /nova unidade/i }))
    expect(onAddUnit).toHaveBeenCalled()
  })

  it('chama onEditUnit ao clicar em editar', async () => {
    const user = userEvent.setup()
    const onEditUnit = vi.fn()
    render(<UnitsTable {...baseProps()} onEditUnit={onEditUnit} />)
    await user.click(screen.getByRole('button', { name: /editar up graça/i }))
    expect(onEditUnit).toHaveBeenCalledWith('u1')
  })

  it('pede confirmação e chama onDeleteUnit ao excluir', async () => {
    const user = userEvent.setup()
    const onDeleteUnit = vi.fn()
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    render(<UnitsTable {...baseProps()} onDeleteUnit={onDeleteUnit} />)
    await user.click(screen.getByRole('button', { name: /excluir up graça/i }))
    expect(onDeleteUnit).toHaveBeenCalledWith('u1')
  })

  it('não chama onDeleteUnit quando a confirmação é cancelada', async () => {
    const user = userEvent.setup()
    const onDeleteUnit = vi.fn()
    vi.spyOn(window, 'confirm').mockReturnValue(false)
    render(<UnitsTable {...baseProps()} onDeleteUnit={onDeleteUnit} />)
    await user.click(screen.getByRole('button', { name: /excluir up graça/i }))
    expect(onDeleteUnit).not.toHaveBeenCalled()
  })

  it('atualiza a busca ao digitar', async () => {
    const user = userEvent.setup()
    const onSearchChange = vi.fn()
    render(<UnitsTable {...baseProps()} onSearchChange={onSearchChange} />)
    await user.type(screen.getByPlaceholderText('Buscar unidade'), 'a')
    expect(onSearchChange).toHaveBeenCalledWith('a')
  })
})
