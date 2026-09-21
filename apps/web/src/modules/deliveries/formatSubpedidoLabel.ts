export function formatSubpedidoLabel(orderNumber: string, index: number): string {
  return `${orderNumber}/${String(index + 1).padStart(3, '0')}`
}
