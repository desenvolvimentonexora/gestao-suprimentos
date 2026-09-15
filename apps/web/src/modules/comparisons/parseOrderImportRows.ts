import type { OrderImportColumnMapping, OrderImportGroup, OrderImportParseResult } from './types'

export interface OrderImportLookup {
  findComparisonByExternalRef: (
    externalRef: string,
  ) => { comparisonId: string; requestId: string; unitId: string; hasOrder: boolean } | null
  findSupplierId: (name: string) => string | null
  findMaterialId: (args: { name: string; code: string }) => string | null
  findRequestItemId: (args: { requestId: string; materialId: string | null }) => string | null
}

function readCell(row: Record<string, unknown>, column: string): string {
  const value = column ? row[column] : undefined
  return value === undefined || value === null ? '' : String(value).trim()
}

export function parseOrderImportRows(
  rows: Record<string, unknown>[],
  mapping: OrderImportColumnMapping,
  lookup: OrderImportLookup,
): OrderImportParseResult {
  const errors: OrderImportParseResult['errors'] = []
  const groupsByComparisonId = new Map<string, OrderImportGroup>()

  rows.forEach((row, index) => {
    const rowNumber = index + 1
    const externalRef = readCell(row, mapping.externalRef)
    const orderNumber = readCell(row, mapping.orderNumber)
    const supplierName = readCell(row, mapping.supplier)
    const materialName = readCell(row, mapping.material)
    const materialCode = readCell(row, mapping.materialCode)
    const quantityRaw = readCell(row, mapping.quantity)
    const unitPriceRaw = readCell(row, mapping.unitPrice)
    const expectedDeliveryDate = readCell(row, mapping.expectedDeliveryDate)

    const comparison = lookup.findComparisonByExternalRef(externalRef)
    if (!comparison) {
      errors.push({ row: rowNumber, reason: `SOL não encontrada entre as comparações liberadas: "${externalRef}".` })
      return
    }
    if (comparison.hasOrder) {
      errors.push({ row: rowNumber, reason: `Pedido já importado para a SOL "${externalRef}".` })
      return
    }

    if (!orderNumber) {
      errors.push({ row: rowNumber, reason: 'Número do pedido não informado.' })
      return
    }

    const supplierId = lookup.findSupplierId(supplierName)
    if (!supplierId) {
      errors.push({ row: rowNumber, reason: `Fornecedor não encontrado: "${supplierName}".` })
      return
    }

    const quantity = Number(quantityRaw.replace(',', '.'))
    if (!Number.isFinite(quantity) || quantity <= 0) {
      errors.push({ row: rowNumber, reason: `Quantidade inválida: "${quantityRaw}".` })
      return
    }

    const unitPrice = Number(unitPriceRaw.replace(',', '.'))
    if (!Number.isFinite(unitPrice) || unitPrice < 0) {
      errors.push({ row: rowNumber, reason: `Preço unitário inválido: "${unitPriceRaw}".` })
      return
    }

    const materialId = lookup.findMaterialId({ name: materialName, code: materialCode })
    const requestItemId = lookup.findRequestItemId({ requestId: comparison.requestId, materialId })

    const existingGroup = groupsByComparisonId.get(comparison.comparisonId)
    const group: OrderImportGroup =
      existingGroup ??
      {
        comparisonId: comparison.comparisonId,
        requestId: comparison.requestId,
        unitId: comparison.unitId,
        orderNumber,
        expectedDeliveryDate: expectedDeliveryDate || null,
        items: [],
      }
    group.items.push({
      supplierId,
      materialId,
      materialNameRaw: materialName,
      requestItemId,
      quantity,
      unitPrice,
    })
    groupsByComparisonId.set(comparison.comparisonId, group)
  })

  return { successes: Array.from(groupsByComparisonId.values()), errors }
}
