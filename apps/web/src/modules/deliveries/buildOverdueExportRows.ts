import { getDeliveryStatus, isActiveDelivery } from './deliveryStatus'
import type { DeliveryOrderRow } from './types'

export interface OverdueExportRow {
  'Nº PC': string
  Fornecedor: string
  Obra: string
  'Entrega prevista': string
  'Dias em atraso': number
}

function formatDateOnly(isoDate: string): string {
  return new Intl.DateTimeFormat('pt-BR').format(new Date(`${isoDate}T00:00:00`))
}

export function daysLate(expectedDeliveryDate: string, today: Date): number {
  const expected = new Date(`${expectedDeliveryDate}T00:00:00`)
  const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  return Math.floor((todayOnly.getTime() - expected.getTime()) / (1000 * 60 * 60 * 24))
}

export function buildOverdueExportRows(orders: DeliveryOrderRow[], today: Date): OverdueExportRow[] {
  return orders
    .filter((order) => isActiveDelivery(order) && getDeliveryStatus(order, today) === 'atrasado')
    .map((order) => ({
      'Nº PC': order.orderNumber,
      Fornecedor: order.supplierNames.join(', '),
      Obra: order.unitName,
      'Entrega prevista': formatDateOnly(order.expectedDeliveryDate),
      'Dias em atraso': daysLate(order.expectedDeliveryDate, today),
    }))
}
