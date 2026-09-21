import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import * as XLSX from 'xlsx'
import { Button, Card, ComingSoonButton } from '../../components'
import { buildCalendarGrid } from './buildCalendarGrid'
import { buildOverdueExportRows, type OverdueExportRow } from './buildOverdueExportRows'
import { computeDeliveryStats } from './computeDeliveryStats'
import { DeliveryCalendarGrid } from './DeliveryCalendarGrid'
import { filterDeliveryOrders } from './filterDeliveryOrders'
import { groupOrdersByDate } from './groupOrdersByDate'
import { useActiveDeliveryOrders, useUnitOptions } from './queries'

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

export function DeliveryCalendarPage() {
  const today = useMemo(() => new Date(), [])
  const [visibleMonth, setVisibleMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1))
  const [search, setSearch] = useState('')
  const [unitFilter, setUnitFilter] = useState<string | null>(null)

  const ordersQuery = useActiveDeliveryOrders()
  const unitsQuery = useUnitOptions()

  const allOrders = ordersQuery.data ?? []
  const units = unitsQuery.data ?? []
  const filteredOrders = filterDeliveryOrders(allOrders, { search, unitId: unitFilter })
  const stats = computeDeliveryStats(filteredOrders, today)
  const weeks = buildCalendarGrid(visibleMonth.getFullYear(), visibleMonth.getMonth())
  const ordersByDate = groupOrdersByDate(filteredOrders)
  const monthLabel = capitalizeFirst(MONTH_LABEL_FORMATTER.format(visibleMonth))

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

  function handleShowMore(isoDate: string) {
    // Ação completa (abrir a lista do dia) fica pra Etapa 2, junto dos modais.
    console.log('Ver mais pedidos do dia', isoDate)
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
          <DeliveryCalendarGrid weeks={weeks} ordersByDate={ordersByDate} today={today} onShowMore={handleShowMore} />
        </div>
      </div>
    </div>
  )
}
