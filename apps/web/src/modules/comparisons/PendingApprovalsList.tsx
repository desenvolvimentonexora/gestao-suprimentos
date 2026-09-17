import { useState } from 'react'
import { ClipboardList, FileText } from 'lucide-react'
import { Button, Card, ComingSoonButton } from '../../components'
import { formatCurrency, formatDateTime } from '../../lib/formatters'
import { formatSolNumber } from './formatSolNumber'
import type { PendingApprovalRow } from './types'

export interface PendingApprovalsListProps {
  rows: PendingApprovalRow[]
  onApprove: (comparisonId: string) => void
  onReject: (comparisonId: string, reason: string) => void
  isSubmitting: boolean
}

export function PendingApprovalsList({ rows, onApprove, onReject, isSubmitting }: PendingApprovalsListProps) {
  const [reasons, setReasons] = useState<Record<string, string>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})

  function handleReject(comparisonId: string) {
    const reason = (reasons[comparisonId] ?? '').trim()
    if (!reason) {
      setErrors((current) => ({ ...current, [comparisonId]: 'Informe o motivo da rejeição.' }))
      return
    }
    setErrors((current) => ({ ...current, [comparisonId]: '' }))
    onReject(comparisonId, reason)
  }

  return (
    <div className="flex flex-col gap-4">
      <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-sm font-medium text-amber-800">
        <FileText size={14} aria-hidden="true" />
        {rows.length} aguardando aprovação
      </span>

      <div className="flex items-center gap-1.5 text-xs font-semibold uppercase text-ink-muted">
        <ClipboardList size={14} aria-hidden="true" />
        Aguardando sua decisão · Aprovar ou rejeitar
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-ink-muted">Nenhuma comparação aguardando aprovação.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {rows.map((row) => (
            <Card
              key={row.comparisonId}
              className="flex flex-col gap-3 border-l-4 border-l-amber-500 sm:flex-row sm:items-start sm:justify-between"
            >
              <div className="flex flex-1 flex-col gap-1">
                <p className="font-semibold text-ink">
                  {formatSolNumber(row.externalRef, row.sequenceNumber)}   {row.unitName}
                </p>

                {row.paymentConditionNote && <p className="text-sm text-ink-muted">{row.paymentConditionNote}</p>}

                {row.submittedByName && row.submittedAt && (
                  <p className="text-xs text-ink-muted">
                    por {row.submittedByName} em {formatDateTime(new Date(row.submittedAt))}
                  </p>
                )}

                <p className="text-sm text-ink">
                  {formatCurrency(row.totalValue, 'BRL')} • {row.itemCount} {row.itemCount === 1 ? 'item' : 'itens'} •{' '}
                  {row.supplierCount} {row.supplierCount === 1 ? 'fornecedor' : 'fornecedores'}
                </p>

                {row.note && <p className="text-sm text-blue-700">💬 Obs.: {row.note}</p>}

                <div className="flex flex-col gap-1 pt-1">
                  <label htmlFor={`reject-reason-${row.comparisonId}`} className="text-xs text-ink-muted">
                    Motivo da rejeição (obrigatório para rejeitar)
                  </label>
                  <input
                    id={`reject-reason-${row.comparisonId}`}
                    value={reasons[row.comparisonId] ?? ''}
                    onChange={(e) => setReasons((current) => ({ ...current, [row.comparisonId]: e.target.value }))}
                    className="rounded border border-line bg-surface px-3 py-2 text-sm text-ink"
                  />
                  {errors[row.comparisonId] && <p className="text-xs text-accent">{errors[row.comparisonId]}</p>}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <ComingSoonButton label="Ver" variant="info" />
                <Button disabled={isSubmitting} onClick={() => onApprove(row.comparisonId)}>
                  Aprovar
                </Button>
                <Button variant="warning" disabled={isSubmitting} onClick={() => handleReject(row.comparisonId)}>
                  Rejeitar
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
