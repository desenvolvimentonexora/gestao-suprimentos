import { Button } from '../../components'
import { RequestCard } from './RequestCard'
import type { RequestRow, RequestStatus, UnitOption } from './types'

const STATUS_LABELS: Record<RequestStatus, string> = {
  draft: 'Rascunho',
  open: 'Aberta',
  negotiating: 'Em negociação',
  quoted: 'Cotada',
  cancelled: 'Cancelada',
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
  onNegotiateDirectly: (requestId: string) => void
  onUpdateNotes: (requestId: string, notes: string) => void
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
  onNegotiateDirectly,
  onUpdateNotes,
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
          {requests.map((request) => (
            <RequestCard
              key={request.id}
              request={request}
              today={today}
              onEditRequest={onEditRequest}
              onDispatch={onDispatch}
              onCancelRequest={handleCancel}
              onNegotiateDirectly={onNegotiateDirectly}
              onUpdateNotes={onUpdateNotes}
            />
          ))}
        </div>
      )}
    </div>
  )
}
