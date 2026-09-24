import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { RequestItemsTable } from './RequestItemsTable'
import type { RequestItemRow } from './types'

function makeItem(overrides: Partial<RequestItemRow>): RequestItemRow {
  return {
    id: 'i1',
    materialId: 'm1',
    materialName: 'Cimento CP-II',
    materialCode: '1023',
    materialDescription: 'Cimento CP-II 50kg saco',
    quantity: 10,
    unitOfMeasure: 'saco',
    statusCode: null,
    authorizedAt: null,
    pendente: false,
    motivoPendencia: null,
    ...overrides,
  }
}

function baseProps() {
  return {
    displayNumber: 'SOL 42',
    unitName: 'Depósito Simões Filho',
    items: [makeItem({})],
    neededBy: '2026-09-18',
    createdAt: '2026-09-10T00:00:00Z',
    diasValue: '3 dias',
  }
}

describe('RequestItemsTable', () => {
  it('mostra o código do material na coluna Insumo-Sub, com o nome como reserva sem código', () => {
    render(
      <RequestItemsTable
        {...baseProps()}
        items={[makeItem({ id: 'i2', materialCode: null, materialName: 'Areia' })]}
      />,
    )
    expect(screen.getByText('Areia')).toBeInTheDocument()
  })

  it('mostra a descrição do material, ou "—" quando não há', () => {
    render(
      <RequestItemsTable
        {...baseProps()}
        items={[makeItem({ id: 'i2', materialCode: null, materialDescription: null, materialName: 'Areia' })]}
      />,
    )
    const row = screen.getByText('Areia').closest('tr')
    expect(row?.textContent).toContain('—')
  })

  it('mostra a referência formatada de cada item', () => {
    render(
      <RequestItemsTable
        {...baseProps()}
        items={[makeItem({ id: 'i1' }), makeItem({ id: 'i2', materialName: 'Areia', materialCode: null })]}
      />,
    )
    expect(screen.getByText('SOL 42/001')).toBeInTheDocument()
    expect(screen.getByText('SOL 42/002')).toBeInTheDocument()
  })

  it('repete o mesmo valor de dias em todas as linhas', () => {
    render(
      <RequestItemsTable
        {...baseProps()}
        items={[makeItem({ id: 'i1' }), makeItem({ id: 'i2', materialName: 'Areia', materialCode: null })]}
        diasValue="-4 dias"
      />,
    )
    expect(screen.getAllByText('-4 dias')).toHaveLength(2)
  })
})
