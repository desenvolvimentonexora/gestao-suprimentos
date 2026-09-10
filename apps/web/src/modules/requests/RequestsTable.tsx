import { Badge, Button } from '../../components'
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
  search: string
  onSearchChange: (value: string) => void
  statusFilter: RequestStatus | null
  onStatusFilterChange: (value: RequestStatus | null) => void
  unitFilter: string | null
  onUnitFilterChange: (value: string | null) => void
  onAddRequest: () => void
  onEditRequest: (requestId: string) => void
  onSendToNegotiation: (requestId: string) => void
  onCancelRequest: (requestId: string) => void
}

export function RequestsTable({
  requests,
  units,
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  unitFilter,
  onUnitFilterChange,
  onAddRequest,
  onEditRequest,
  onSendToNegotiation,
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
            <option value="">Todas as unidades</option>
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
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-line text-ink-muted">
              <th className="py-2 font-medium">Unidade</th>
              <th className="py-2 font-medium">N° externo</th>
              <th className="py-2 font-medium">Prazo</th>
              <th className="py-2 font-medium">Itens</th>
              <th className="py-2 font-medium">Status</th>
              <th className="py-2 font-medium">Ações</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((request) => (
              <tr key={request.id} className="border-b border-line">
                <td className="py-2 text-ink">{request.unitName}</td>
                <td className="py-2 text-ink-muted">{request.externalRef ?? '—'}</td>
                <td className="py-2 text-ink-muted">
                  {request.neededBy
                    ? new Intl.DateTimeFormat('pt-BR').format(new Date(`${request.neededBy}T00:00:00`))
                    : '—'}
                </td>
                <td className="py-2 text-ink-muted">
                  {request.items.length} {request.items.length === 1 ? 'item' : 'itens'}
                </td>
                <td className="py-2">
                  <Badge>{STATUS_LABELS[request.status]}</Badge>
                </td>
                <td className="py-2">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      aria-label={`Editar requisição de ${request.unitName}`}
                      onClick={() => onEditRequest(request.id)}
                      className="text-ink-muted hover:text-ink"
                    >
                      Editar
                    </button>
                    {(request.status === 'draft' || request.status === 'open') && (
                      <button
                        type="button"
                        onClick={() => onSendToNegotiation(request.id)}
                        className="text-ink-muted hover:text-ink"
                      >
                        Enviar para cotação
                      </button>
                    )}
                    {request.status !== 'cancelled' && (
                      <button
                        type="button"
                        aria-label={`Cancelar requisição de ${request.unitName}`}
                        onClick={() => handleCancel(request)}
                        className="text-ink-muted hover:text-accent"
                      >
                        Cancelar
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
