import { useState } from 'react'
import { Folder } from 'lucide-react'
import { Badge, Button, Card, ComingSoonButton } from '../../components'
import { getDaysInNegotiation, isReadyToEqualize } from './negotiationStatus'
import type { NegotiatingRequestRow, NegotiatorOption, QuotationStatus } from './types'

const STATUS_LABELS: Record<QuotationStatus, string> = {
  pending: 'Pendente',
  received: 'Recebida',
  discarded: 'Descartada',
}

export interface NegotiatingRequestCardProps {
  request: NegotiatingRequestRow
  negotiators: NegotiatorOption[]
  today: Date
  onAssignNegotiator: (requestId: string, negotiatorId: string | null) => void
  onRegisterQuotation: (requestId: string) => void
  onDiscardQuotation: (quotationId: string) => void
  onUpdateNotes: (requestId: string, notes: string) => void
  onSendBackToDispatch: (requestId: string) => void
  onFinalizeNegotiation: (requestId: string) => void
}

function isOverdue(neededBy: string | null, today: Date): boolean {
  if (!neededBy) return false
  return neededBy < today.toISOString().slice(0, 10)
}

export function NegotiatingRequestCard({
  request,
  negotiators,
  today,
  onAssignNegotiator,
  onRegisterQuotation,
  onDiscardQuotation,
  onUpdateNotes,
  onSendBackToDispatch,
  onFinalizeNegotiation,
}: NegotiatingRequestCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [notesDraft, setNotesDraft] = useState(request.notes ?? '')

  const daysInNegotiation = getDaysInNegotiation(request.negotiatingStartedAt, today)
  const overdue = isOverdue(request.neededBy, today)

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex items-start gap-2">
          <Folder size={18} className="mt-1 text-ink-muted" aria-hidden="true" />
          <div>
            <p className="text-sm font-medium text-ink">
              <span>{request.externalRef ?? request.id}</span>
              <span className="ml-2 text-ink-muted">{request.unitName}</span>
            </p>
            <p className="text-xs text-ink-muted">
              Solicitada em {new Intl.DateTimeFormat('pt-BR').format(new Date(request.createdAt))}
              {request.neededBy &&
                ` · Entrega ${new Intl.DateTimeFormat('pt-BR').format(new Date(`${request.neededBy}T00:00:00`))}`}
              {overdue && <span className="font-medium text-red-600"> · Atrasada</span>}
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
            className="rounded border border-line bg-surface px-2 py-1 text-sm text-ink"
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
        {isReadyToEqualize(request) && <Badge>Só falta equalizar</Badge>}
        {daysInNegotiation !== null && <Badge>Em negociação há {daysInNegotiation} dias</Badge>}
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
          <ul className="text-sm text-ink-muted">
            {request.items.map((item) => (
              <li key={item.id}>
                {item.materialName} — {item.quantity} {item.unitOfMeasure ?? ''}
              </li>
            ))}
          </ul>

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
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
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
            <Button variant="secondary" onClick={() => onSendBackToDispatch(request.id)}>
              Voltar pro Disparo
            </Button>
            <Button onClick={() => onFinalizeNegotiation(request.id)}>Finalizar negociação</Button>
            <ComingSoonButton label="Liberar sem equalizar (itens A)" variant="secondary" />
          </div>
        </div>
      )}
    </Card>
  )
}
