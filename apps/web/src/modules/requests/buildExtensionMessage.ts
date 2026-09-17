function formatDateOnly(value: string): string {
  return new Intl.DateTimeFormat('pt-BR').format(new Date(`${value}T00:00:00`))
}

export interface ExtensionMessageInput {
  currentNeededBy: string | null
  newNeededBy: string
  reason: string
}

export function buildExtensionMessage({ currentNeededBy, newNeededBy, reason }: ExtensionMessageInput): string {
  const currentText = currentNeededBy ? formatDateOnly(currentNeededBy) : 'não informada'
  return [
    `Olá! O prazo atual de entrega desta SOL (${currentText}) não é viável.`,
    '',
    `Estamos propondo prorrogar a entrega para ${formatDateOnly(newNeededBy)}.`,
    '',
    `Motivo: ${reason}`,
    '',
    'Por favor, confirme se essa nova data funciona ou sugira uma alternativa.',
  ].join('\n')
}
