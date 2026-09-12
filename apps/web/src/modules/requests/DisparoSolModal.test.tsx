import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { DisparoSolModal } from './DisparoSolModal'
import type { MaterialWithSupplierCount, RequestRow, UnitOption } from './types'

const units: UnitOption[] = [
  { id: 'u1', name: 'UP Graça' },
  { id: 'u2', name: 'UP Barra' },
]

const materials: MaterialWithSupplierCount[] = [
  { id: 'm1', name: 'Argamassa', supplierCount: 3, code: '1023' },
  { id: 'm2', name: 'Tintas', supplierCount: 5, code: null },
]

const request: RequestRow = {
  id: 'r1',
  unitId: 'u1',
  unitName: 'UP Graça',
  status: 'open',
  neededBy: null,
  externalRef: 'SOL-42',
  createdAt: '2026-09-01T00:00:00Z',
  subjectCategory: null,
  notes: null,
  negotiatorId: null,
  negotiatorName: null,
  negotiatingStartedAt: null,
  quotationsCount: 0,
  items: [
    {
      id: 'i1',
      materialId: 'm1',
      materialName: 'Argamassa',
      quantity: 20,
      unitOfMeasure: 'sc',
      statusCode: null,
      authorizedAt: null,
    },
  ],
}

function baseProps() {
  return {
    isOpen: true,
    onClose: vi.fn(),
    request,
    units,
    materials,
    onSubmit: vi.fn(),
    isSubmitting: false,
  }
}

describe('DisparoSolModal', () => {
  it('mostra o número da SOL e a contagem de itens no cabeçalho', () => {
    render(<DisparoSolModal {...baseProps()} />)
    expect(screen.getByText(/disparar sol sol-42/i)).toBeInTheDocument()
    expect(screen.getByText(/1 item/i)).toBeInTheDocument()
  })

  it('pré-seleciona a unidade atual da requisição na faixa de obra', () => {
    render(<DisparoSolModal {...baseProps()} />)
    expect(screen.getByLabelText(/obra/i)).toHaveValue('u1')
  })

  it('pré-marca os materiais que já são itens da requisição', () => {
    render(<DisparoSolModal {...baseProps()} />)
    expect(screen.getByRole('checkbox', { name: /argamassa/i })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: /tintas/i })).not.toBeChecked()
  })

  it('mostra a contagem de fornecedores por material', () => {
    render(<DisparoSolModal {...baseProps()} />)
    expect(screen.getByText(/3 fornecedores/i)).toBeInTheDocument()
  })

  it('mostra o código do material no checklist, quando existe', () => {
    render(<DisparoSolModal {...baseProps()} />)
    expect(screen.getByText('1023 · Argamassa')).toBeInTheDocument()
  })

  it('mostra só o nome quando o material não tem código', () => {
    render(<DisparoSolModal {...baseProps()} />)
    expect(screen.getByText('Tintas')).toBeInTheDocument()
  })

  it('filtra a lista de materiais pela busca', async () => {
    const user = userEvent.setup()
    render(<DisparoSolModal {...baseProps()} />)
    await user.type(screen.getByPlaceholderText(/buscar insumo/i), 'tinta')
    expect(screen.queryByRole('checkbox', { name: /argamassa/i })).not.toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: /tintas/i })).toBeInTheDocument()
  })

  it('monta o link mailto com assunto da SOL', () => {
    render(<DisparoSolModal {...baseProps()} />)
    const link = screen.getByRole('link', { name: /abrir gmail e marcar como enviada/i })
    expect(link.getAttribute('href')).toContain('mailto:')
    expect(decodeURIComponent(link.getAttribute('href') ?? '')).toContain('SOL-42')
  })

  it('chama onSubmit com os valores preenchidos ao clicar em disparar', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<DisparoSolModal {...baseProps()} onSubmit={onSubmit} />)

    await user.type(screen.getByLabelText(/categoria do material/i), 'Elétrica')
    await user.type(screen.getByLabelText(/observaç/i), 'Confirmar prazo com o fornecedor.')
    await user.click(screen.getByRole('link', { name: /abrir gmail e marcar como enviada/i }))

    expect(onSubmit).toHaveBeenCalledWith({
      unitId: 'u1',
      subjectCategory: 'Elétrica',
      notes: 'Confirmar prazo com o fornecedor.',
    })
  })

  it('chama onClose ao clicar em cancelar', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(<DisparoSolModal {...baseProps()} onClose={onClose} />)
    await user.click(screen.getByRole('button', { name: /cancelar/i }))
    expect(onClose).toHaveBeenCalled()
  })
})
