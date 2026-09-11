import { useState } from 'react'
import { Folder, Heart } from 'lucide-react'
import { Badge, Button } from '../../components'
import { getDeadlineBadge } from './deadlineBadge'
import { formatItemReference } from './formatItemReference'
import { isOverdue } from './requestIndicators'
import type { RequestRow, RequestStatus } from './types'

const STATUS_LABELS: Record<RequestStatus, string> = {
  draft: 'Rascunho',
  open: 'Aberta',
  negotiating: 'Em negociação',
  quoted: 'Cotada',
  cancelled: 'Cancelada',
}

const DEADLINE_BADGE_CLASSES: Record<'restante' | 'atrasada', string> = {
  restante: 'border-amber-200 bg-amber-50 text-amber-700',
  atrasada: 'border-red-200 bg-red-50 text-red-700',
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('pt-BR').format(new Date(value))
}

function formatDateOnly(value: string): string {
  return new Intl.DateTimeFormat('pt-BR').format(new Date(`${value}T00:00:00`))
}

export interface RequestCardProps {
  request: RequestRow
  today: Date
  onEditRequest: (requestId: string) => void
  onDispatch: (requestId: string) => void
  onCancelRequest: (request: RequestRow) => void
  onNegotiateDirectly: (requestId: string) => void
  onUpdateNotes: (requestId: string, notes: string) => void
}

export function RequestCard({
  request,
  today,
  onEditRequest,
  onDispatch,
  onCancelRequest,
  onNegotiateDirectly,
  onUpdateNotes,
}: RequestCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [notesDraft, setNotesDraft] = useState(request.notes ?? '')

  const overdue = isOverdue(request, today)
  const deadlineBadge = getDeadlineBadge(request.neededBy, today)

  return (
    <div
      data-testid={`request-card-${request.id}`}
      className={`flex flex-col gap-3 rounded border border-l-4 p-4 ${
        overdue ? 'border-line border-l-red-500 bg-red-50/60' : 'border-line border-l-line bg-surface'
      }`}
    >
      <div className="flex flex-wrap items-center gap-4">
        <button
          type="button"
          aria-expanded={isExpanded}
          onClick={() => setIsExpanded((current) => !current)}
          className="flex flex-1 flex-wrap items-center gap-4 text-left"
        >
          <Folder size={18} className="text-ink-muted" aria-hidden="true" />
          <Heart size={16} className="text-ink-muted" aria-hidden="true" aria-label="Favorito" />

          <div className="flex min-w-[10rem] flex-1 flex-col">
            <span className="font-semibold text-ink">{request.externalRef ?? request.id}</span>
            <span className="text-xs text-ink-muted">{request.unitName}</span>
          </div>

          <div className="text-xs text-ink-muted">Solicitada em {formatDate(request.createdAt)}</div>

          <div className="flex flex-col text-xs text-ink-muted">
            {request.neededBy && <span>Entrega {formatDateOnly(request.neededBy)}</span>}
          </div>

          {deadlineBadge && (
            <Badge className={DEADLINE_BADGE_CLASSES[deadlineBadge.tone]}>{deadlineBadge.label}</Badge>
          )}

          <Badge>{STATUS_LABELS[request.status]}</Badge>

          <span className="text-xs text-ink-muted">
            {request.items.length} {request.items.length === 1 ? 'item' : 'itens'}
          </span>
        </button>

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
              onClick={() => onCancelRequest(request)}
              className="text-sm text-ink-muted hover:text-accent"
            >
              Cancelar
            </button>
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="flex flex-col gap-3 border-t border-line pt-3">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-ink-muted">
                  <th className="py-1 pr-3 font-medium">Centro</th>
                  <th className="py-1 pr-3 font-medium">Insumo-Sub</th>
                  <th className="py-1 pr-3 font-medium">Sit</th>
                  <th className="py-1 pr-3 font-medium">Especificação</th>
                  <th className="py-1 pr-3 font-medium">Unid</th>
                  <th className="py-1 pr-3 font-medium">Qtd</th>
                  <th className="py-1 pr-3 font-medium">Solicitação</th>
                  <th className="py-1 pr-3 font-medium">Entrega SOL</th>
                  <th className="py-1 pr-3 font-medium">Data Solic.</th>
                  <th className="py-1 pr-3 font-medium">Data Aut.</th>
                  <th className="py-1 pr-3 font-medium">Dias</th>
                </tr>
              </thead>
              <tbody>
                {request.items.map((item, index) => (
                  <tr key={item.id} className="text-ink">
                    <td className="py-1 pr-3">{request.unitName}</td>
                    <td className="py-1 pr-3">{item.materialName}</td>
                    <td className="py-1 pr-3">{item.statusCode ?? '—'}</td>
                    <td className="py-1 pr-3">—</td>
                    <td className="py-1 pr-3">{item.unitOfMeasure ?? '—'}</td>
                    <td className="py-1 pr-3">{item.quantity}</td>
                    <td className="py-1 pr-3">
                      {formatItemReference(request.externalRef, request.id, index)}
                    </td>
                    <td className="py-1 pr-3">{request.neededBy ? formatDateOnly(request.neededBy) : '—'}</td>
                    <td className="py-1 pr-3">{formatDate(request.createdAt)}</td>
                    <td className="py-1 pr-3">{item.authorizedAt ? formatDateOnly(item.authorizedAt) : '—'}</td>
                    <td className="py-1 pr-3">{deadlineBadge ? deadlineBadge.label.split(' ')[0] : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor={`notes-${request.id}`} className="text-sm font-medium text-ink">
              Observação
            </label>
            <textarea
              id={`notes-${request.id}`}
              value={notesDraft}
              onChange={(e) => setNotesDraft(e.target.value)}
              onBlur={() => onUpdateNotes(request.id, notesDraft)}
              className="rounded border border-line bg-surface px-3 py-2 text-sm text-ink"
            />
            <p className="text-xs text-ink-muted">Ficam registradas até a SOL ser aprovada.</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={() => onDispatch(request.id)}>Disparar SOL</Button>
            {request.quotationsCount > 0 && (
              <Button variant="secondary" onClick={() => onNegotiateDirectly(request.id)}>
                Tenho {request.quotationsCount}{' '}
                {request.quotationsCount === 1 ? 'orçamento' : 'orçamentos'} → Negociar
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
