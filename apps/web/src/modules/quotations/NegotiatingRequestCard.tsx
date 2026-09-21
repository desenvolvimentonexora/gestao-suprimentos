import { useState } from 'react'
import { Clock, Folder, Heart, Search } from 'lucide-react'
import { Badge, Button, Card, ComingSoonButton } from '../../components'
import { getDeadlineBadge } from './deadlineBadge'
import { formatItemReference } from './formatItemReference'
import { formatRequestNumber } from './formatRequestNumber'
import { getDaysInNegotiation, isReadyToEqualize } from './negotiationStatus'
import { getNegotiatorColor } from './negotiatorColor'
import type { NegotiatingRequestRow, NegotiatorOption, QuotationStatus } from './types'

const STATUS_LABELS: Record<QuotationStatus, string> = {
  pending: 'Pendente',
  received: 'Recebida',
  discarded: 'Descartada',
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

export interface NegotiatingRequestCardProps {
  request: NegotiatingRequestRow
  negotiators: NegotiatorOption[]
  today: Date
  onAssignNegotiator: (requestId: string, negotiatorId: string | null) => void
  onRegisterQuotation: (requestId: string) => void
  onDiscardQuotation: (quotationId: string) => void
  onViewPdf: (quotationId: string) => void
  onUpdateNotes: (requestId: string, notes: string) => void
  onSendBackToDispatch: (requestId: string) => void
  onFinalizeNegotiation: (requestId: string) => void
}

export function NegotiatingRequestCard({
  request,
  negotiators,
  today,
  onAssignNegotiator,
  onRegisterQuotation,
  onDiscardQuotation,
  onViewPdf,
  onUpdateNotes,
  onSendBackToDispatch,
  onFinalizeNegotiation,
}: NegotiatingRequestCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [notesDraft, setNotesDraft] = useState(request.notes ?? '')

  const daysInNegotiation = getDaysInNegotiation(request.negotiatingStartedAt, today)
  const negotiatorColor = getNegotiatorColor(request.negotiatorId)
  const deadlineBadge = getDeadlineBadge(request.neededBy, today)
  const overdue = deadlineBadge?.tone === 'atrasada'
  const displayNumber = formatRequestNumber(request.externalRef, request.sequenceNumber)

  return (
    <Card
      data-testid={`negotiating-card-${request.id}`}
      className={`flex flex-col gap-3 border-l-4 ${
        overdue ? 'border-line border-l-red-500 bg-red-50/60' : 'border-line border-l-line'
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex items-start gap-2">
          <Folder size={18} className="mt-1 text-ink-muted" aria-hidden="true" />
          <Heart size={16} className="mt-1 text-ink-muted" aria-hidden="true" aria-label="Favorito" />
          <div>
            <p className="text-sm font-medium text-ink">
              <span>{displayNumber}</span>
              <span className="ml-2 text-ink-muted">{request.unitName}</span>
            </p>
            <p className="text-xs text-ink-muted">
              Solicitada em {formatDate(request.createdAt)}
              {request.neededBy && ` · Entrega ${formatDateOnly(request.neededBy)}`}
              {request.neededByChanged && (
                <span className="ml-2 rounded border border-line px-1.5 py-0.5 text-xs text-ink-muted">
                  ⚠ data alterada
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-1">
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
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {deadlineBadge && (
          <Badge className={DEADLINE_BADGE_CLASSES[deadlineBadge.tone]}>{deadlineBadge.label}</Badge>
        )}
        {isReadyToEqualize(request) && (
          <Badge className="gap-1 border-line bg-transparent text-ink">
            <Search size={12} aria-hidden="true" />
            Só falta equalizar
          </Badge>
        )}
        {daysInNegotiation !== null && (
          <Badge className="gap-1 border-amber-300 bg-amber-100 text-amber-800">
            <Clock size={12} aria-hidden="true" />
            Em negociação há {daysInNegotiation} dias
          </Badge>
        )}
        <span className="text-xs text-ink-muted">
          {request.items.length} {request.items.length === 1 ? 'item' : 'itens'}
        </span>
      </div>

      <div className="flex gap-2">
        <Button onClick={() => onRegisterQuotation(request.id)}>Registrar cotação</Button>
        <Button variant="secondary" onClick={() => setIsExpanded((current) => !current)}>
          {isExpanded ? 'Recolher' : 'Expandir'}
        </Button>
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
                    <td className="py-1 pr-3">{deadlineBadge ? deadlineBadge.label.split(' ')[0] : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div>
            {request.quotations.length === 0 ? (
              <p className="text-sm text-ink-muted">Nenhuma cotação registrada ainda.</p>
            ) : (
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-ink-muted">
                    <th className="py-1 font-medium">Fornecedor</th>
                    <th className="py-1 font-medium">Status</th>
                    <th className="py-1 font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {request.quotations.map((quotation) => (
                    <tr key={quotation.id}>
                      <td className="py-1 text-ink">{quotation.supplierName}</td>
                      <td className="py-1">
                        <Badge>{STATUS_LABELS[quotation.status]}</Badge>
                      </td>
                      <td className="py-1">
                        <div className="flex gap-3">
                          <button
                            type="button"
                            aria-label={`Ver PDF de ${quotation.supplierName}`}
                            onClick={() => onViewPdf(quotation.id)}
                            className="text-ink-muted hover:text-ink"
                          >
                            Ver PDF
                          </button>
                          {quotation.status !== 'discarded' && (
                            <button
                              type="button"
                              aria-label={`Descartar cotação de ${quotation.supplierName}`}
                              onClick={() => onDiscardQuotation(quotation.id)}
                              className="text-ink-muted hover:text-accent"
                            >
                              Descartar
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

          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => onSendBackToDispatch(request.id)}>
              Voltar pro Disparo
            </Button>
            <Button onClick={() => onFinalizeNegotiation(request.id)}>Finalizar negociação</Button>
            <ComingSoonButton label="Liberar sem equalizar (itens A)" variant="accent" />
          </div>
        </div>
      )}
    </Card>
  )
}
