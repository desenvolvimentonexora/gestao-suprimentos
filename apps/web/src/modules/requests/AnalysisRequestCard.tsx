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
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="bg-bg">
                <tr className="text-ink">
                  <th className="border border-line px-3 py-2 font-semibold">Centro</th>
                  <th className="border border-line px-3 py-2 font-semibold">Insumo-Sub</th>
                  <th className="border border-line px-3 py-2 font-semibold">Sit</th>
                  <th className="border border-line px-3 py-2 font-semibold">Especificação</th>
                  <th className="border border-line px-3 py-2 font-semibold">Unid</th>
                  <th className="border border-line px-3 py-2 font-semibold">Qtd</th>
                  <th className="border border-line px-3 py-2 font-semibold">Solicitação</th>
                  <th className="border border-line px-3 py-2 font-semibold">Entrega SOL</th>
                  <th className="border border-line px-3 py-2 font-semibold">Data Solic.</th>
                  <th className="border border-line px-3 py-2 font-semibold">Data Aut.</th>
                  <th className="border border-line px-3 py-2 font-semibold">Dias</th>
                  <th className="border border-line px-3 py-2 font-semibold">Pendência</th>
                </tr>
              </thead>
              <tbody>
                {request.items.map((item, index) => (
                  <tr key={item.id} className="text-ink">
                    <td className="border border-line px-3 py-2">{request.unitName}</td>
                    <td className="border border-line px-3 py-2">
                      {item.materialCode ?? item.materialName}
                    </td>
                    <td className="border border-line px-3 py-2">{item.statusCode ?? '—'}</td>
                    <td className="border border-line px-3 py-2">{item.materialDescription ?? '—'}</td>
                    <td className="border border-line px-3 py-2">{item.unitOfMeasure ?? '—'}</td>
                    <td className="border border-line px-3 py-2">{item.quantity}</td>
                    <td className="border border-line px-3 py-2">{formatItemReference(displayNumber, index)}</td>
                    <td className="border border-line px-3 py-2">{request.neededBy ? formatDateOnly(request.neededBy) : '—'}</td>
                    <td className="border border-line px-3 py-2">{formatDate(request.createdAt)}</td>
                    <td className="border border-line px-3 py-2">{item.authorizedAt ? formatDateOnly(item.authorizedAt) : '—'}</td>
                    <td className="border border-line px-3 py-2">{urgency.tier === 'ag_aprovacao' ? '—' : urgency.label}</td>
                    <td className="border border-line px-3 py-2">
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

          {hasOpenPendency && (
            <p className="text-sm text-accent">
              Há item(ns) sinalizado(s) sem solução. Peça prorrogação e explique o que falta antes de liberar
              pro Disparo.
            </p>
          )}

          <div className="flex flex-wrap gap-2">
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
