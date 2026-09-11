import { Folder, Heart } from 'lucide-react'
import { Badge, Button } from '../../components'
import { isOverdue } from './requestIndicators'
import type { RequestRow, RequestStatus, UnitOption } from './types'

const STATUS_LABELS: Record<RequestStatus, string> = {
  draft: 'Rascunho',
  open: 'Aberta',
  negotiating: 'Em negociação',
  quoted: 'Cotada',
  cancelled: 'Cancelada',
}

function daysLate(neededBy: string, today: Date): number {
  const diff = today.getTime() - new Date(`${neededBy}T00:00:00`).getTime()
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)))
}

export interface RequestsTableProps {
  requests: RequestRow[]
  units: UnitOption[]
  today: Date
  search: string
  onSearchChange: (value: string) => void
  statusFilter: RequestStatus | null
  onStatusFilterChange: (value: RequestStatus | null) => void
  unitFilter: string | null
  onUnitFilterChange: (value: string | null) => void
  onAddRequest: () => void
  onEditRequest: (requestId: string) => void
  onDispatch: (requestId: string) => void
  onCancelRequest: (requestId: string) => void
}

export function RequestsTable({
  requests,
  units,
  today,
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  unitFilter,
  onUnitFilterChange,
  onAddRequest,
  onEditRequest,
  onDispatch,
  onCancelRequest,
}: RequestsTableProps) {
  function handleCancel(request: RequestRow) {
    if (window.confirm(`Cancelar a requisição de "${request.unitName}"?`)) {
      onCancelRequest(request.id)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-1 flex-wrap gap-2">
          <input
            type="search"
            placeholder="Buscar por unidade ou n° externo"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="flex-1 rounded border border-line bg-surface px-3 py-2 text-sm text-ink"
          />
          <select
            aria-label="Filtrar por status"
            value={statusFilter ?? ''}
            onChange={(e) => onStatusFilterChange((e.target.value || null) as RequestStatus | null)}
            className="rounded border border-line bg-surface px-3 py-2 text-sm text-ink"
          >
            <option value="">Todos os status</option>
            {(Object.keys(STATUS_LABELS) as RequestStatus[]).map((status) => (
              <option key={status} value={status}>
                {STATUS_LABELS[status]}
              </option>
            ))}
          </select>
          <select
            aria-label="Filtrar por unidade"
            value={unitFilter ?? ''}
            onChange={(e) => onUnitFilterChange(e.target.value || null)}
            className="rounded border border-line bg-surface px-3 py-2 text-sm text-ink"
          >
            <option value="">Todos os centros</option>
            {units.map((unit) => (
              <option key={unit.id} value={unit.id}>
                {unit.name}
              </option>
            ))}
          </select>
        </div>
        <Button onClick={onAddRequest}>+ Nova requisição</Button>
      </div>

      {requests.length === 0 ? (
        <p className="text-sm text-ink-muted">
          Nenhuma requisição ainda. Importe uma planilha ou crie a primeira.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {requests.map((request) => {
            const overdue = isOverdue(request, today)
            return (
              <div
                key={request.id}
                data-testid={`request-card-${request.id}`}
                className={`flex flex-wrap items-center gap-4 rounded border border-l-4 p-4 ${
                  overdue ? 'border-line border-l-red-500 bg-red-50/60' : 'border-line border-l-line bg-surface'
                }`}
              >
                <Folder size={18} className="text-ink-muted" aria-hidden="true" />
                <Heart size={16} className="text-ink-muted" aria-hidden="true" aria-label="Favorito" />

                <div className="flex min-w-[10rem] flex-1 flex-col">
                  <span className="font-semibold text-ink">{request.externalRef ?? request.id}</span>
                  <span className="text-xs text-ink-muted">{request.unitName}</span>
                </div>

                <div className="text-xs text-ink-muted">
                  Solicitada em {new Intl.DateTimeFormat('pt-BR').format(new Date(request.createdAt))}
                </div>

                <div className="flex flex-col text-xs text-ink-muted">
                  {request.neededBy && (
                    <span>
                      Entrega {new Intl.DateTimeFormat('pt-BR').format(new Date(`${request.neededBy}T00:00:00`))}
                    </span>
                  )}
                  {overdue && request.neededBy && (
                    <span className="font-medium text-red-600">
                      Atrasada {daysLate(request.neededBy, today)}d
                    </span>
                  )}
                </div>

                <Badge>{STATUS_LABELS[request.status]}</Badge>

                <span className="text-xs text-ink-muted">
                  {request.items.length} {request.items.length === 1 ? 'item' : 'itens'}
                </span>

                <div className="ml-auto flex gap-2">
                  <button
                    type="button"
                    aria-label={`Editar requisição de ${request.unitName}`}
                    onClick={() => onEditRequest(request.id)}
                    className="text-sm text-ink-muted hover:text-ink"
                  >
                    Editar
                  </button>
                  {(request.status === 'draft' || request.status === 'open') && (
                    <Button variant="secondary" onClick={() => onDispatch(request.id)}>
                      Disparar
                    </Button>
                  )}
                  {request.status !== 'cancelled' && (
                    <button
                      type="button"
                      aria-label={`Cancelar requisição de ${request.unitName}`}
                      onClick={() => handleCancel(request)}
                      className="text-sm text-ink-muted hover:text-accent"
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
