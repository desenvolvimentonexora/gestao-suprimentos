import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import * as XLSX from 'xlsx'
import { Button, Card, ComingSoonButton } from '../../components'
import { buildCalendarGrid } from './buildCalendarGrid'
import { buildOverdueExportRows, type OverdueExportRow } from './buildOverdueExportRows'
import { computeDeliveryStats } from './computeDeliveryStats'
import { DeliveryCalendarGrid } from './DeliveryCalendarGrid'
import { DeliveryDayOrdersModal } from './DeliveryDayOrdersModal'
import { DeliveryOrderDetailModal } from './DeliveryOrderDetailModal'
import { DeliveryOrderViewModal } from './DeliveryOrderViewModal'
import { DeliveryRescheduleModal } from './DeliveryRescheduleModal'
import { filterDeliveryOrders } from './filterDeliveryOrders'
import { groupOrdersByDate } from './groupOrdersByDate'
import {
  useActiveDeliveryOrders,
  useDeliveryOrderDetail,
  useMarkOrderDelivered,
  useMarkOrderItemDelivered,
  useRescheduleDelivery,
  useUnitOptions,
  useUpdateDeliveryNotes,
} from './queries'

export interface DeliveryCalendarPageProps {
  tenantId: string
  userId: string
}

const MONTH_LABEL_FORMATTER = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' })

function capitalizeFirst(text: string): string {
  return text.length === 0 ? text : text.charAt(0).toUpperCase() + text.slice(1)
}

function exportOverdueToExcel(rows: OverdueExportRow[]) {
  const worksheet = XLSX.utils.json_to_sheet(rows)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Atrasados')
  XLSX.writeFile(workbook, 'pedidos-atrasados.xlsx')
}

