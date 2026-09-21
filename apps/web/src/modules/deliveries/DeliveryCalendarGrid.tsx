import {
  DELIVERY_STATUS_BADGE_CLASSES,
  DELIVERY_STATUS_DOT_CLASSES,
  DELIVERY_STATUS_LABELS,
  getDeliveryStatus,
} from './deliveryStatus'
import { formatIsoDate, type CalendarDay } from './buildCalendarGrid'
import type { DeliveryOrderRow, DeliveryStatus } from './types'

const WEEKDAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const MAX_CHIPS_PER_DAY = 3
const LEGEND_STATUSES: DeliveryStatus[] = ['atrasado', 'hoje', 'no_prazo', 'chegou_ar_pendente']

export interface DeliveryCalendarGridProps {
  weeks: CalendarDay[][]
  ordersByDate: Map<string, DeliveryOrderRow[]>
  today: Date
  onShowMore: (isoDate: string) => void
  onSelectOrder: (orderId: string) => void
}

export function DeliveryCalendarGrid({ weeks, ordersByDate, today, onShowMore, onSelectOrder }: DeliveryCalendarGridProps) {
  const todayIso = formatIsoDate(today)

  return (
    <div className="rounded border border-line">
      <div className="grid grid-cols-7 border-b border-line bg-bg text-xs font-medium text-ink-muted">
        {WEEKDAY_LABELS.map((label) => (
          <div key={label} className="px-2 py-2 text-center">
            {label}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {weeks.flat().map((day) => {
          const ordersOfDay = ordersByDate.get(day.isoDate) ?? []
          const visibleOrders = ordersOfDay.slice(0, MAX_CHIPS_PER_DAY)
          const extraCount = ordersOfDay.length - visibleOrders.length
          const isToday = day.isoDate === todayIso

          return (
            <div
              key={day.isoDate}
              className={`flex min-h-[6rem] flex-col gap-1 border-b border-r border-line p-1 ${
                day.inCurrentMonth ? 'bg-surface' : 'bg-bg'
              }`}
            >
              <span
                className={`self-start text-xs ${
                  isToday
                    ? 'flex h-5 w-5 items-center justify-center rounded-full bg-primary font-medium text-on-primary'
                    : day.inCurrentMonth
                      ? 'text-ink'
                      : 'text-ink-muted'
                }`}
              >
                {day.dayOfMonth}
              </span>

              <div className="flex flex-col gap-1">
                {visibleOrders.map((order) => (
                  <button
                    key={order.id}
                    type="button"
                    onClick={() => onSelectOrder(order.id)}
                    title={`${order.orderNumber} · ${order.supplierNames.join(', ')} · ${order.unitName}`}
                    className={`truncate rounded border px-1.5 py-0.5 text-left text-[11px] hover:opacity-80 ${DELIVERY_STATUS_BADGE_CLASSES[getDeliveryStatus(order, today)]}`}
                  >
                    {order.orderNumber} · {order.supplierNames[0] ?? '—'} · {order.unitName}
                  </button>
                ))}
                {extraCount > 0 && (
                  <button
                    type="button"
                    onClick={() => onShowMore(day.isoDate)}
                    className="self-start text-[11px] text-ink-muted hover:text-ink hover:underline"
                  >
                    +{extraCount} mais
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
      <div className="flex flex-wrap items-center gap-3 border-t border-line px-3 py-2 text-xs text-ink-muted">
        <span className="font-medium text-ink">Legenda:</span>
        {LEGEND_STATUSES.map((status) => (
          <span key={status} className="flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-full ${DELIVERY_STATUS_DOT_CLASSES[status]}`} aria-hidden="true" />
            {DELIVERY_STATUS_LABELS[status]}
          </span>
        ))}
      </div>
    </div>
  )
}
