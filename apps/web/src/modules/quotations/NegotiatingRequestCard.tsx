import { Badge, Button, Card } from '../../components'
import type { NegotiatingRequestRow, QuotationStatus } from './types'

const STATUS_LABELS: Record<QuotationStatus, string> = {
  pending: 'Pendente',
  received: 'Recebida',
  discarded: 'Descartada',
}

export interface NegotiatingRequestCardProps {
  request: NegotiatingRequestRow
  onRegisterQuotation: (requestId: string) => void
  onDiscardQuotation: (quotationId: string) => void
}

export function NegotiatingRequestCard({
  request,
  onRegisterQuotation,
  onDiscardQuotation,
}: NegotiatingRequestCardProps) {
  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-ink">{request.unitName}</p>
          <p className="text-xs text-ink-muted">
            <span>{request.externalRef ?? '—'}</span>
            {request.neededBy && (
              <span>
                {' '}
                · Prazo: {new Intl.DateTimeFormat('pt-BR').format(new Date(`${request.neededBy}T00:00:00`))}
              </span>
            )}
          </p>
        </div>
        <Button onClick={() => onRegisterQuotation(request.id)}>Registrar cotação</Button>
      </div>

      <ul className="text-sm text-ink-muted">
        {request.items.map((item) => (
          <li key={item.id}>
            {item.materialName} — {item.quantity} {item.unitOfMeasure ?? ''}
          </li>
        ))}
      </ul>

      <div className="border-t border-line pt-3">
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
    </Card>
  )
}
