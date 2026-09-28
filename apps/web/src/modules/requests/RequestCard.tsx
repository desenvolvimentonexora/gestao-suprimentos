import { useState } from 'react'
import { Folder, Lock, MapPin } from 'lucide-react'
import { Badge, Button } from '../../components'
import { getDeadlineBadge } from './deadlineBadge'
import { formatRequestNumber } from './formatRequestNumber'
import { STATUS_LABELS } from './requestStatusLabels'
import { RequestItemsTable } from './RequestItemsTable'
import { RequestNotesField } from './RequestNotesField'
import type { RequestRow } from './types'

const DEADLINE_BADGE_CLASSES: Record<'restante' | 'atrasada', string> = {
  restante: 'border-amber-200 bg-amber-50 text-amber-700',
  atrasada: 'border-red-200 bg-red-50 text-red-700',
}

// Mesmo tom do badge de prazo na borda lateral do card — antes só o atraso
// (vermelho) tinha uma cor própria, deixando "restante" com a borda neutra e
// inconsistente com o badge ao lado.
const DEADLINE_BORDER_CLASSES: Record<'restante' | 'atrasada', string> = {
  restante: 'border-l-amber-500 bg-amber-50/60',
  atrasada: 'border-l-red-500 bg-red-50/60',
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
  onRetryDispatch: (requestId: string) => void
  isRetryingDispatch: boolean
  onOpenAttachments: (requestId: string) => void
}

export function RequestCard({
  request,
  today,
  onEditRequest,
  onDispatch,
  onCancelRequest,
  onNegotiateDirectly,
  onUpdateNotes,
  onRetryDispatch,
  isRetryingDispatch,
  onOpenAttachments,
}: RequestCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const deadlineBadge = getDeadlineBadge(request.neededBy, today)
  const displayNumber = formatRequestNumber(request.externalRef, request.sequenceNumber)

  return (
    <div
      data-testid={`request-card-${request.id}`}
      className={`flex flex-col gap-3 rounded-lg border-y border-r border-l-4 p-4 border-line ${
        deadlineBadge ? DEADLINE_BORDER_CLASSES[deadlineBadge.tone] : 'border-l-line bg-surface'
      }`}
    >
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label={`Ver arquivos de ${displayNumber}`}
          onClick={() => onOpenAttachments(request.id)}
          className="shrink-0 text-ink-muted hover:text-ink"
        >
          <Folder size={18} aria-hidden="true" />
        </button>

        <button
          type="button"
          aria-expanded={isExpanded}
          onClick={() => setIsExpanded((current) => !current)}
          className="flex flex-1 flex-wrap items-center justify-between gap-2 text-left"
        >
          <span className="flex flex-wrap items-center gap-4">
            <Lock size={16} className="shrink-0 text-ink-muted" aria-hidden="true" />

            <span className="shrink-0 whitespace-nowrap font-semibold text-ink">{displayNumber}</span>

            <span className="flex shrink-0 items-center gap-1 whitespace-nowrap text-xs text-ink-muted">
              <MapPin size={14} className="text-blue-600" aria-hidden="true" />
              {request.unitName}
            </span>

            <span className="shrink-0 whitespace-nowrap text-xs text-ink-muted">
              Solicitada em {formatDate(request.createdAt)}
            </span>

            {request.neededBy && (
              <span className="shrink-0 whitespace-nowrap text-xs text-ink-muted">
                Entrega {formatDateOnly(request.neededBy)}
              </span>
            )}
          </span>

          <span className="flex flex-wrap items-center gap-2">
            <Badge className="shrink-0">{STATUS_LABELS[request.status]}</Badge>

            {deadlineBadge && (
              <Badge className={`shrink-0 ${DEADLINE_BADGE_CLASSES[deadlineBadge.tone]}`}>
                {deadlineBadge.label}
              </Badge>
            )}

            <span className="shrink-0 whitespace-nowrap text-xs text-ink-muted">
              {request.items.length} {request.items.length === 1 ? 'item' : 'itens'}
            </span>
          </span>
        </button>
      </div>

      {request.dispatchBlockedReason && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          <span>{request.dispatchBlockedReason}</span>
          <Button variant="secondary" onClick={() => onRetryDispatch(request.id)} disabled={isRetryingDispatch}>
            {isRetryingDispatch ? 'Tentando de novo...' : 'Tentar disparo automático novamente'}
          </Button>
        </div>
      )}

      {isExpanded && (
        <div className="flex flex-col gap-3 border-t border-line pt-3">
          <RequestItemsTable
            displayNumber={displayNumber}
            unitName={request.unitName}
            items={request.items}
            neededBy={request.neededBy}
            createdAt={request.createdAt}
            diasValue={deadlineBadge ? (deadlineBadge.label.split(' ')[0] ?? '—') : '—'}
          />

          <RequestNotesField requestId={request.id} initialValue={request.notes ?? ''} onSave={onUpdateNotes} />

          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => onDispatch(request.id)}>Disparar SOL</Button>
              {request.quotationsCount > 0 && (
                <Button variant="secondary" onClick={() => onNegotiateDirectly(request.id)}>
                  Tenho {request.quotationsCount}{' '}
                  {request.quotationsCount === 1 ? 'orçamento' : 'orçamentos'} → Negociar
                </Button>
              )}
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                aria-label={`Editar requisição de ${request.unitName}`}
                onClick={() => onEditRequest(request.id)}
                className="text-sm text-ink-muted hover:text-ink"
              >
                Editar
              </button>
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
        </div>
      )}
    </div>
  )
}
