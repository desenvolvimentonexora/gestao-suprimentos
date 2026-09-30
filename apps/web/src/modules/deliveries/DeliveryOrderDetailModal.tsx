import { useState } from 'react'
import {
  AlertTriangle,
  Building2,
  Calendar,
  ChevronRight,
  Mail,
  MapPin,
  Package,
  Phone,
  ShoppingCart,
  User,
} from 'lucide-react'
import { Button, Modal, Spinner } from '../../components'
import { formatDate, formatLongDate } from '../../lib/formatters'
import { buildCobrancaMessage } from './buildCobrancaMessage'
import { openMailto } from './buildMailtoUrl'
import { buildWhatsAppUrl } from './buildWhatsAppUrl'
import { computeOrderTotal } from './computeOrderTotal'
import { DeliveryActionButton } from './DeliveryActionButton'
import {
  DELIVERY_STATUS_BORDER_CLASSES,
  DELIVERY_STATUS_HEADER_CLASSES,
  DELIVERY_STATUS_LABELS,
  DELIVERY_STATUS_TEXT_CLASSES,
  getDeliveryStatus,
} from './deliveryStatus'
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
      titleClassName="text-white"
      headerClassName={DELIVERY_STATUS_HEADER_CLASSES[status]}
      maxWidthClassName="max-w-2xl"
    >
      {/* O painel da Modal usa `gap-4` entre os filhos, e o cabeçalho tem seu
          próprio `mb-2` — os dois juntos abririam uma faixa branca entre o
          título e esta faixa. -mt-6 cancela os dois (16px do gap + 8px do
          mb-2), colando as duas faixas coloridas sem espaço entre elas. */}
      <div className={`-mx-6 -mt-6 px-6 pb-3 text-sm ${DELIVERY_STATUS_HEADER_CLASSES[status]}`}>
        <div className="flex flex-wrap items-center gap-2">
          <span>{formatLongDate(new Date(`${order.expectedDeliveryDate}T00:00:00`))}</span>
          <span className="rounded-full border border-white/40 bg-white/15 px-2 py-0.5 text-xs font-medium">
            {DELIVERY_STATUS_LABELS[status]}
          </span>
        </div>
        <p className="mt-1">
          <span className="font-medium">Obra:</span> {order.unitName}
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <div
          className={`overflow-hidden rounded border-y border-r border-l-4 border-line bg-surface ${DELIVERY_STATUS_BORDER_CLASSES[status]}`}
        >
          <button
            type="button"
            onClick={() => onViewOrder(order.id)}
            className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-bg"
          >
            <span className="flex flex-wrap items-center gap-1.5 text-ink">
              <ShoppingCart size={14} className={DELIVERY_STATUS_TEXT_CLASSES[status]} aria-hidden="true" />
              <span className={`font-semibold ${DELIVERY_STATUS_TEXT_CLASSES[status]}`}>PC {order.orderNumber}</span>
              <span className="text-ink-muted">
                ({order.items.length} {order.items.length === 1 ? 'subpedido' : 'subpedidos'})
              </span>
              <Building2 size={14} className="text-ink-muted" aria-hidden="true" />
              <span>{supplierNames || '—'}</span>
            </span>
            <span className="flex shrink-0 items-center gap-1 font-semibold text-ink">
              {formatCurrencyBRL(total)}
              <ChevronRight size={16} className="text-ink-muted" aria-hidden="true" />
            </span>
          </button>

          {order.suppliers.map((supplier) => (
            <div key={supplier.id} className="flex flex-wrap items-center gap-3 border-t border-line p-3 text-sm text-ink-muted">
              {supplier.contacts.length === 0 ? (
                <span>Sem contato cadastrado.</span>
              ) : (
                supplier.contacts.map((contact) => (
                  <span key={contact.id} className="flex flex-wrap items-center gap-3">
                    <span className="flex items-center gap-1">
                      <User size={12} aria-hidden="true" /> {contact.name}
                    </span>
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
                  </span>
                ))
              )}
              {supplier.city && (
                <span className="flex items-center gap-1">
                  <MapPin size={12} aria-hidden="true" /> {supplier.city}
                </span>
              )}
            </div>
          ))}

          <div className="flex flex-wrap items-center gap-3 border-t border-line p-3 text-sm text-ink-muted">
            <span className="flex items-center gap-1">
              <Calendar size={12} aria-hidden="true" /> Entrega em{' '}
              {formatDate(new Date(`${order.expectedDeliveryDate}T00:00:00`))}
            </span>
            <span className="flex items-center gap-1">
              <Package size={12} aria-hidden="true" /> {order.items.length}{' '}
              {order.items.length === 1 ? 'item' : 'itens'}
            </span>
          </div>
        </div>

        <div className="rounded border border-line bg-surface p-3">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-amber-700">
            <AlertTriangle size={14} aria-hidden="true" />
            {order.items.length} {order.items.length === 1 ? 'subpedido' : 'subpedidos'} no total (
            {order.items.length} {order.items.length === 1 ? 'item' : 'itens'})
          </p>
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
        </div>

        <DeliveryNotesField notes={order.deliveryNotes} isSaving={isSavingNotes} onSave={onSaveNotes} />

        {showPartial && (
          <DeliveryPartialChecklist
            orderNumber={order.orderNumber}
            items={order.items}
            isSaving={isTogglingItem}
            onToggleItem={onToggleItemDelivered}
          />
        )}

        <div className="flex flex-col gap-2 border-t border-line pt-3">
          <div className="flex flex-wrap gap-2">
            <DeliveryActionButton
              tone="blue"
              disabled={!primaryContact?.email}
              title={primaryContact?.email ? undefined : 'Fornecedor sem e-mail cadastrado'}
              onClick={handleSendCobranca}
            >
              Enviar Cobrança
            </DeliveryActionButton>
            <DeliveryActionButton
              tone="green"
              disabled={!primaryContact?.phone}
              title={primaryContact?.phone ? undefined : 'Fornecedor sem telefone cadastrado'}
              onClick={handleSendWhatsApp}
            >
              WhatsApp
            </DeliveryActionButton>
            <DeliveryActionButton tone="neutral" onClick={() => onViewOrder(order.id)}>
              Ver Pedido
            </DeliveryActionButton>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <DeliveryActionButton tone="blue" onClick={() => onReschedule(order.id)}>
              Reagendar
            </DeliveryActionButton>
            <DeliveryActionButton tone="amber" onClick={() => setShowPartial((current) => !current)}>
              Entrega Parcial
            </DeliveryActionButton>
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
      </div>
    </Modal>
  )
}
