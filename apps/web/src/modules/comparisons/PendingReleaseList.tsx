import { useState } from 'react'
import { ClipboardList, FileText, Receipt } from 'lucide-react'
import { Badge, Button, Card, ComingSoonButton } from '../../components'
import { formatCurrency, formatDateTime } from '../../lib/formatters'
import { formatSolNumber } from './formatSolNumber'
import type { PendingReleaseRow } from './types'

export interface PendingReleaseListProps {
  rows: PendingReleaseRow[]
  onConfirmPaymentProof: (comparisonId: string) => void
  onRelease: (comparisonId: string) => void
  onReject: (comparisonId: string, reason: string) => void
  onRequestFinancialCharge: (comparisonId: string) => void
  isSubmitting: boolean
}

export function PendingReleaseList({
  rows,
  onConfirmPaymentProof,
  onRelease,
  onReject,
  onRequestFinancialCharge,
  isSubmitting,
}: PendingReleaseListProps) {
  const [reasons, setReasons] = useState<Record<string, string>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})

  function handleReject(comparisonId: string) {
    const reason = (reasons[comparisonId] ?? '').trim()
    if (!reason) {
      setErrors((current) => ({ ...current, [comparisonId]: 'Informe o motivo.' }))
      return
    }
    setErrors((current) => ({ ...current, [comparisonId]: '' }))
    onReject(comparisonId, reason)
  }

  return (
    <div className="flex flex-col gap-4">
      <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
        <FileText size={14} aria-hidden="true" />
        {rows.length} aguardando liberação
      </span>

      <div className="flex items-center gap-1.5 text-xs font-semibold uppercase text-ink-muted">
        <ClipboardList size={14} aria-hidden="true" />
        Aguardando sua decisão · Liberar ou não liberar
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-ink-muted">Nenhuma comparação aprovada aguardando liberação.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {rows.map((row) => {
            const awaitingProof = !row.paymentProofConfirmedAt
            return (
              <Card
                key={row.comparisonId}
                className="flex flex-col gap-3 border-l-4 border-l-violet-500 sm:flex-row sm:items-start sm:justify-between"
              >
                <div className="flex flex-1 flex-col gap-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-ink">
                      {formatSolNumber(row.externalRef, row.sequenceNumber)}   {row.unitName}
                    </p>
                    {awaitingProof && (
                      <Badge className="gap-1 rounded-full border-none bg-amber-100 uppercase text-amber-800">
                        <Receipt size={12} aria-hidden="true" />
                        Aguardando comprovante
                      </Badge>
                    )}
                  </div>

                  {row.paymentConditionNote && <p className="text-sm text-ink-muted">{row.paymentConditionNote}</p>}

                  {row.submittedByName && row.submittedAt && (
                    <p className="text-xs text-ink-muted">
                      por {row.submittedByName} em {formatDateTime(new Date(row.submittedAt))}
                    </p>
                  )}

                  <p className="text-sm text-ink">
                    {formatCurrency(row.totalValue, 'BRL')} • {row.itemCount}{' '}
                    {row.itemCount === 1 ? 'item' : 'itens'} • {row.supplierCount}{' '}
                    {row.supplierCount === 1 ? 'fornecedor' : 'fornecedores'}
                  </p>

                  {row.approvedByName && row.approvedAt && (
                    <p className="text-sm text-emerald-700">
                      ✔ Aprovado por {row.approvedByName} em {formatDateTime(new Date(row.approvedAt))}
                    </p>
                  )}

                  {row.note && <p className="text-sm text-blue-700">💬 Obs.: {row.note}</p>}

                  {awaitingProof && (
                    <div className="flex flex-col gap-1 pt-1">
                      <label htmlFor={`release-reason-${row.comparisonId}`} className="text-xs text-ink-muted">
                        Motivo (obrigatório para não liberar)
                      </label>
                      <input
                        id={`release-reason-${row.comparisonId}`}
                        value={reasons[row.comparisonId] ?? ''}
                        onChange={(e) =>
                          setReasons((current) => ({ ...current, [row.comparisonId]: e.target.value }))
                        }
                        className="rounded border border-line bg-surface px-3 py-2 text-sm text-ink"
                      />
                      {errors[row.comparisonId] && <p className="text-xs text-accent">{errors[row.comparisonId]}</p>}
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <ComingSoonButton label="Ver" variant="info" />
                  {awaitingProof ? (
                    <>
                      <Button
                        variant="violet"
                        disabled={isSubmitting}
                        onClick={() => onConfirmPaymentProof(row.comparisonId)}
                      >
                        Confirmar comprovante
                      </Button>
                      <Button variant="warning" disabled={isSubmitting} onClick={() => handleReject(row.comparisonId)}>
                        Não liberar
                      </Button>
                      <Button
                        variant="violet"
                        disabled={isSubmitting}
                        onClick={() => onRequestFinancialCharge(row.comparisonId)}
                      >
                        Cobrar financeiro
                      </Button>
                    </>
                  ) : (
                    <Button disabled={isSubmitting} onClick={() => onRelease(row.comparisonId)}>
                      Liberar
                    </Button>
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
