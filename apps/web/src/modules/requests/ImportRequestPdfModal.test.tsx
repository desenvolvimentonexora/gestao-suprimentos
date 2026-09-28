import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ImportRequestPdfModal } from './ImportRequestPdfModal'
import type { MaterialOption, UnitOption } from './types'

const units: UnitOption[] = [{ id: 'unit-1', name: 'Up Grauça' }]
const materials: MaterialOption[] = [
  { id: 'mat-1', materialName: 'Abraçadeira', code: 'AB-001', description: null },
  { id: 'mat-2', materialName: 'Cimento', code: null, description: 'Cimento CP-32 saco 50kg' },
  { id: 'mat-3a', materialName: 'Abraçadeira Tipo U', code: '027818-005', description: 'ABRAÇADEIRA "U" 5" X 150 MM' },
  { id: 'mat-3b', materialName: 'Abraçadeira Tipo U', code: '027818-006', description: 'ABRAÇADEIRA "U" 6" X 200 MM' },
]

const extractMutateAsync = vi.fn()

vi.mock('./queries', () => ({
  useUnitOptions: () => ({ data: units }),
  useMaterialOptions: () => ({ data: materials }),
  useExtractRequestPdf: () => ({ mutateAsync: extractMutateAsync, isPending: false }),
}))

function makeFile(): File {
  return new File(['%PDF-1.4'], 'SOL_1026.pdf', { type: 'application/pdf' })
}

describe('ImportRequestPdfModal', () => {
  it('monta os valores do formulário casando obra por nome e item por código', async () => {
    const user = userEvent.setup()
    const onImported = vi.fn()
    extractMutateAsync.mockResolvedValue({
      requestNumber: '1026',
      unitNameGuess: 'Up Grauça',
      neededBy: '2026-08-12',
      notes: 'Observação teste',
      items: [{ code: 'AB-001', description: 'Abraçadeira qualquer', quantity: 90, unitOfMeasure: 'UN' }],
    })

    render(<ImportRequestPdfModal isOpen onClose={vi.fn()} onImported={onImported} />)

    const file = makeFile()
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    await user.upload(input, file)

    await waitFor(() => expect(onImported).toHaveBeenCalled())
    const [values, passedFile] = onImported.mock.calls[0]!
    expect(values).toEqual({
      unitId: 'unit-1',
      neededBy: '2026-08-12',
      externalRef: '1026',
      items: [{ materialId: 'mat-1', quantity: 90, unitOfMeasure: 'UN' }],
    })
    expect(passedFile).toBe(file)
  })

  it('casa o item pela descrição da variante quando não há código extraído', async () => {
    const user = userEvent.setup()
    const onImported = vi.fn()
    extractMutateAsync.mockResolvedValue({
      requestNumber: null,
      unitNameGuess: null,
      neededBy: null,
      notes: null,
      items: [{ code: null, description: 'Cimento CP-32 saco 50kg', quantity: 10, unitOfMeasure: 'sc' }],
    })

    render(<ImportRequestPdfModal isOpen onClose={vi.fn()} onImported={onImported} />)
    await user.upload(document.querySelector('input[type="file"]') as HTMLInputElement, makeFile())

    await waitFor(() => expect(onImported).toHaveBeenCalled())
    const [values] = onImported.mock.calls[0]!
    expect(values.items[0].materialId).toBe('mat-2')
    expect(values.unitId).toBe('')
  })

  it('deixa materialId em branco quando não casa nem por código nem por descrição', async () => {
    const user = userEvent.setup()
    const onImported = vi.fn()
    extractMutateAsync.mockResolvedValue({
      requestNumber: null,
      unitNameGuess: null,
      neededBy: null,
      notes: null,
      items: [{ code: 'XYZ', description: 'Insumo desconhecido', quantity: 1, unitOfMeasure: null }],
    })

    render(<ImportRequestPdfModal isOpen onClose={vi.fn()} onImported={onImported} />)
    await user.upload(document.querySelector('input[type="file"]') as HTMLInputElement, makeFile())

    await waitFor(() => expect(onImported).toHaveBeenCalled())
    const [values] = onImported.mock.calls[0]!
    expect(values.items[0].materialId).toBe('')
  })

  it('casa pela descrição quando o código extraído vem cortado (caso real da SOL) e não é suficiente pra identificar a variante sozinho', async () => {
    const user = userEvent.setup()
    const onImported = vi.fn()
    // Caso real: o PDF da SOL mostra só "027818-" pros dois itens (o sufixo
    // -005/-006 só aparece no Pedido de Compra final) — a IA não tem como
    // adivinhar qual variante é, então o código extraído fica truncado.
    extractMutateAsync.mockResolvedValue({
      requestNumber: null,
      unitNameGuess: null,
      neededBy: null,
      notes: null,
      items: [{ code: '027818-', description: 'ABRAÇADEIRA "U" 5" X 150 MM', quantity: 90, unitOfMeasure: 'UN' }],
    })

    render(<ImportRequestPdfModal isOpen onClose={vi.fn()} onImported={onImported} />)
    await user.upload(document.querySelector('input[type="file"]') as HTMLInputElement, makeFile())

    await waitFor(() => expect(onImported).toHaveBeenCalled())
    const [values] = onImported.mock.calls[0]!
    // O código truncado "027818-" não bate com nenhum código completo — mas
    // a descrição bate exatamente com a variante de 5", então casa por ela.
    expect(values.items[0].materialId).toBe('mat-3a')
  })

  it('mostra mensagem de erro clara quando a extração falha, sem fechar o modal', async () => {
    const user = userEvent.setup()
    extractMutateAsync.mockRejectedValue(new Error('PDF ilegível.'))

    render(<ImportRequestPdfModal isOpen onClose={vi.fn()} onImported={vi.fn()} />)
    await user.upload(document.querySelector('input[type="file"]') as HTMLInputElement, makeFile())

    expect(await screen.findByText('PDF ilegível.')).toBeInTheDocument()
  })
})
