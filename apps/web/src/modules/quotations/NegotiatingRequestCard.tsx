import { useState } from 'react'
import { Clock, Folder, Heart, Search } from 'lucide-react'
import { Badge, Button, ComingSoonButton } from '../../components'
import { getDeadlineBadge } from './deadlineBadge'
import { formatItemReference } from './formatItemReference'
import { formatRequestNumber } from './formatRequestNumber'
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
  const [notesDraft, setNotesDraft] = useState(request.notes ?? '')

  const daysInNegotiation = getDaysInNegotiation(request.negotiatingStartedAt, today)
  const negotiatorColor = getNegotiatorColor(request.negotiatorId)
  const deadlineBadge = getDeadlineBadge(request.neededBy, today)
  const displayNumber = formatRequestNumber(request.externalRef, request.sequenceNumber)

  return (
    <div
      data-testid={`negotiating-card-${request.id}`}
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
            <Heart size={16} className="shrink-0 text-ink-muted" aria-hidden="true" aria-label="Favorito" />

            <span className="shrink-0 whitespace-nowrap font-semibold text-ink">{displayNumber}</span>

            <span className="shrink-0 whitespace-nowrap text-xs text-ink-muted">{request.unitName}</span>

            <span className="shrink-0 whitespace-nowrap text-xs text-ink-muted">
              Solicitada em {formatDate(request.createdAt)}
            </span>

            {request.neededBy && (
              <span className="shrink-0 whitespace-nowrap text-xs text-ink-muted">
                Entrega {formatDateOnly(request.neededBy)}
              </span>
            )}

            {request.neededByChanged && (
              <span className="shrink-0 rounded border border-line px-1.5 py-0.5 text-xs text-ink-muted">
                ⚠ data alterada
              </span>
            )}
          </span>

          <span className="flex flex-wrap items-center gap-2">
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
            <span className="shrink-0 whitespace-nowrap text-xs text-ink-muted">
              {request.items.length} {request.items.length === 1 ? 'item' : 'itens'}
            </span>
          </span>
        </button>
      </div>

      <div className="flex items-center justify-end gap-2">
        <label htmlFor={`negotiator-${request.id}`} className="text-xs text-ink-muted">
          Negociador
        </label>
        <select
          id={`negotiator-${request.id}`}
          value={request.negotiatorId ?? ''}
          onChange={(e) => onAssignNegotiator(request.id, e.target.value || null)}
          className={`rounded border px-2 py-1 text-sm ${negotiatorColor.select}`}
        >
          <option value="">Sem resp.</option>
          {negotiators.map((negotiator) => (
            <option key={negotiator.id} value={negotiator.id}>
              {negotiator.name}
            </option>
          ))}
        </select>
      </div>

      {isExpanded && (
        <div className="flex flex-col gap-3 border-t border-line pt-3">
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
                    <td className="py-1 pr-3">
                      {item.materialCode ?? item.materialName}
                    </td>
                    <td className="py-1 pr-3">{item.statusCode ?? '—'}</td>
                    <td className="py-1 pr-3">{item.materialDescription ?? '—'}</td>
                    <td className="py-1 pr-3">{item.unitOfMeasure ?? '—'}</td>
                    <td className="py-1 pr-3">{item.quantity}</td>
                    <td className="py-1 pr-3">{formatItemReference(displayNumber, index)}</td>
                    <td className="py-1 pr-3">{request.neededBy ? formatDateOnly(request.neededBy) : '—'}</td>
                    <td className="py-1 pr-3">{formatDate(request.createdAt)}</td>
                    <td className="py-1 pr-3">{item.authorizedAt ? formatDateOnly(item.authorizedAt) : '—'}</td>
                    <td className="py-1 pr-3">{deadlineBadge ? deadlineBadge.label.split(' ')[0] : '—'}</td>
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
        </div>
      )}
    </div>
  )
}
