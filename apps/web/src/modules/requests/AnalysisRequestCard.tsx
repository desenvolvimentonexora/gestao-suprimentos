import { useState } from 'react'
import { CalendarDays, MapPin, Trash2, Truck } from 'lucide-react'
import { Badge, Button } from '../../components'
import { formatItemReference } from './formatItemReference'
import { formatRequestNumber } from './formatRequestNumber'
import { getUrgencyTier } from './getUrgencyTier'
import type { RequestRow } from './types'

const TIER_BADGE_CLASSES = {
  urgente: 'border-red-200 bg-red-50 text-red-700',
  atencao: 'border-orange-200 bg-orange-50 text-orange-700',
  tranquila: 'border-green-200 bg-green-50 text-green-700',
  ag_aprovacao: 'border-line bg-bg text-ink-muted',
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
  const [notesDraft, setNotesDraft] = useState(request.notes ?? '')

  const urgency = getUrgencyTier(request.neededBy, today)
  const displayNumber = formatRequestNumber(request.externalRef, request.sequenceNumber)

  return (
    <div
      data-testid={`analysis-card-${request.id}`}
      className="flex flex-col gap-3 rounded-lg border border-line bg-surface p-4"
    >
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-expanded={isExpanded}
          onClick={() => setIsExpanded((current) => !current)}
          className="flex flex-1 items-center gap-4 overflow-x-auto text-left"
        >
          <div className="flex shrink-0 flex-col whitespace-nowrap">
            <span className="font-semibold text-ink">{displayNumber}</span>
            <span className="flex items-center gap-1 text-xs text-ink-muted">
              <MapPin size={14} aria-hidden="true" />
              {request.unitName}
            </span>
          </div>

          <span className="flex shrink-0 items-center gap-1 whitespace-nowrap text-xs text-ink-muted">
            <CalendarDays size={14} aria-hidden="true" />
            Solicitada em {formatDate(request.createdAt)}
          </span>

          {request.neededBy && (
            <span className="flex shrink-0 items-center gap-1 whitespace-nowrap text-xs text-ink-muted">
              <Truck size={14} aria-hidden="true" />
              Entrega {formatDateOnly(request.neededBy)}
            </span>
          )}

          <Badge className={`shrink-0 ${TIER_BADGE_CLASSES[urgency.tier]}`}>{urgency.label}</Badge>

          <span className="shrink-0 whitespace-nowrap text-xs text-ink-muted">
            {request.items.length} {request.items.length === 1 ? 'item' : 'itens'}
          </span>
        </button>

        <button
          type="button"
          aria-label={`Excluir requisição de ${request.unitName}`}
          onClick={() => onDeleteRequest(request)}
          className="shrink-0 text-ink-muted hover:text-accent"
        >
          <Trash2 size={16} aria-hidden="true" />
        </button>
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
                  <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wide">Entrega SOL.</th>
                  <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wide">Data Solic.</th>
                  <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wide">Data Aut.</th>
                  <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wide">Dias</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-muted/20">
                {request.items.map((item, index) => (
                  <tr key={item.id} className="divide-x divide-ink-muted/20 text-ink">
                    <td className="px-3 py-2">{request.unitName}</td>
                    <td className="px-3 py-2">{item.materialCode ?? item.materialName}</td>
                    <td className="px-3 py-2">{item.statusCode ?? '—'}</td>
                    <td className="px-3 py-2">{item.materialDescription ?? '—'}</td>
                    <td className="px-3 py-2">{item.unitOfMeasure ?? '—'}</td>
                    <td className="px-3 py-2">{item.quantity}</td>
                    <td className="px-3 py-2">{formatItemReference(displayNumber, index)}</td>
                    <td className="px-3 py-2">{request.neededBy ? formatDateOnly(request.neededBy) : '—'}</td>
                    <td className="px-3 py-2">{formatDate(request.createdAt)}</td>
                    <td className="px-3 py-2">{item.authorizedAt ? formatDateOnly(item.authorizedAt) : '—'}</td>
                    <td className="px-3 py-2">{urgency.tier === 'ag_aprovacao' ? '—' : urgency.label}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <label
                htmlFor={`notes-${request.id}`}
                className="text-xs font-medium uppercase tracking-wide text-ink-muted"
              >
                Observações
              </label>
              <span className="text-xs text-ink-muted">Ficam registradas até a SOL ser aprovada.</span>
            </div>
            <textarea
              id={`notes-${request.id}`}
              value={notesDraft}
              onChange={(e) => setNotesDraft(e.target.value)}
              onBlur={() => onUpdateNotes(request.id, notesDraft)}
              className="rounded border border-line bg-surface px-3 py-2 text-sm text-ink"
            />
          </div>

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
