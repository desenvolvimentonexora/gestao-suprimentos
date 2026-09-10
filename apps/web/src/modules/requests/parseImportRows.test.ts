import { describe, expect, it } from 'vitest'
import { parseImportRows } from './parseImportRows'
import type { ImportColumnMapping } from './types'

const mapping: ImportColumnMapping = {
  unit: 'Obra',
  material: 'Insumo',
  quantity: 'Qtd',
  neededBy: 'Prazo',
  externalRef: 'SOL',
}

function lookup(units: Record<string, string>, materials: Record<string, string>) {
  return {
    findUnitId: (name: string) => units[name.trim().toLowerCase()] ?? null,
    findMaterialId: (name: string) => materials[name.trim().toLowerCase()] ?? null,
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

  it('numera os erros pela linha de dados (1-indexada)', () => {
    const rows = [
      { Obra: 'UP Graça', Insumo: 'Cimento', Qtd: '10' },
      { Obra: 'Obra Inexistente', Insumo: 'Cimento', Qtd: '5' },
    ]
    const result = parseImportRows(rows, mapping, lookup({ 'up graça': 'u1' }, { cimento: 'm1' }))

    expect(result.successes).toHaveLength(1)
    expect(result.errors).toEqual([{ row: 2, reason: 'Unidade não encontrada: "Obra Inexistente".' }])
  })
})
