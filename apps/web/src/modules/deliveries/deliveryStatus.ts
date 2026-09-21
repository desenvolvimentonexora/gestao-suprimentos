import type { DeliveryOrderRow, DeliveryStatus } from './types'

// Cores semânticas de status de entrega vêm de config.theme.status (via
// tailwind.config.ts + CSS variables, mesmo mecanismo da cor de marca —
// ver core/theme/applyTheme.ts). Nunca são substituídas pela cor de marca
// (CLAUDE.md §7), mas continuam configuráveis por tenant (regra 4.1: nada
// de cor fixa no código) — daqui só saem nomes de classe Tailwind, nunca
// um valor de cor literal.
export const DELIVERY_STATUS_LABELS: Record<DeliveryStatus, string> = {
  atrasado: 'Atrasado',
  hoje: 'Hoje',
  no_prazo: 'No prazo',
  chegou_ar_pendente: 'Chegou · AR pendente',
}

export const DELIVERY_STATUS_BADGE_CLASSES: Record<DeliveryStatus, string> = {
  atrasado: 'border-status-atrasado/30 bg-status-atrasado/10 text-status-atrasado',
  hoje: 'border-status-hoje/30 bg-status-hoje/10 text-status-hoje',
  no_prazo: 'border-status-no-prazo/30 bg-status-no-prazo/10 text-status-no-prazo',
  chegou_ar_pendente: 'border-status-chegou-ar-pendente/30 bg-status-chegou-ar-pendente/10 text-status-chegou-ar-pendente',
}

export const DELIVERY_STATUS_DOT_CLASSES: Record<DeliveryStatus, string> = {
  atrasado: 'bg-status-atrasado',
  hoje: 'bg-status-hoje',
  no_prazo: 'bg-status-no-prazo',
  chegou_ar_pendente: 'bg-status-chegou-ar-pendente',
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
