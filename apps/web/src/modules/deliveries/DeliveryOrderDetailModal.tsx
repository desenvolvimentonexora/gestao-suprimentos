import { useState } from 'react'
import { ChevronRight, Mail, MapPin, Phone } from 'lucide-react'
import { Badge, Button, Modal, Spinner } from '../../components'
import { formatDate, formatLongDate } from '../../lib/formatters'
import { buildCobrancaMessage } from './buildCobrancaMessage'
import { openMailto } from './buildMailtoUrl'
import { buildWhatsAppUrl } from './buildWhatsAppUrl'
import { computeOrderTotal } from './computeOrderTotal'
import { DELIVERY_STATUS_BADGE_CLASSES, DELIVERY_STATUS_LABELS, getDeliveryStatus } from './deliveryStatus'
import { DeliveryNotesField } from './DeliveryNotesField'
import { DeliveryPartialChecklist } from './DeliveryPartialChecklist'
import { formatSubpedidoLabel } from './formatSubpedidoLabel'
import type { DeliveryOrderDetail } from './types'

function formatCurrencyBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

export interface DeliveryOrderDetailModalProps {
  isOpen: boolean
  order: DeliveryOrderDetail | undefined
  today: Date
  onClose: () => void
  onViewOrder: (orderId: string) => void
  onReschedule: (orderId: string) => void
  onMarkDelivered: (orderId: string) => void
  isMarkingDelivered: boolean
  onToggleItemDelivered: (orderItemId: string, delivered: boolean) => void
  isTogglingItem: boolean
  onSaveNotes: (notes: string) => void
  isSavingNotes: boolean
}

export function DeliveryOrderDetailModal({
  isOpen,
  order,
  today,
  onClose,
  onViewOrder,
  onReschedule,
  onMarkDelivered,
  isMarkingDelivered,
  onToggleItemDelivered,
  isTogglingItem,
  onSaveNotes,
  isSavingNotes,
}: DeliveryOrderDetailModalProps) {
  const [showPartial, setShowPartial] = useState(false)

  if (!order) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Pedido">
        <div className="flex justify-center py-6">
          <Spinner />
        </div>
      </Modal>
    )
  }

  const status = getDeliveryStatus(order, today)
  const total = computeOrderTotal(order.items)
  const primarySupplier = order.suppliers[0] ?? null
  const primaryContact = primarySupplier?.contacts[0] ?? null
  const supplierNames = order.suppliers.map((supplier) => supplier.name).join(', ')

  function handleSendCobranca() {
    if (!primaryContact?.email || !order) return
    const message = buildCobrancaMessage(order, primarySupplier?.name ?? '', today)
    openMailto({ to: primaryContact.email, subject: message.subject, body: message.body })
  }

  function handleSendWhatsApp() {
    if (!primaryContact?.phone || !order) return
    const message = buildCobrancaMessage(order, primarySupplier?.name ?? '', today)
    window.open(buildWhatsAppUrl(primaryContact.phone, message.body), '_blank', 'noopener')
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Pedido ${order.orderNumber}`}
      headerClassName={DELIVERY_STATUS_BADGE_CLASSES[status]}
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2 text-sm text-ink-muted">
          <span>{formatLongDate(new Date(`${order.expectedDeliveryDate}T00:00:00`))}</span>
          <Badge className={DELIVERY_STATUS_BADGE_CLASSES[status]}>{DELIVERY_STATUS_LABELS[status]}</Badge>
        </div>

        <p className="text-sm text-ink">
          <span className="font-medium">Obra:</span> {order.unitName}
        </p>

        <button
          type="button"
          onClick={() => onViewOrder(order.id)}
          className="flex items-center justify-between rounded border border-line bg-bg px-3 py-2 text-left text-sm hover:bg-surface"
        >
          <span className="text-ink">
            <span className="font-medium">PC {order.orderNumber}</span> ({order.items.length}{' '}
            {order.items.length === 1 ? 'subpedido' : 'subpedidos'}) · {supplierNames || '—'} ·{' '}
            {formatCurrencyBRL(total)}
          </span>
          <ChevronRight size={16} className="text-ink-muted" aria-hidden="true" />
        </button>

        {order.suppliers.map((supplier) => (
          <div key={supplier.id} className="rounded border border-line bg-bg p-3 text-sm text-ink-muted">
            <p className="font-medium text-ink">{supplier.name}</p>
            {supplier.contacts.length === 0 ? (
              <p>Sem contato cadastrado.</p>
            ) : (
              supplier.contacts.map((contact) => (
                <p key={contact.id} className="flex flex-wrap items-center gap-3">
                  <span>{contact.name}</span>
                  {contact.phone && (
                    <span className="flex items-center gap-1">
                      <Phone size={12} aria-hidden="true" /> {contact.phone}
                    </span>
                  )}
                  {contact.email && (
                    <span className="flex items-center gap-1">
                      <Mail size={12} aria-hidden="true" /> {contact.email}
                    </span>
                  )}
                </p>
              ))
            )}
            {supplier.city && (
              <p className="flex items-center gap-1">
                <MapPin size={12} aria-hidden="true" /> {supplier.city}
              </p>
            )}
          </div>
        ))}

        <ul className="flex flex-col gap-1 text-sm text-ink">
          {order.items.map((item, index) => (
            <li key={item.id} className="flex items-center justify-between border-b border-line py-1 last:border-0">
              <span>
                {formatSubpedidoLabel(order.orderNumber, index)} ·{' '}
                {item.materialCode ?? item.materialName} · Qtd{' '}
                {item.quantity} {item.unitOfMeasure ?? ''}
              </span>
              <span className="text-ink-muted">{formatCurrencyBRL(item.quantity * item.unitPrice)}</span>
            </li>
          ))}
        </ul>

        <DeliveryNotesField notes={order.deliveryNotes} isSaving={isSavingNotes} onSave={onSaveNotes} />

        {showPartial && (
          <DeliveryPartialChecklist
            orderNumber={order.orderNumber}
            items={order.items}
            isSaving={isTogglingItem}
            onToggleItem={onToggleItemDelivered}
          />
        )}

        <div className="flex flex-wrap gap-2 border-t border-line pt-3">
          <Button
            variant="secondary"
            disabled={!primaryContact?.email}
            title={primaryContact?.email ? undefined : 'Fornecedor sem e-mail cadastrado'}
            onClick={handleSendCobranca}
          >
            Enviar Cobrança
          </Button>
          <Button
            variant="secondary"
            disabled={!primaryContact?.phone}
            title={primaryContact?.phone ? undefined : 'Fornecedor sem telefone cadastrado'}
            onClick={handleSendWhatsApp}
          >
            WhatsApp
          </Button>
          <Button variant="secondary" onClick={() => onViewOrder(order.id)}>
            Ver Pedido
          </Button>
          <Button variant="secondary" onClick={() => onReschedule(order.id)}>
            Reagendar
          </Button>
          <Button variant="secondary" onClick={() => setShowPartial((current) => !current)}>
            Entrega Parcial
          </Button>
          {order.deliveredAt ? (
            <span className="flex items-center text-sm text-ink-muted">
              Chegou em {formatDate(new Date(order.deliveredAt))}
            </span>
          ) : (
            <Button onClick={() => onMarkDelivered(order.id)} disabled={isMarkingDelivered}>
              Pedido Chegou
            </Button>
          )}
        </div>
      </div>
    </Modal>
  )
}
