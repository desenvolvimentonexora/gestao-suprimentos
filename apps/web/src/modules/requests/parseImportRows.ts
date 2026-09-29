import type { ImportColumnMapping, ImportParseResult, RequestFormValues } from './types'

export interface ImportLookup {
  findUnitId: (name: string) => string | null
  findMaterialId: (args: { name: string; code: string }) => string | null
}

function readCell(row: Record<string, unknown>, column: string): string {
  const value = column ? row[column] : undefined
  return value === undefined || value === null ? '' : String(value).trim()
}

// Com `cellDates: true` na leitura do Excel, uma célula de data vira um
// objeto Date (não texto) — sem isso, o prazo seria lido como o número de
// série do Excel (ex.: "46273") e rejeitado pela coluna `date` no banco.
function readDateCell(row: Record<string, unknown>, column: string): string {
  const value = column ? row[column] : undefined
  if (value instanceof Date) return value.toISOString().slice(0, 10)
  return value === undefined || value === null ? '' : String(value).trim()
}

// Um export de ERP repete o número da solicitação em cada linha de item dela
// (ex.: "1140 / 001", "1140 / 002"...) — o trecho antes da barra identifica a
// requisição; o resto é só a sequência do item dentro dela. Linhas com o
// mesmo número viram uma única requisição com vários itens.
function extractRequestKey(externalRef: string): string {
  return (externalRef.split('/')[0] ?? '').trim()
}

export function parseImportRows(
  rows: Record<string, unknown>[],
  mapping: ImportColumnMapping,
  lookup: ImportLookup,
): ImportParseResult {
  const groups = new Map<string, RequestFormValues>()
  const groupOrder: string[] = []
  const errors: ImportParseResult['errors'] = []

  rows.forEach((row, index) => {
    const rowNumber = index + 1

    // Situação da SOL no ERP de origem (ex.: "Sit" = "AB" para aberta). Só
    // filtra quando as duas colunas estão mapeadas — sem valor de referência
    // não dá pra saber o que conta como aberta, então nada é descartado.
    if (mapping.status && mapping.openStatusValue) {
      const statusValue = readCell(row, mapping.status)
      if (statusValue.toLowerCase() !== mapping.openStatusValue.trim().toLowerCase()) return
    }

    const unitName = readCell(row, mapping.unit)
    const materialName = readCell(row, mapping.material)
    const materialCode = readCell(row, mapping.materialCode)
    const quantityRaw = readCell(row, mapping.quantity)
    const neededBy = readDateCell(row, mapping.neededBy)
    const externalRefRaw = readCell(row, mapping.externalRef)
    const unitOfMeasure = readCell(row, mapping.unitOfMeasure)

    const unitId = lookup.findUnitId(unitName)
    if (!unitId) {
      errors.push({ row: rowNumber, reason: `Unidade não encontrada: "${unitName}".` })
      return
    }

    const materialId = lookup.findMaterialId({ name: materialName, code: materialCode })
    if (!materialId) {
      errors.push({ row: rowNumber, reason: `Material não encontrado: "${materialName}".` })
      return
    }

    const quantity = Number(quantityRaw.replace(',', '.'))
    if (!Number.isFinite(quantity) || quantity <= 0) {
      errors.push({ row: rowNumber, reason: `Quantidade inválida: "${quantityRaw}".` })
      return
    }

    // Sem Nº externo mapeado, cada linha continua virando sua própria
    // requisição — não há como saber que linhas pertencem à mesma SOL.
    const requestKey = externalRefRaw ? extractRequestKey(externalRefRaw) : `__linha-${rowNumber}`
    const externalRef = externalRefRaw ? requestKey : ''

    const existing = groups.get(requestKey)
    if (existing) {
      existing.items.push({ materialId, quantity, unitOfMeasure })
      return
    }

    groups.set(requestKey, {
      unitId,
      neededBy,
      externalRef,
      items: [{ materialId, quantity, unitOfMeasure }],
    })
    groupOrder.push(requestKey)
  })

  const successes = groupOrder.map((key) => groups.get(key) as RequestFormValues)

  return { successes, errors }
}
