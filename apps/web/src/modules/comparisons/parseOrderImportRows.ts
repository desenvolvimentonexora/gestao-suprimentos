import type { OrderImportColumnMapping, OrderImportGroup, OrderImportParseResult } from './types'

export interface OrderImportLookup {
  findComparisonByExternalRef: (
    externalRef: string,
  ) => { comparisonId: string; requestId: string; unitId: string; hasOrder: boolean } | null
  findUnitId: (name: string) => string | null
  findSupplierId: (name: string) => string | null
  findMaterialId: (args: { name: string; code: string }) => string | null
  findRequestItemId: (args: { requestId: string; materialId: string | null }) => string | null
}

function readCell(row: Record<string, unknown>, column: string): string {
  const value = column ? row[column] : undefined
  return value === undefined || value === null ? '' : String(value).trim()
}

// Com `cellDates: true` na leitura do Excel, uma célula de data vira um
// objeto Date (não texto) — sem isso, a data seria lida como o número de
// série do Excel e rejeitada pela coluna `date` no banco.
function readDateCell(row: Record<string, unknown>, column: string): string {
  const value = column ? row[column] : undefined
  if (value instanceof Date) return value.toISOString().slice(0, 10)
  return value === undefined || value === null ? '' : String(value).trim()
}

// O ERP repete o número do pedido em cada linha de item dele (ex.: "368 /
// 001", "368 / 008") — o trecho antes da barra identifica o pedido; o resto
// é só a sequência do item dentro dele.
function extractOrderKey(orderNumber: string): string {
  return (orderNumber.split('/')[0] ?? '').trim()
}

export function parseOrderImportRows(
  rows: Record<string, unknown>[],
  mapping: OrderImportColumnMapping,
  lookup: OrderImportLookup,
): OrderImportParseResult {
  const errors: OrderImportParseResult['errors'] = []
  const groups = new Map<string, OrderImportGroup>()
  const groupOrder: string[] = []

  rows.forEach((row, index) => {
    const rowNumber = index + 1
    const externalRefRaw = readCell(row, mapping.externalRef)
    const orderNumberRaw = readCell(row, mapping.orderNumber)
    const unitName = readCell(row, mapping.unit)
    const supplierName = readCell(row, mapping.supplier)
    const materialName = readCell(row, mapping.material)
    const materialCode = readCell(row, mapping.materialCode)
    const quantityRaw = readCell(row, mapping.quantity)
    const unitPriceRaw = readCell(row, mapping.unitPrice)
    const expectedDeliveryDate = readDateCell(row, mapping.expectedDeliveryDate)

    if (!orderNumberRaw) {
      errors.push({ row: rowNumber, reason: 'Número do pedido não informado.' })
      return
    }

    // Quando a SOL bate com uma comparação já liberada no app, o pedido fica
    // amarrado a ela (fluxo normal: equalizou aqui, depois importa o pedido
    // real do ERP pra anexar nº/preço/prazo reais). Quando não bate — SOL não
    // mapeada, ou mapeada mas não encontrada entre as liberadas — o pedido
    // vira um registro avulso, sem requisição/comparação por trás: é o caso
    // de pedidos históricos que nunca passaram pela Equalização deste app.
    const comparison = externalRefRaw ? lookup.findComparisonByExternalRef(externalRefRaw) : null
    const isStandalone = !comparison

    if (comparison?.hasOrder) {
      errors.push({ row: rowNumber, reason: `Pedido já importado para a SOL "${externalRefRaw}".` })
      return
    }

    const unitId = isStandalone ? lookup.findUnitId(unitName) : comparison.unitId
    if (!unitId) {
      errors.push({ row: rowNumber, reason: `Unidade não encontrada: "${unitName}".` })
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
    const requestItemId = isStandalone
      ? null
      : lookup.findRequestItemId({ requestId: comparison.requestId, materialId })

    const orderKey = extractOrderKey(orderNumberRaw)
    const groupKey = isStandalone ? `standalone:${orderKey}` : `comparison:${comparison.comparisonId}`

    const existingGroup = groups.get(groupKey)
    const group: OrderImportGroup =
      existingGroup ??
      {
        comparisonId: isStandalone ? null : comparison.comparisonId,
        requestId: isStandalone ? null : comparison.requestId,
        unitId,
        orderNumber: orderKey,
        expectedDeliveryDate: expectedDeliveryDate || null,
        items: [],
      }
    group.items.push({
      supplierId,
      materialId,
      materialNameRaw: materialName || materialCode,
      requestItemId,
      quantity,
      unitPrice,
    })
    if (!existingGroup) groupOrder.push(groupKey)
    groups.set(groupKey, group)
  })

  return { successes: groupOrder.map((key) => groups.get(key) as OrderImportGroup), errors }
}
