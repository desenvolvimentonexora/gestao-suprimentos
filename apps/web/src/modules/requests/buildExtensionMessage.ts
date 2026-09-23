export interface PendingItemSummary {
  materialName: string
  motivo: string | null
}

function formatDateOnly(value: string): string {
  return new Intl.DateTimeFormat('pt-BR').format(new Date(`${value}T00:00:00`))
}

export interface ExtensionMessageInput {
  currentNeededBy: string | null
  newNeededBy: string
  reason: string
  pendingItems?: PendingItemSummary[]
}

export function buildExtensionMessage({
  currentNeededBy,
  newNeededBy,
  reason,
  pendingItems = [],
}: ExtensionMessageInput): string {
  const currentText = currentNeededBy ? formatDateOnly(currentNeededBy) : 'não informada'
  const pendingLines =
    pendingItems.length > 0
      ? [
          '',
          'Itens sinalizados que ainda precisam de esclarecimento:',
          ...pendingItems.map((item) => `- ${item.materialName}${item.motivo ? `: ${item.motivo}` : ''}`),
        ]
      : []

  return [
    `Olá! O prazo atual de entrega desta SOL (${currentText}) não é viável.`,
    '',
    `Estamos propondo prorrogar a entrega para ${formatDateOnly(newNeededBy)}.`,
    '',
    `Motivo: ${reason}`,
    ...pendingLines,
    '',
    'Por favor, confirme se essa nova data funciona ou sugira uma alternativa.',
  ].join('\n')
}
