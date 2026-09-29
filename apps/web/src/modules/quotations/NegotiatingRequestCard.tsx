import { useState } from 'react'
import { Clock, Folder, Heart, Search } from 'lucide-react'
import { Badge, Button, ComingSoonButton } from '../../components'
import { getDeadlineBadge } from './deadlineBadge'
import { formatItemReference } from './formatItemReference'
import { formatRequestNumber } from './formatRequestNumber'
import { NegotiatingNotesField } from './NegotiatingNotesField'
import {
  countReceivedQuotations,
  getDaysInNegotiation,
  isReadyToEqualize,
  MINIMUM_QUOTATIONS_TO_EQUALIZE,
} from './negotiationStatus'
import { getNegotiatorColor } from './negotiatorColor'
import type { NegotiatingRequestRow, NegotiatorOption } from './types'

const DEADLINE_BADGE_CLASSES: Record<'restante' | 'atrasada', string> = {
  restante: 'border-amber-200 bg-amber-50 text-amber-700',
  atrasada: 'border-red-200 bg-red-50 text-red-700',
}

// Mesmo tom do badge de prazo na borda lateral do card — mesmo padrão de
// apps/web/src/modules/requests/RequestCard.tsx (módulo não importa de
// módulo, então duplicado propositalmente).
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

export interface NegotiatingRequestCardProps {
  request: NegotiatingRequestRow
  negotiators: NegotiatorOption[]
  today: Date
  onAssignNegotiator: (requestId: string, negotiatorId: string | null) => void
  onUpdateNotes: (requestId: string, notes: string) => void
  onSendBackToDispatch: (requestId: string) => void
  onFinalizeNegotiation: (requestId: string) => void
  onOpenAttachments: (requestId: string) => void
}

