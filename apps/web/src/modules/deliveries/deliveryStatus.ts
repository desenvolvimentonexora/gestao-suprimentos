import type { DeliveryOrderRow, DeliveryStatus } from './types'

// Cores semânticas de status de entrega são fixas no código, iguais em
// todos os tenants — nunca vêm de config.theme (mesmo padrão de
// quotations/deadlineBadge.ts; ver CLAUDE.md §7: cor semântica nunca é
// substituída pela cor de marca).
export const DELIVERY_STATUS_LABELS: Record<DeliveryStatus, string> = {
  atrasado: 'Atrasado',
  hoje: 'Hoje',
  no_prazo: 'No prazo',
  chegou_ar_pendente: 'Chegou · AR pendente',
}

export const DELIVERY_STATUS_BADGE_CLASSES: Record<DeliveryStatus, string> = {
  atrasado: 'border-red-200 bg-red-50 text-red-700',
  hoje: 'border-blue-200 bg-blue-50 text-blue-700',
  no_prazo: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  chegou_ar_pendente: 'border-amber-200 bg-amber-50 text-amber-700',
}

export const DELIVERY_STATUS_DOT_CLASSES: Record<DeliveryStatus, string> = {
  atrasado: 'bg-red-500',
  hoje: 'bg-blue-500',
  no_prazo: 'bg-emerald-500',
  chegou_ar_pendente: 'bg-amber-500',
}

function toDateOnly(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
}

// Pedido some da cobrança quando é cancelado ou quando a entrega já foi
// confirmada por completo (AR recebido) — os 4 status do calendário só
// existem enquanto o pedido está ativo.
export function isActiveDelivery(order: Pick<DeliveryOrderRow, 'apiStatus' | 'deliveryReceiptConfirmedAt'>): boolean {
  return order.apiStatus !== 'cancelled' && !order.deliveryReceiptConfirmedAt
}

export function getDeliveryStatus(
  order: Pick<DeliveryOrderRow, 'expectedDeliveryDate' | 'deliveredAt'>,
  today: Date,
): DeliveryStatus {
  if (order.deliveredAt) return 'chegou_ar_pendente'

  const expected = toDateOnly(new Date(`${order.expectedDeliveryDate}T00:00:00`))
  const todayOnly = toDateOnly(today)

  if (expected < todayOnly) return 'atrasado'
  if (expected === todayOnly) return 'hoje'
  return 'no_prazo'
}
