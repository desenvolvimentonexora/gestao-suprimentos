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
  onToggleItemPendency: (itemId: string, pendente: boolean, motivo: string | null) => void
  onUpdateNotes: (requestId: string, notes: string) => void
  onDeleteRequest: (request: RequestRow) => void
  onOpenClarificationModal: (requestId: string) => void
  onOpenExtensionModal: (requestId: string) => void
  onReleaseToDispatch: (requestId: string) => void
}

export function AnalysisRequestCard({
  request,
  today,
  canAnalyze,
  onToggleItemPendency,
  onUpdateNotes,
  onDeleteRequest,
  onOpenClarificationModal,
  onOpenExtensionModal,
  onReleaseToDispatch,
}: AnalysisRequestCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [notesDraft, setNotesDraft] = useState(request.notes ?? '')
  const [motivoDrafts, setMotivoDrafts] = useState<Record<string, string>>({})

  const urgency = getUrgencyTier(request.neededBy, today)
  const displayNumber = formatRequestNumber(request.externalRef, request.sequenceNumber)
  const hasOpenPendency = request.items.some((item) => item.pendente)

  function motivoFor(itemId: string, fallback: string | null): string {
    return motivoDrafts[itemId] ?? fallback ?? ''
  }

  return (
    <div
      data-testid={`analysis-card-${request.id}`}
      className="flex flex-col gap-3 rounded border border-line bg-surface p-4"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <button
          type="button"
          aria-expanded={isExpanded}
          onClick={() => setIsExpanded((current) => !current)}
          className="flex flex-1 flex-wrap items-center gap-4 text-left"
        >
          <div className="flex min-w-[10rem] flex-1 flex-col">
            <span className="font-semibold text-ink">{displayNumber}</span>
            <span className="flex items-center gap-1 text-xs text-ink-muted">
              <MapPin size={14} aria-hidden="true" />
              {request.unitName}
            </span>
          </div>

          <span className="flex items-center gap-1 text-xs text-ink-muted">
            <CalendarDays size={14} aria-hidden="true" />
            Solicitada em {formatDate(request.createdAt)}
          </span>

          {request.neededBy && (
            <span className="flex items-center gap-1 text-xs text-ink-muted">
              <Truck size={14} aria-hidden="true" />
              Entrega {formatDateOnly(request.neededBy)}
            </span>
          )}

          <Badge className={TIER_BADGE_CLASSES[urgency.tier]}>{urgency.label}</Badge>

          <span className="text-xs text-ink-muted">
            {request.items.length} {request.items.length === 1 ? 'item' : 'itens'}
          </span>
        </button>

        <button
          type="button"
          aria-label={`Excluir requisição de ${request.unitName}`}
          onClick={() => onDeleteRequest(request)}
          className="text-ink-muted hover:text-accent"
        >
          <Trash2 size={16} aria-hidden="true" />
        </button>
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
                  <th className="py-1 pr-3 font-medium">Pendência</th>
                </tr>
              </thead>
              <tbody>
                {request.items.map((item, index) => (
                  <tr key={item.id} className="text-ink">
                    <td className="py-1 pr-3">{request.unitName}</td>
                    <td className="py-1 pr-3">
                      {item.materialCode ? `${item.materialCode} · ${item.materialName}` : item.materialName}
                    </td>
                    <td className="py-1 pr-3">{item.statusCode ?? '—'}</td>
                    <td className="py-1 pr-3">{item.materialDescription ?? '—'}</td>
                    <td className="py-1 pr-3">{item.unitOfMeasure ?? '—'}</td>
                    <td className="py-1 pr-3">{item.quantity}</td>
                    <td className="py-1 pr-3">{formatItemReference(displayNumber, index)}</td>
                    <td className="py-1 pr-3">{request.neededBy ? formatDateOnly(request.neededBy) : '—'}</td>
                    <td className="py-1 pr-3">{formatDate(request.createdAt)}</td>
                    <td className="py-1 pr-3">{item.authorizedAt ? formatDateOnly(item.authorizedAt) : '—'}</td>
                    <td className="py-1 pr-3">{urgency.tier === 'ag_aprovacao' ? '—' : urgency.label}</td>
                    <td className="py-1 pr-3">
                      <div className="flex flex-col gap-1">
                        <button
                          type="button"
                          aria-pressed={item.pendente}
                          disabled={!canAnalyze}
                          onClick={() =>
                            onToggleItemPendency(
                              item.id,
                              !item.pendente,
                              item.pendente ? null : motivoFor(item.id, item.motivoPendencia),
                            )
                          }
                          className={`rounded border px-2 py-1 text-xs ${
                            item.pendente
                              ? 'border-accent bg-amber-50 text-accent'
                              : 'border-line text-ink-muted hover:text-ink'
                          }`}
                        >
                          {item.pendente ? '⚠ Pendente' : 'Sinalizar pendência'}
                        </button>
                        {item.pendente && (
                          <input
                            type="text"
                            aria-label={`O que falta em ${item.materialName}`}
                            placeholder="O que falta informar?"
                            value={motivoFor(item.id, item.motivoPendencia)}
                            onChange={(e) =>
                              setMotivoDrafts((current) => ({ ...current, [item.id]: e.target.value }))
                            }
                            onBlur={(e) => onToggleItemPendency(item.id, true, e.target.value)}
                            className="rounded border border-line bg-surface px-2 py-1 text-xs text-ink"
                          />
                        )}
                      </div>
                    </td>
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

          {hasOpenPendency && (
            <p className="text-sm text-accent">
              Há item(ns) sinalizado(s) sem solução. Peça esclarecimento ao engenheiro antes de liberar pro
              Disparo.
            </p>
          )}

          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              disabled={!hasOpenPendency || !canAnalyze}
              onClick={() => onOpenClarificationModal(request.id)}
            >
              Solicitar esclarecimento
            </Button>
            <Button
              variant="secondary"
              disabled={!canAnalyze}
              onClick={() => onOpenExtensionModal(request.id)}
            >
              Pedir prorrogação
            </Button>
            <Button
              disabled={hasOpenPendency || !canAnalyze}
              onClick={() => onReleaseToDispatch(request.id)}
            >
              Liberar pro Disparo
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
