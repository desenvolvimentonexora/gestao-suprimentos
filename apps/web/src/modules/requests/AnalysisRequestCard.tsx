import { useState } from 'react'
import { CalendarDays, MapPin, Trash2, Truck } from 'lucide-react'
import { Badge, Button } from '../../components'
import { formatRequestNumber } from './formatRequestNumber'
import { getUrgencyTier } from './getUrgencyTier'
import { RequestItemsTable } from './RequestItemsTable'
import { RequestNotesField } from './RequestNotesField'
import type { RequestRow } from './types'

const TIER_BADGE_CLASSES = {
  urgente: 'border-red-200 bg-red-50 text-red-700',
  atencao: 'border-orange-200 bg-orange-50 text-orange-700',
  tranquila: 'border-green-200 bg-green-50 text-green-700',
  ag_aprovacao: 'border-line bg-bg text-ink-muted',
} as const

// Faixa na borda esquerda do card com a mesma cor do badge de urgência
// (seção "DIAS" da referência) — mesmo sinal, mais visível na lista fechada.
const TIER_LEFT_BORDER_CLASSES = {
  urgente: 'border-l-red-500',
  atencao: 'border-l-orange-500',
  tranquila: 'border-l-green-500',
  ag_aprovacao: 'border-l-line',
} as const

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('pt-BR').format(new Date(value))
}

function formatDateOnly(value: string): string {
  return new Intl.DateTimeFormat('pt-BR').format(new Date(`${value}T00:00:00`))
}

export interface AnalysisRequestCardProps {
  request: RequestRow
  today: Date
  canAnalyze: boolean
  onUpdateNotes: (requestId: string, notes: string) => void
  onDeleteRequest: (request: RequestRow) => void
  onOpenExtensionModal: (requestId: string) => void
  onReleaseToDispatch: (requestId: string) => void
}

export function AnalysisRequestCard({
  request,
  today,
  canAnalyze,
  onUpdateNotes,
  onDeleteRequest,
  onOpenExtensionModal,
  onReleaseToDispatch,
}: AnalysisRequestCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const urgency = getUrgencyTier(request.neededBy, today)
  const displayNumber = formatRequestNumber(request.externalRef, request.sequenceNumber)

  return (
    <div
      data-testid={`analysis-card-${request.id}`}
      className={`flex flex-col gap-3 rounded-lg border-y border-r border-l-4 border-line bg-surface p-4 ${TIER_LEFT_BORDER_CLASSES[urgency.tier]}`}
    >
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-expanded={isExpanded}
          onClick={() => setIsExpanded((current) => !current)}
          className="flex flex-1 items-center gap-4 overflow-x-auto text-left"
        >
          <span className="shrink-0 whitespace-nowrap font-semibold text-ink">{displayNumber}</span>

          <span className="flex shrink-0 items-center gap-1 whitespace-nowrap text-xs text-ink-muted">
            <MapPin size={14} className="text-blue-600" aria-hidden="true" />
            {request.unitName}
          </span>

          <span className="flex shrink-0 items-center gap-1 whitespace-nowrap text-xs text-ink-muted">
            <CalendarDays size={14} className="text-violet-600" aria-hidden="true" />
            Solicitada em {formatDate(request.createdAt)}
          </span>

          {request.neededBy && (
            <span className="flex shrink-0 items-center gap-1 whitespace-nowrap text-xs text-ink-muted">
              <Truck size={14} className="text-amber-600" aria-hidden="true" />
              Entrega {formatDateOnly(request.neededBy)}
            </span>
          )}
        </button>

        <div className="flex shrink-0 items-center gap-2">
          <Badge className={`shrink-0 ${TIER_BADGE_CLASSES[urgency.tier]}`}>{urgency.label}</Badge>

          <span className="shrink-0 whitespace-nowrap text-xs text-ink-muted">
            {request.items.length} {request.items.length === 1 ? 'item' : 'itens'}
          </span>

          <button
            type="button"
            aria-label={`Excluir requisição de ${request.unitName}`}
            onClick={() => onDeleteRequest(request)}
            className="shrink-0 text-ink-muted hover:text-accent"
          >
            <Trash2 size={16} aria-hidden="true" />
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="flex flex-col gap-3 border-t border-line pt-3">
          <RequestItemsTable
            displayNumber={displayNumber}
            unitName={request.unitName}
            items={request.items}
            neededBy={request.neededBy}
            createdAt={request.createdAt}
            diasValue={urgency.tier === 'ag_aprovacao' ? '—' : urgency.label}
          />

          <RequestNotesField
            requestId={request.id}
            initialValue={request.notes ?? ''}
            onSave={onUpdateNotes}
          />

          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              disabled={!canAnalyze}
              onClick={() => onOpenExtensionModal(request.id)}
            >
              Pedir prorrogação
            </Button>
            <Button disabled={!canAnalyze} onClick={() => onReleaseToDispatch(request.id)}>
              Liberar pro Disparo
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
