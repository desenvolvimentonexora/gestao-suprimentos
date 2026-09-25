import type { RequestStatus } from './types'

export const STATUS_LABELS: Record<RequestStatus, string> = {
  draft: 'Rascunho',
  open: 'Aberta',
  negotiating: 'Em negociação',
  quoted: 'Cotada',
  cancelled: 'Cancelada',
  pending_review: 'Em análise',
  clarification_requested: 'Aguardando esclarecimento',
  extension_requested: 'Prorrogação solicitada',
  released_to_dispatch: 'Liberada pro Disparo',
}
