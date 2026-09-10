import type { ImportColumnMapping, ImportParseResult, RequestFormValues } from './types'

export interface ImportLookup {
  findUnitId: (name: string) => string | null
  findMaterialId: (name: string) => string | null
}

function readCell(row: Record<string, unknown>, column: string): string {
  const value = column ? row[column] : undefined
  return value === undefined || value === null ? '' : String(value).trim()
}

export function parseImportRows(
  rows: Record<string, unknown>[],
  mapping: ImportColumnMapping,
  lookup: ImportLookup,
): ImportParseResult {
  const successes: RequestFormValues[] = []
  const errors: ImportParseResult['errors'] = []

  rows.forEach((row, index) => {
    const rowNumber = index + 1
    const unitName = readCell(row, mapping.unit)
    const materialName = readCell(row, mapping.material)
    const quantityRaw = readCell(row, mapping.quantity)
    const neededBy = readCell(row, mapping.neededBy)
    const externalRef = readCell(row, mapping.externalRef)

    const unitId = lookup.findUnitId(unitName)
    if (!unitId) {
      errors.push({ row: rowNumber, reason: `Unidade não encontrada: "${unitName}".` })
      return
    }

    const materialId = lookup.findMaterialId(materialName)
    if (!materialId) {
      errors.push({ row: rowNumber, reason: `Material não encontrado: "${materialName}".` })
      return
    }

    const quantity = Number(quantityRaw.replace(',', '.'))
    if (!Number.isFinite(quantity) || quantity <= 0) {
      errors.push({ row: rowNumber, reason: `Quantidade inválida: "${quantityRaw}".` })
      return
    }

    successes.push({
      unitId,
      neededBy,
      externalRef,
      items: [{ materialId, quantity, unitOfMeasure: '' }],
    })
  })

  return { successes, errors }
}
