export interface PendingItemSummary {
  materialName: string
  motivo: string | null
}

export function buildClarificationMessage(items: PendingItemSummary[]): string {
  const lines = items.map((item) => `- ${item.materialName}${item.motivo ? `: ${item.motivo}` : ''}`)
  return [
    'Olá! Para seguir com esta SOL, precisamos que você esclareça os itens abaixo:',
    '',
    ...lines,
    '',
    'Assim que recebermos a informação, seguimos para cotação.',
  ].join('\n')
}
