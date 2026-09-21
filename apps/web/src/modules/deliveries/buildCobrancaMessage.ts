import { formatLongDate } from '../../lib/formatters'
import { daysLate } from './buildOverdueExportRows'
import { getDeliveryStatus } from './deliveryStatus'

export interface CobrancaMessage {
  subject: string
  body: string
}

export interface CobrancaOrderInfo {
  orderNumber: string
  unitName: string
  expectedDeliveryDate: string
  deliveredAt: string | null
}

export function buildCobrancaMessage(order: CobrancaOrderInfo, supplierName: string, today: Date): CobrancaMessage {
  const subject = `Cobrança de entrega — PC ${order.orderNumber}`
  const formattedDate = formatLongDate(new Date(`${order.expectedDeliveryDate}T00:00:00`))
  const status = getDeliveryStatus(order, today)
  const lateNote = status === 'atrasado' ? ` e já está ${daysLate(order.expectedDeliveryDate, today)} dias em atraso` : ''

  const body = `Olá, ${supplierName},\n\nO pedido PC ${order.orderNumber} (obra ${order.unitName}) tinha entrega combinada para ${formattedDate}${lateNote}.\n\nPoderiam confirmar a previsão de entrega?\n\nObrigado.`

  return { subject, body }
}