export function NegotiatingRequestCard({
  request,
  negotiators,
  today,
  onAssignNegotiator,
  onUpdateNotes,
  onSendBackToDispatch,
  onFinalizeNegotiation,
  onOpenAttachments,
}: NegotiatingRequestCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const daysInNegotiation = getDaysInNegotiation(request.negotiatingStartedAt, today)
  const negotiatorColor = getNegotiatorColor(request.negotiatorId)
  const deadlineBadge = getDeadlineBadge(request.neededBy, today)
  const displayNumber = formatRequestNumber(request.externalRef, request.sequenceNumber)

  function toggleExpanded() {
    setIsExpanded((current) => !current)
  }

  return (
    <div
      data-testid={`negotiating-card-${request.id}`}
      className={`flex flex-col gap-3 rounded-lg border-y border-r border-l-4 p-3 border-line ${
        deadlineBadge ? DEADLINE_BORDER_CLASSES[deadlineBadge.tone] : 'border-l-line bg-surface'
      }`}
    >
      <div
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
        onClick={toggleExpanded}
        onKeyDown={(e) => {
          if (e.key !== 'Enter' && e.key !== ' ') return
          e.preventDefault()
          toggleExpanded()
        }}
        className="flex flex-wrap items-center gap-1.5 text-left"
      >
        <button
          type="button"
          aria-label={`Ver arquivos de ${displayNumber}`}
          onClick={(e) => {
            e.stopPropagation()
            onOpenAttachments(request.id)
          }}
          className="shrink-0 text-ink-muted hover:text-ink"
        >
          <Folder size={16} aria-hidden="true" />
        </button>

        <Heart size={14} className="shrink-0 text-ink-muted" aria-hidden="true" aria-label="Favorito" />

        <span className="shrink-0 whitespace-nowrap text-sm font-semibold text-ink">{displayNumber}</span>

        <select
          aria-label="Negociador"
          value={request.negotiatorId ?? ''}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => onAssignNegotiator(request.id, e.target.value || null)}
          className={`shrink-0 rounded border px-1 py-0.5 text-[11px] ${negotiatorColor.select}`}
        >
          <option value="">Sem resp.</option>
          {negotiators.map((negotiator) => (
            <option key={negotiator.id} value={negotiator.id}>
              {negotiator.name}
            </option>
          ))}
        </select>

        <span className="flex flex-wrap items-center gap-2">
          <span className="shrink-0 whitespace-nowrap text-[11px] text-ink-muted">{request.unitName}</span>

          <span className="shrink-0 whitespace-nowrap text-[11px] text-ink-muted">
            Solicitada em {formatDate(request.createdAt)}
          </span>

          {request.neededBy && (
            <span className="shrink-0 whitespace-nowrap text-[11px] text-ink-muted">
              Entrega {formatDateOnly(request.neededBy)}
            </span>
          )}

          {request.neededByChanged && (
            <span className="shrink-0 rounded border border-line px-1 py-0.5 text-[11px] text-ink-muted">
              ⚠ data alterada
            </span>
          )}
        </span>

        <span className="ml-auto flex flex-wrap items-center gap-2">
          {deadlineBadge && (
            <Badge className={`shrink-0 ${DEADLINE_BADGE_CLASSES[deadlineBadge.tone]}`}>
              {deadlineBadge.label}
            </Badge>
          )}
          {isReadyToEqualize(request) ? (
            <Badge className="shrink-0 gap-1 border-line bg-transparent text-ink">
              <Search size={12} aria-hidden="true" />
              Só falta equalizar
            </Badge>
          ) : (
            countReceivedQuotations(request) > 0 && (
              <Badge className="shrink-0 gap-1 border-line bg-transparent text-ink-muted">
                {countReceivedQuotations(request)}/{MINIMUM_QUOTATIONS_TO_EQUALIZE} cotações recebidas
              </Badge>
            )
          )}
          {daysInNegotiation !== null && (
            <Badge className="shrink-0 gap-1 border-amber-300 bg-amber-100 text-amber-800">
              <Clock size={12} aria-hidden="true" />
              Em negociação há {daysInNegotiation} dias
            </Badge>
          )}
          <span className="shrink-0 whitespace-nowrap text-[11px] text-ink-muted">
            {request.items.length} {request.items.length === 1 ? 'item' : 'itens'}
          </span>
        </span>
      </div>

      {isExpanded && (
        <div className="flex flex-col gap-3 border-t border-line pt-3">
          <div className="overflow-x-auto rounded-lg border border-line">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="bg-bg">
                <tr className="divide-x divide-ink-muted/20 border-b-2 border-ink-muted/30 text-ink">
                  <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wide">Centro</th>
                  <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wide">Insumo-Sub</th>
                  <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wide">Sit</th>
                  <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wide">Especificação</th>
                  <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wide">Unid</th>
                  <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wide">Qtd</th>
                  <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wide">Solicitação</th>
                  <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wide">Entrega SOL</th>
                  <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wide">Data Solic.</th>
                  <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wide">Data Aut.</th>
                  <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wide">Dias</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-muted/20">
                {request.items.map((item, index) => (
                  <tr key={item.id} className="divide-x divide-ink-muted/20 text-ink">
                    <td className="px-3 py-2">{request.unitName}</td>
                    <td className="px-3 py-2">
                      {item.materialCode ?? item.materialName}
                    </td>
                    <td className="px-3 py-2">{item.statusCode ?? '—'}</td>
                    <td className="px-3 py-2">{item.materialDescription ?? '—'}</td>
                    <td className="px-3 py-2">{item.unitOfMeasure ?? '—'}</td>
                    <td className="px-3 py-2">{item.quantity}</td>
                    <td className="px-3 py-2">{formatItemReference(displayNumber, index)}</td>
                    <td className="px-3 py-2">{request.neededBy ? formatDateOnly(request.neededBy) : '—'}</td>
                    <td className="px-3 py-2">{formatDate(request.createdAt)}</td>
                    <td className="px-3 py-2">{item.authorizedAt ? formatDateOnly(item.authorizedAt) : '—'}</td>
                    <td className="px-3 py-2">{deadlineBadge ? deadlineBadge.label.split(' ')[0] : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => onSendBackToDispatch(request.id)}>
              Voltar pro Disparo
            </Button>
            <Button onClick={() => onFinalizeNegotiation(request.id)}>Finalizar negociação</Button>
            <ComingSoonButton label="Liberar sem equalizar (itens A)" variant="accent" />
          </div>

          <NegotiatingNotesField
            requestId={request.id}
            initialValue={request.notes ?? ''}
            onSave={onUpdateNotes}
          />
        </div>
      )}
    </div>
  )
}