export function DeliveryCalendarPage({ tenantId, userId }: DeliveryCalendarPageProps) {
  const today = useMemo(() => new Date(), [])
  const [visibleMonth, setVisibleMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1))
  const [search, setSearch] = useState('')
  const [unitFilter, setUnitFilter] = useState<string | null>(null)
  const [dayListIsoDate, setDayListIsoDate] = useState<string | null>(null)
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false)

  const ordersQuery = useActiveDeliveryOrders()
  const unitsQuery = useUnitOptions()
  const selectedOrderDetailQuery = useDeliveryOrderDetail(selectedOrderId)
  const markDelivered = useMarkOrderDelivered(selectedOrderId ?? '')
  const markItemDelivered = useMarkOrderItemDelivered(selectedOrderId ?? '')
  const updateNotes = useUpdateDeliveryNotes(selectedOrderId ?? '')
  const rescheduleDelivery = useRescheduleDelivery(selectedOrderId ?? '')

  const allOrders = ordersQuery.data ?? []
  const units = unitsQuery.data ?? []
  const filteredOrders = filterDeliveryOrders(allOrders, { search, unitId: unitFilter })
  const stats = computeDeliveryStats(filteredOrders, today)
  const weeks = buildCalendarGrid(visibleMonth.getFullYear(), visibleMonth.getMonth())
  const ordersByDate = groupOrdersByDate(filteredOrders)
  const monthLabel = capitalizeFirst(MONTH_LABEL_FORMATTER.format(visibleMonth))
  const dayListOrders = dayListIsoDate ? (ordersByDate.get(dayListIsoDate) ?? []) : []

  function goToPreviousMonth() {
    setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))
  }

  function goToNextMonth() {
    setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))
  }

  function goToToday() {
    setVisibleMonth(new Date(today.getFullYear(), today.getMonth(), 1))
  }

  function handleExportOverdue() {
    exportOverdueToExcel(buildOverdueExportRows(filteredOrders, today))
  }

  function handleCloseDetail() {
    setSelectedOrderId(null)
    setIsViewOpen(false)
    setIsRescheduleOpen(false)
  }

  function handleSelectOrderFromDayList(orderId: string) {
    setSelectedOrderId(orderId)
    setDayListIsoDate(null)
  }

  function handleConfirmReschedule(values: { newDate: string; reason: string }) {
    const order = selectedOrderDetailQuery.data
    if (!order) return
    rescheduleDelivery.mutate(
      {
        tenantId,
        orderId: order.id,
        previousDate: order.expectedDeliveryDate,
        newDate: values.newDate,
        reason: values.reason,
        createdBy: userId,
      },
      { onSuccess: () => setIsRescheduleOpen(false) },
    )
  }

  return (
    <div className="min-h-screen bg-bg">
      <div className="bg-gradient-to-b from-primary-dark to-primary px-6 py-8">
        <div className="mx-auto max-w-6xl">
          <Link to="/suprimentos" className="text-sm text-on-primary hover:underline">
            ← Suprimentos
          </Link>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold text-on-primary">Cobrador de Entregas</h1>
              <p className="text-sm text-on-primary/80">Calendário de pedidos de compra por obra.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="on-primary" onClick={handleExportOverdue}>
                Exportar Atrasados
              </Button>
              <Link
                to="/suprimentos/equalizacao"
                className="rounded border border-white/30 bg-white/10 px-4 py-2 text-sm font-medium text-on-primary hover:bg-white/20"
              >
                Importar PCs
              </Link>
              <ComingSoonButton label="Monitor de NF (SEFAZ)" variant="on-primary" />
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Card>
              <p className="text-xs text-ink-muted">Total Ativos</p>
              <p className="text-2xl font-semibold text-ink">{stats.totalAtivos}</p>
            </Card>
            <Card>
              <p className="text-xs text-ink-muted">Atrasados</p>
              <p className="text-2xl font-semibold text-red-700">{stats.atrasados}</p>
            </Card>
            <Card>
              <p className="text-xs text-ink-muted">Hoje</p>
              <p className="text-2xl font-semibold text-blue-700">{stats.hoje}</p>
            </Card>
            <Card>
              <p className="text-xs text-ink-muted">Futuros</p>
              <p className="text-2xl font-semibold text-emerald-700">{stats.futuros}</p>
            </Card>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={goToPreviousMonth} aria-label="Mês anterior">
              ←
            </Button>
            <span className="min-w-[10rem] text-center text-sm font-medium text-ink">{monthLabel}</span>
            <Button variant="secondary" onClick={goToNextMonth} aria-label="Próximo mês">
              →
            </Button>
          </div>
          <Button variant="secondary" onClick={goToToday}>
            Hoje
          </Button>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <input
            type="search"
            placeholder="Buscar por nº do PC ou fornecedor"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 rounded border border-line bg-surface px-3 py-2 text-sm text-ink"
          />
          <select
            aria-label="Filtrar por obra"
            value={unitFilter ?? ''}
            onChange={(e) => setUnitFilter(e.target.value || null)}
            className="rounded border border-line bg-surface px-3 py-2 text-sm text-ink"
          >
            <option value="">Todas as obras</option>
            {units.map((unit) => (
              <option key={unit.id} value={unit.id}>
                {unit.name}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-4">
          <DeliveryCalendarGrid
            weeks={weeks}
            ordersByDate={ordersByDate}
            today={today}
            onShowMore={setDayListIsoDate}
            onSelectOrder={setSelectedOrderId}
          />
        </div>
      </div>

      <DeliveryDayOrdersModal
        isOpen={Boolean(dayListIsoDate)}
        isoDate={dayListIsoDate}
        orders={dayListOrders}
        today={today}
        onClose={() => setDayListIsoDate(null)}
        onSelectOrder={handleSelectOrderFromDayList}
      />

      <DeliveryOrderDetailModal
        key={selectedOrderId ?? 'none'}
        isOpen={Boolean(selectedOrderId)}
        order={selectedOrderDetailQuery.data}
        today={today}
        onClose={handleCloseDetail}
        onViewOrder={() => setIsViewOpen(true)}
        onReschedule={() => setIsRescheduleOpen(true)}
        onMarkDelivered={() => markDelivered.mutate()}
        isMarkingDelivered={markDelivered.isPending}
        onToggleItemDelivered={(orderItemId, delivered) => markItemDelivered.mutate({ orderItemId, delivered })}
        isTogglingItem={markItemDelivered.isPending}
        onSaveNotes={(notes) => updateNotes.mutate(notes)}
        isSavingNotes={updateNotes.isPending}
      />

      <DeliveryOrderViewModal
        isOpen={isViewOpen}
        order={selectedOrderDetailQuery.data}
        onClose={() => setIsViewOpen(false)}
      />

      <DeliveryRescheduleModal
        key={selectedOrderId ?? 'none'}
        isOpen={isRescheduleOpen}
        order={selectedOrderDetailQuery.data}
        isSaving={rescheduleDelivery.isPending}
        onClose={() => setIsRescheduleOpen(false)}
        onConfirm={handleConfirmReschedule}
      />
    </div>
  )
}
