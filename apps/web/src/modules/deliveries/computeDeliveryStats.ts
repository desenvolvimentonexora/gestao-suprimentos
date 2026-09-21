import { getDeliveryStatus, isActiveDelivery } from './deliveryStatus'
import type { DeliveryOrderRow } from './types'

export interface DeliveryStats {
  totalAtivos: number
  atrasados: number
  hoje: number
  futuros: number
}

export function computeDeliveryStats(orders: DeliveryOrderRow[], today: Date): DeliveryStats {
  const stats: DeliveryStats = { totalAtivos: 0, atrasados: 0, hoje: 0, futuros: 0 }

  for (const order of orders) {
    if (!isActiveDelivery(order)) continue
    stats.totalAtivos += 1

    const status = getDeliveryStatus(order, today)
    if (status === 'atrasado') stats.atrasados += 1
    if (status === 'hoje') stats.hoje += 1
    if (status === 'no_prazo') stats.futuros += 1
  }

  return stats
}
