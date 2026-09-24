import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { DisparoSolModal } from './DisparoSolModal'
import type { MaterialWithSupplierCount, RequestRow } from './types'

const materials: MaterialWithSupplierCount[] = [
  {
    id: 'm1',
    name: 'Argamassa',
    supplierCount: 3,
    code: '1023',
    categoryId: 'c1',
    categoryName: 'Ferramentas',
    supplierIds: ['s1', 's2', 's3'],
  },
  {
    id: 'm2',
    name: 'Tintas',
    supplierCount: 5,
    code: null,
    categoryId: 'c2',
    categoryName: 'EPI',
    supplierIds: ['s1', 's2', 's3', 's4', 's5'],
  },
]

const request: RequestRow = {
  id: 'r1',
  unitId: 'u1',
  unitName: 'UP Graça',
  status: 'open',
  neededBy: null,
  externalRef: 'SOL-42',
  sequenceNumber: 1,
  createdAt: '2026-09-01T00:00:00Z',
  subjectCategory: null,
  notes: null,
  negotiatorId: null,
  negotiatorName: null,
  negotiatingStartedAt: null,
  dispatchBlockedReason: null,
  quotationsCount: 0,
  items: [
    {
      id: 'i1',
      materialId: 'm1',
      materialName: 'Argamassa',
      materialCode: null,
      materialDescription: null,
      quantity: 20,
      unitOfMeasure: 'sc',
      statusCode: null,
      authorizedAt: null,
      pendente: false,
      motivoPendencia: null,
    },
  ],
}

function baseProps() {
  return {
    isOpen: true,
    onClose: vi.fn(),
    request,
    materials,
    onSubmit: vi.fn(),
    isSubmitting: false,
  }
}

describe('DisparoSolModal', () => {
  it('mostra o número amigável da SOL no título, nunca o uuid interno', () => {
    render(<DisparoSolModal {...baseProps()} />)
    expect(screen.getByText('Disparar SOL-42')).toBeInTheDocument()
    expect(screen.queryByText(request.id)).not.toBeInTheDocument()
  })

  it('usa "SOL {sequência}" sem duplicar a palavra SOL quando não há número externo', () => {
    render(<DisparoSolModal {...baseProps()} request={{ ...request, externalRef: null }} />)
    expect(screen.getByText('Disparar SOL 1')).toBeInTheDocument()
  })

  it('mostra o cabeçalho com a contagem de itens', () => {
    render(<DisparoSolModal {...baseProps()} />)
    expect(screen.getByText(/1 item/i)).toBeInTheDocument()
  })

  it('mostra a obra detectada como informação fixa, não editável', () => {
    render(<DisparoSolModal {...baseProps()} />)
    expect(screen.getByText(/obra detectada:/i)).toBeInTheDocument()
    expect(screen.getByText('UP Graça')).toBeInTheDocument()
    expect(screen.queryByLabelText(/obra/i)).not.toBeInTheDocument()
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
  })

  it('marca o campo de insumos como obrigatório e mostra o texto de ajuda', () => {
    render(<DisparoSolModal {...baseProps()} />)
    expect(screen.getByText(/insumos relacionados a esta sol/i)).toBeInTheDocument()
    expect(
      screen.getByText(/selecione os insumos da agenda que correspondem aos itens desta sol/i),
    ).toBeInTheDocument()
  })

  it('agrupa os insumos por categoria, com a contagem de fornecedores da categoria', () => {
    render(<DisparoSolModal {...baseProps()} />)
    expect(screen.getByText('Ferramentas')).toBeInTheDocument()
    expect(screen.getByText('EPI')).toBeInTheDocument()
    expect(screen.getByText('3 fornecedores cadastrados')).toBeInTheDocument()
    expect(screen.getByText('5 fornecedores cadastrados')).toBeInTheDocument()
  })

  it('pré-marca os materiais que já são itens da requisição', () => {
    render(<DisparoSolModal {...baseProps()} />)
    expect(screen.getByRole('checkbox', { name: /argamassa/i })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: /tintas/i })).not.toBeChecked()
  })

  it('mostra a contagem de fornecedores por material', () => {
    render(<DisparoSolModal {...baseProps()} />)
    expect(screen.getByText(/3 fornecedores$/i)).toBeInTheDocument()
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

  it('chama onSubmit com a obra da requisição e os valores preenchidos ao clicar em disparar', async () => {
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
