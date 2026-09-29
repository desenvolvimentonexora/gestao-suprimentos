import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { NegotiatingRequestCard } from './NegotiatingRequestCard'
import type { NegotiatingRequestRow, NegotiatorOption } from './types'

const negotiators: NegotiatorOption[] = [
  { id: 'n1', name: 'Lucas' },
  { id: 'n2', name: 'Tais' },
]

const request: NegotiatingRequestRow = {
  id: 'r1',
  unitId: 'u1',
  unitName: 'UP Graça',
  neededBy: '2026-09-01',
  neededByChanged: false,
  externalRef: 'SOL-1',
  sequenceNumber: 647,
  createdAt: '2026-08-20T00:00:00Z',
  notes: null,
  negotiatorId: 'n1',
  negotiatorName: 'Lucas',
  negotiatingStartedAt: '2026-09-05T00:00:00Z',
  items: [
    {
      id: 'i1',
      materialName: 'Cimento CP-II',
      materialCode: '1023',
      materialDescription: 'Cimento CP-II 50kg saco',
      quantity: 10,
      unitOfMeasure: 'sc',
      statusCode: 'OK',
      authorizedAt: '2026-08-21',
    },
    {
      id: 'i2',
      materialName: 'Areia',
      materialCode: null,
      materialDescription: null,
      quantity: 5,
      unitOfMeasure: 'm³',
      statusCode: null,
      authorizedAt: null,
    },
  ],
  quotations: [
    { id: 'q1', supplierId: 's1', supplierName: 'Fornecedor Alfa', status: 'received', submittedAt: null },
  ],
}

function baseProps() {
  return {
    request,
    negotiators,
    today: new Date('2026-09-11T12:00:00'),
    onAssignNegotiator: vi.fn(),
    onUpdateNotes: vi.fn(),
    onSendBackToDispatch: vi.fn(),
    onFinalizeNegotiation: vi.fn(),
    onOpenAttachments: vi.fn(),
  }
}

async function expandCard(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByText('SOL-1'))
}

