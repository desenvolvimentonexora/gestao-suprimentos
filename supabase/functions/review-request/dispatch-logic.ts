export interface DispatchRequestItem {
  materialId: string
  materialName: string
  quantity: number
  unitOfMeasure: string | null
}

export interface SupplierEmailOption {
  supplierId: string
  supplierName: string
  email: string
}

export interface SupplierEmailGroup {
  supplierId: string
  supplierName: string
  email: string
  items: DispatchRequestItem[]
}

export type GroupItemsResult =
  | { ok: true; groups: SupplierEmailGroup[] }
  | { ok: false; missingMaterialNames: string[] }

// Sem envio parcial: se qualquer insumo não tiver fornecedor elegível, o
// resultado inteiro é de bloqueio — nenhum grupo é retornado, mesmo que
// outros insumos tivessem fornecedor.
export function groupItemsBySupplier(
  items: DispatchRequestItem[],
  suppliersByMaterialId: Map<string, SupplierEmailOption[]>,
): GroupItemsResult {
  const missingMaterialNames: string[] = []
  const groupsBySupplierId = new Map<string, SupplierEmailGroup>()

  for (const item of items) {
    const suppliers = suppliersByMaterialId.get(item.materialId) ?? []
    if (suppliers.length === 0) {
      missingMaterialNames.push(item.materialName)
      continue
    }
    for (const supplier of suppliers) {
      const existing = groupsBySupplierId.get(supplier.supplierId)
      if (existing) {
        existing.items.push(item)
      } else {
        groupsBySupplierId.set(supplier.supplierId, {
          supplierId: supplier.supplierId,
          supplierName: supplier.supplierName,
          email: supplier.email,
          items: [item],
        })
      }
    }
  }

  if (missingMaterialNames.length > 0) {
    return { ok: false, missingMaterialNames }
  }
  return { ok: true, groups: [...groupsBySupplierId.values()] }
}

export function buildBlockedReason(missingMaterialNames: string[]): string {
  return `Sem fornecedor cadastrado para: ${missingMaterialNames.join(', ')}`
}

export function buildSendFailureReason(failedSupplierName: string, alreadySentSupplierNames: string[]): string {
  if (alreadySentSupplierNames.length === 0) {
    return `Falha ao enviar pra ${failedSupplierName}.`
  }
  return `Falha ao enviar pra ${failedSupplierName}; ${alreadySentSupplierNames.join(', ')} já recebeu e-mail — não reenviar.`
}

export function formatRequestNumber(externalRef: string | null, sequenceNumber: number | null): string {
  if (externalRef) return externalRef
  if (sequenceNumber != null) return `SOL ${sequenceNumber}`
  return '—'
}

export interface DispatchEmailContext {
  requestNumber: string
  unitName: string
  neededBy: string | null
}

export interface DispatchEmail {
  to: string
  subject: string
  body: string
}

function formatNeededBy(neededBy: string | null): string {
  if (!neededBy) return 'a definir'
  return new Intl.DateTimeFormat('pt-BR').format(new Date(`${neededBy}T00:00:00`))
}

export function buildDispatchEmail(group: SupplierEmailGroup, context: DispatchEmailContext): DispatchEmail {
  const subject = `Cotação — ${context.requestNumber}`
  const itemLines = group.items
    .map((item) => `- ${item.materialName}: ${item.quantity} ${item.unitOfMeasure ?? ''}`.trim())
    .join('\n')
  const body = [
    `Olá, ${group.supplierName}.`,
    '',
    `Pedimos uma cotação para os itens abaixo, referente à ${context.requestNumber} (obra ${context.unitName}):`,
    '',
    itemLines,
    '',
    `Prazo de entrega desejado: ${formatNeededBy(context.neededBy)}.`,
    '',
    'Por favor, responda este e-mail com sua cotação (preço, prazo de entrega e condição de pagamento).',
    '',
    'Obrigado,',
    'Nexora',
  ].join('\n')
  return { to: group.email, subject, body }
}
