import { describe, expect, it } from 'vitest'
import { parseImportRows } from './parseImportRows'
import type { ImportColumnMapping } from './types'

const mapping: ImportColumnMapping = {
  unit: 'Obra',
  material: 'Insumo',
  materialCode: '',
  quantity: 'Qtd',
  unitOfMeasure: '',
  neededBy: 'Prazo',
  externalRef: 'SOL',
  status: '',
  openStatusValue: '',
}

const mappingWithCode: ImportColumnMapping = { ...mapping, materialCode: 'Código' }

function lookup(units: Record<string, string>, materialsByName: Record<string, string>) {
  return {
    findUnitId: (name: string) => units[name.trim().toLowerCase()] ?? null,
    findMaterialId: ({ name }: { name: string; code: string }) =>
      materialsByName[name.trim().toLowerCase()] ?? null,
  }
}

describe('parseImportRows', () => {
  it('converte linhas válidas em requisições de um item cada', () => {
    const rows = [
      { Obra: 'UP Graça', Insumo: 'Cimento', Qtd: '10', Prazo: '2026-10-01', SOL: 'SOL-1' },
    ]
    const result = parseImportRows(rows, mapping, lookup({ 'up graça': 'u1' }, { cimento: 'm1' }))

    expect(result.errors).toHaveLength(0)
    expect(result.successes).toEqual([
      {
        unitId: 'u1',
        neededBy: '2026-10-01',
        externalRef: 'SOL-1',
        items: [{ materialId: 'm1', quantity: 10, unitOfMeasure: '' }],
      },
    ])
  })

  it('reporta erro quando a unidade não é encontrada', () => {
    const rows = [{ Obra: 'Obra Inexistente', Insumo: 'Cimento', Qtd: '10' }]
    const result = parseImportRows(rows, mapping, lookup({}, { cimento: 'm1' }))

    expect(result.successes).toHaveLength(0)
    expect(result.errors).toEqual([{ row: 1, reason: 'Unidade não encontrada: "Obra Inexistente".' }])
  })

  it('reporta erro quando o material não é encontrado', () => {
    const rows = [{ Obra: 'UP Graça', Insumo: 'Insumo Inexistente', Qtd: '10' }]
    const result = parseImportRows(rows, mapping, lookup({ 'up graça': 'u1' }, {}))

    expect(result.errors).toEqual([{ row: 1, reason: 'Material não encontrado: "Insumo Inexistente".' }])
  })

  it('reporta erro quando a quantidade é inválida', () => {
    const rows = [{ Obra: 'UP Graça', Insumo: 'Cimento', Qtd: 'abc' }]
    const result = parseImportRows(rows, mapping, lookup({ 'up graça': 'u1' }, { cimento: 'm1' }))

    expect(result.errors).toEqual([{ row: 1, reason: 'Quantidade inválida: "abc".' }])
  })

  it('pula silenciosamente linhas cuja situação não é a de SOL aberta, quando mapeada', () => {
    const mappingComStatus: ImportColumnMapping = { ...mapping, status: 'Sit', openStatusValue: 'AB' }
    const rows = [
      { Obra: 'UP Graça', Insumo: 'Cimento', Qtd: '10', Sit: 'AB' },
      { Obra: 'UP Graça', Insumo: 'Areia', Qtd: '5', Sit: 'CA' },
    ]
    const result = parseImportRows(
      rows,
      mappingComStatus,
      lookup({ 'up graça': 'u1' }, { cimento: 'm1', areia: 'm2' }),
    )

    expect(result.errors).toHaveLength(0)
    expect(result.successes).toHaveLength(1)
    expect(result.successes[0]?.items).toEqual([{ materialId: 'm1', quantity: 10, unitOfMeasure: '' }])
  })

  it('não filtra por situação quando a coluna não está mapeada', () => {
    const rows = [{ Obra: 'UP Graça', Insumo: 'Cimento', Qtd: '10', Sit: 'CA' }]
    const result = parseImportRows(rows, mapping, lookup({ 'up graça': 'u1' }, { cimento: 'm1' }))

    expect(result.successes).toHaveLength(1)
  })

  it('numera os erros pela linha de dados (1-indexada)', () => {
    const rows = [
      { Obra: 'UP Graça', Insumo: 'Cimento', Qtd: '10' },
      { Obra: 'Obra Inexistente', Insumo: 'Cimento', Qtd: '5' },
    ]
    const result = parseImportRows(rows, mapping, lookup({ 'up graça': 'u1' }, { cimento: 'm1' }))

    expect(result.successes).toHaveLength(1)
    expect(result.errors).toEqual([{ row: 2, reason: 'Unidade não encontrada: "Obra Inexistente".' }])
  })

  it('repassa o código do insumo da coluna mapeada para o lookup, quando mapeada', () => {
    const rows = [{ Obra: 'UP Graça', Insumo: 'Cimento', Código: '1023', Qtd: '10' }]
    let receivedArgs: { name: string; code: string } | null = null

    const result = parseImportRows(rows, mappingWithCode, {
      findUnitId: () => 'u1',
      findMaterialId: (args) => {
        receivedArgs = args
        return 'm1'
      },
    })

    expect(receivedArgs).toEqual({ name: 'Cimento', code: '1023' })
    expect(result.successes).toHaveLength(1)
  })

  it('repassa código vazio quando a coluna de código não está mapeada', () => {
    const rows = [{ Obra: 'UP Graça', Insumo: 'Cimento', Qtd: '10' }]
    let receivedArgs: { name: string; code: string } | null = null

    parseImportRows(rows, mapping, {
      findUnitId: () => 'u1',
      findMaterialId: (args) => {
        receivedArgs = args
        return 'm1'
      },
    })

    expect(receivedArgs).toEqual({ name: 'Cimento', code: '' })
  })

  it('agrupa linhas com o mesmo número de SOL (antes da barra) em uma única requisição', () => {
    const rows = [
      { Obra: 'UP Graça', Insumo: 'Cimento', Qtd: '10', SOL: '1140 / 001' },
      { Obra: 'UP Graça', Insumo: 'Areia', Qtd: '5', SOL: '1140 / 002' },
      { Obra: 'UP Graça', Insumo: 'Brita', Qtd: '2', SOL: '1141 / 001' },
    ]
    const result = parseImportRows(
      rows,
      mapping,
      lookup({ 'up graça': 'u1' }, { cimento: 'm1', areia: 'm2', brita: 'm3' }),
    )

    expect(result.errors).toHaveLength(0)
    expect(result.successes).toEqual([
      {
        unitId: 'u1',
        neededBy: '',
        externalRef: '1140',
        items: [
          { materialId: 'm1', quantity: 10, unitOfMeasure: '' },
          { materialId: 'm2', quantity: 5, unitOfMeasure: '' },
        ],
      },
      {
        unitId: 'u1',
        neededBy: '',
        externalRef: '1141',
        items: [{ materialId: 'm3', quantity: 2, unitOfMeasure: '' }],
      },
    ])
  })

  it('mantém uma requisição por linha quando o Nº externo não está mapeado', () => {
    const rows = [
      { Obra: 'UP Graça', Insumo: 'Cimento', Qtd: '10' },
      { Obra: 'UP Graça', Insumo: 'Areia', Qtd: '5' },
    ]
    const mappingSemExternalRef: ImportColumnMapping = { ...mapping, externalRef: '' }
    const result = parseImportRows(
      rows,
      mappingSemExternalRef,
      lookup({ 'up graça': 'u1' }, { cimento: 'm1', areia: 'm2' }),
    )

    expect(result.errors).toHaveLength(0)
    expect(result.successes).toHaveLength(2)
    expect(result.successes.every((r) => r.externalRef === '')).toBe(true)
  })

  it('formata célula de data (lida com cellDates) como YYYY-MM-DD', () => {
    const rows = [{ Obra: 'UP Graça', Insumo: 'Cimento', Qtd: '10', Prazo: new Date(Date.UTC(2027, 11, 31)) }]
    const result = parseImportRows(rows, mapping, lookup({ 'up graça': 'u1' }, { cimento: 'm1' }))

    expect(result.successes[0]?.neededBy).toBe('2027-12-31')
  })

  it('lê a unidade de medida da coluna mapeada, quando mapeada', () => {
    const mappingWithUnit: ImportColumnMapping = { ...mapping, unitOfMeasure: 'Und' }
    const rows = [{ Obra: 'UP Graça', Insumo: 'Cimento', Qtd: '10', Und: 'sc' }]
    const result = parseImportRows(rows, mappingWithUnit, lookup({ 'up graça': 'u1' }, { cimento: 'm1' }))

    expect(result.successes).toEqual([
      {
        unitId: 'u1',
        neededBy: '',
        externalRef: '',
        items: [{ materialId: 'm1', quantity: 10, unitOfMeasure: 'sc' }],
      },
    ])
  })
})