describe('NegotiatingRequestCard', () => {
  it('mostra unidade, n° externo e a contagem de itens da requisição', () => {
    render(<NegotiatingRequestCard {...baseProps()} />)
    expect(screen.getByText('UP Graça')).toBeInTheDocument()
    expect(screen.getByText('SOL-1')).toBeInTheDocument()
    expect(screen.getByText('2 itens')).toBeInTheDocument()
  })

  it('nunca exibe o uuid da requisição — usa "SOL {sequência}" quando não há número externo', () => {
    render(<NegotiatingRequestCard {...baseProps()} request={{ ...request, externalRef: null }} />)
    expect(screen.getByText('SOL 647')).toBeInTheDocument()
    expect(screen.queryByText('r1')).not.toBeInTheDocument()
  })

  it('mostra o ícone de favorito (decorativo)', () => {
    render(<NegotiatingRequestCard {...baseProps()} />)
    expect(screen.getByLabelText('Favorito')).toBeInTheDocument()
  })

  it('chama onOpenAttachments ao clicar no ícone de pasta, sem expandir o card', async () => {
    const user = userEvent.setup()
    const onOpenAttachments = vi.fn()
    render(<NegotiatingRequestCard {...baseProps()} onOpenAttachments={onOpenAttachments} />)

    await user.click(screen.getByRole('button', { name: /ver arquivos de sol-1/i }))

    expect(onOpenAttachments).toHaveBeenCalledWith('r1')
    expect(screen.queryByLabelText(/observação/i)).not.toBeInTheDocument()
  })

  it('mostra os itens detalhados ao clicar no card', async () => {
    const user = userEvent.setup()
    render(<NegotiatingRequestCard {...baseProps()} />)
    await expandCard(user)
    expect(screen.getByText('1023')).toBeInTheDocument()
  })

  it('mostra o negociador atribuído e permite reatribuir', async () => {
    const user = userEvent.setup()
    const onAssignNegotiator = vi.fn()
    render(<NegotiatingRequestCard {...baseProps()} onAssignNegotiator={onAssignNegotiator} />)

    const select = screen.getByLabelText(/negociador/i)
    expect(select).toHaveValue('n1')
    await user.selectOptions(select, 'n2')
    expect(onAssignNegotiator).toHaveBeenCalledWith('r1', 'n2')
  })

  it('mostra o badge "Só falta equalizar" em estilo contorno, com ícone, quando há 3 cotações recebidas', () => {
    const threeQuotations: NegotiatingRequestRow['quotations'] = [
      { id: 'q1', supplierId: 's1', supplierName: 'Fornecedor Alfa', status: 'received', submittedAt: null },
      { id: 'q2', supplierId: 's2', supplierName: 'Fornecedor Beta', status: 'received', submittedAt: null },
      { id: 'q3', supplierId: 's3', supplierName: 'Fornecedor Gama', status: 'received', submittedAt: null },
    ]
    render(<NegotiatingRequestCard {...baseProps()} request={{ ...request, quotations: threeQuotations }} />)
    const badge = screen.getByText('Só falta equalizar')
    expect(badge.closest('span')?.querySelector('svg')).toBeInTheDocument()
    expect(badge.closest('span')?.className).not.toContain('bg-amber')
  })

  it('mostra "1/3 cotações recebidas" em vez de "Só falta equalizar" quando ainda não chegou a 3', () => {
    render(<NegotiatingRequestCard {...baseProps()} />)
    expect(screen.getByText('1/3 cotações recebidas')).toBeInTheDocument()
    expect(screen.queryByText('Só falta equalizar')).not.toBeInTheDocument()
  })

  it('mostra o badge de dias em negociação preenchido em âmbar, com ícone', () => {
    render(<NegotiatingRequestCard {...baseProps()} />)
    const badge = screen.getByText(/em negociação há 6 dias/i)
    expect(badge.closest('span')?.querySelector('svg')).toBeInTheDocument()
    expect(badge.closest('span')?.className).toContain('amber')
  })

  it('mostra a data de entrega no cabeçalho do card', () => {
    render(<NegotiatingRequestCard {...baseProps()} />)
    expect(screen.getByText(/entrega 01\/09\/2026/i)).toBeInTheDocument()
  })

  it('mostra o badge "N dias atrasada" (vermelho) quando o prazo já passou', () => {
    render(<NegotiatingRequestCard {...baseProps()} />)
    // today 2026-09-11, neededBy 2026-09-01 → 10 dias
    const badge = screen.getByText('10 dias atrasada')
    expect(badge.closest('span')?.className).toContain('red')
  })

  it('mostra o badge "N dias restantes" (âmbar claro) quando o prazo ainda não venceu', () => {
    render(<NegotiatingRequestCard {...baseProps()} request={{ ...request, neededBy: '2026-09-20' }} />)
    expect(screen.getByText('9 dias restantes')).toBeInTheDocument()
  })

  it('marca a borda lateral em vermelho quando o badge de prazo é de atraso', () => {
    render(<NegotiatingRequestCard {...baseProps()} />)
    expect(screen.getByTestId('negotiating-card-r1').className).toContain('border-l-red')
  })

  it('marca a borda lateral em âmbar quando o prazo ainda não venceu', () => {
    render(<NegotiatingRequestCard {...baseProps()} request={{ ...request, neededBy: '2026-09-20' }} />)
    expect(screen.getByTestId('negotiating-card-r1').className).toContain('border-l-amber')
    expect(screen.queryByText(/atrasada/i)).not.toBeInTheDocument()
  })

  it('mostra a tag "data alterada" quando needed_by_changed é true', () => {
    render(<NegotiatingRequestCard {...baseProps()} request={{ ...request, neededByChanged: true }} />)
    expect(screen.getByText(/data alterada/i)).toBeInTheDocument()
  })

  it('não mostra a tag "data alterada" quando needed_by_changed é false', () => {
    render(<NegotiatingRequestCard {...baseProps()} />)
    expect(screen.queryByText(/data alterada/i)).not.toBeInTheDocument()
  })

  it('estiliza o seletor de negociador com a cor do negociador atribuído', () => {
    render(<NegotiatingRequestCard {...baseProps()} />)
    const select = screen.getByLabelText(/negociador/i)
    expect(select.className).not.toBe('')
  })

  it('expande e mostra observação, tabela de itens e ações ao clicar no card', async () => {
    const user = userEvent.setup()
    render(<NegotiatingRequestCard {...baseProps()} />)

    expect(screen.queryByRole('button', { name: /voltar pro disparo/i })).not.toBeInTheDocument()
    await expandCard(user)

    expect(screen.getByLabelText(/observação/i)).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Insumo-Sub' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /voltar pro disparo/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /finalizar negociação/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /liberar sem equalizar/i })).toBeInTheDocument()
  })

  describe('tabela de itens da requisição (10 colunas)', () => {
    it('tem as dez colunas esperadas', async () => {
      const user = userEvent.setup()
      render(<NegotiatingRequestCard {...baseProps()} />)
      await expandCard(user)

      for (const column of [
        'Centro',
        'Insumo-Sub',
        'Sit',
        'Especificação',
        'Unid',
        'Qtd',
        'Solicitação',
        'Entrega SOL',
        'Data Solic.',
        'Data Aut.',
        'Dias',
      ]) {
        expect(screen.getByRole('columnheader', { name: column })).toBeInTheDocument()
      }
    })

    it('mostra o código do material na coluna Insumo-Sub, com o nome como reserva sem código', async () => {
      const user = userEvent.setup()
      render(<NegotiatingRequestCard {...baseProps()} />)
      await expandCard(user)

      expect(screen.getByText('1023')).toBeInTheDocument()
      expect(screen.getByText('Areia')).toBeInTheDocument()
    })

    it('mostra a descrição do material na coluna Especificação, ou "—" quando não há', async () => {
      const user = userEvent.setup()
      render(<NegotiatingRequestCard {...baseProps()} />)
      await expandCard(user)

      expect(screen.getByText('Cimento CP-II 50kg saco')).toBeInTheDocument()
      const areiaRow = screen.getByText('Areia').closest('tr')
      expect(areiaRow?.textContent).toContain('—')
    })

    it('mostra a referência formatada de cada item, usando o número de exibição da SOL', async () => {
      const user = userEvent.setup()
      render(<NegotiatingRequestCard {...baseProps()} />)
      await expandCard(user)

      expect(screen.getByText('SOL-1/001')).toBeInTheDocument()
      expect(screen.getByText('SOL-1/002')).toBeInTheDocument()
    })
  })

  it('recolhe ao clicar novamente no card', async () => {
    const user = userEvent.setup()
    render(<NegotiatingRequestCard {...baseProps()} />)

    await expandCard(user)
    expect(screen.getByLabelText(/observação/i)).toBeInTheDocument()

    await expandCard(user)
    expect(screen.queryByLabelText(/observação/i)).not.toBeInTheDocument()
  })

  it('chama onSendBackToDispatch ao clicar em voltar pro disparo', async () => {
    const user = userEvent.setup()
    const onSendBackToDispatch = vi.fn()
    render(<NegotiatingRequestCard {...baseProps()} onSendBackToDispatch={onSendBackToDispatch} />)
    await expandCard(user)
    await user.click(screen.getByRole('button', { name: /voltar pro disparo/i }))
    expect(onSendBackToDispatch).toHaveBeenCalledWith('r1')
  })

  it('mostra "Voltar pro Disparo" em contorno e "Finalizar negociação" preenchido', async () => {
    const user = userEvent.setup()
    render(<NegotiatingRequestCard {...baseProps()} />)
    await expandCard(user)

    const back = screen.getByRole('button', { name: /voltar pro disparo/i })
    const finalize = screen.getByRole('button', { name: /finalizar negociação/i })
    expect(back.className).not.toBe(finalize.className)
  })

  it('mostra "Liberar sem equalizar" preenchido com cor de destaque, distinto de "Voltar pro Disparo"', async () => {
    const user = userEvent.setup()
    render(<NegotiatingRequestCard {...baseProps()} />)
    await expandCard(user)

    const back = screen.getByRole('button', { name: /voltar pro disparo/i })
    const release = screen.getByRole('button', { name: /liberar sem equalizar/i })
    expect(release.className).toContain('bg-accent')
    expect(release.className).not.toBe(back.className)
  })

  it('chama onFinalizeNegotiation ao clicar em finalizar negociação', async () => {
    const user = userEvent.setup()
    const onFinalizeNegotiation = vi.fn()
    render(<NegotiatingRequestCard {...baseProps()} onFinalizeNegotiation={onFinalizeNegotiation} />)
    await expandCard(user)
    await user.click(screen.getByRole('button', { name: /finalizar negociação/i }))
    expect(onFinalizeNegotiation).toHaveBeenCalledWith('r1')
  })

  it('mostra "Em breve" ao clicar em liberar sem equalizar', async () => {
    const user = userEvent.setup()
    render(<NegotiatingRequestCard {...baseProps()} />)
    await expandCard(user)
    await user.click(screen.getByRole('button', { name: /liberar sem equalizar/i }))
    expect(screen.getByText('Em breve')).toBeInTheDocument()
  })

})
