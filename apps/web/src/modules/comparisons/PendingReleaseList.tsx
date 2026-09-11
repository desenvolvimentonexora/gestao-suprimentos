import { useState } from 'react'
import { Button, Card } from '../../components'
import type { PendingReleaseRow } from './types'

export interface PendingReleaseListProps {
  rows: PendingReleaseRow[]
  onRelease: (comparisonId: string, paymentConditionNote: string) => void
  onReject: (comparisonId: string, reason: string) => void
  onRequestFinancialCharge: (comparisonId: string) => void
  isSubmitting: boolean
}

export function PendingReleaseList({
  rows,
  onRelease,
  onReject,
  onRequestFinancialCharge,
  isSubmitting,
}: PendingReleaseListProps) {
  const [paymentNotes, setPaymentNotes] = useState<Record<string, string>>({})
  const [reasons, setReasons] = useState<Record<string, string>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})

  if (rows.length === 0) return null

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
    <div className="mt-6 flex flex-col gap-3">
      <h2 className="text-lg font-semibold text-ink">Fila de Alterações</h2>
      {rows.map((row) => (
        <Card key={row.comparisonId} className="flex flex-col gap-2">
          <div>
            <p className="text-sm font-medium text-ink">{row.unitName}</p>
            <p className="text-xs text-ink-muted">{row.externalRef ?? '—'}</p>
          </div>

          <label className="flex items-center gap-2 text-sm text-ink">
            <input
              type="checkbox"
              onChange={() => onRequestFinancialCharge(row.comparisonId)}
            />
            Cobrar financeiro
          </label>

          <div className="flex flex-col gap-1">
            <label htmlFor={`payment-note-${row.comparisonId}`} className="text-xs text-ink-muted">
              Condição de pagamento
            </label>
            <input
              id={`payment-note-${row.comparisonId}`}
              value={paymentNotes[row.comparisonId] ?? ''}
              onChange={(e) =>
                setPaymentNotes((current) => ({ ...current, [row.comparisonId]: e.target.value }))
              }
              className="rounded border border-line bg-surface px-3 py-2 text-sm text-ink"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor={`release-reason-${row.comparisonId}`} className="text-xs text-ink-muted">
              Motivo (obrigatório para não liberar)
            </label>
            <input
              id={`release-reason-${row.comparisonId}`}
              value={reasons[row.comparisonId] ?? ''}
              onChange={(e) => setReasons((current) => ({ ...current, [row.comparisonId]: e.target.value }))}
              className="rounded border border-line bg-surface px-3 py-2 text-sm text-ink"
            />
            {errors[row.comparisonId] && <p className="text-xs text-accent">{errors[row.comparisonId]}</p>}
          </div>

          <div className="flex gap-2">
            <Button
              disabled={isSubmitting}
              onClick={() => onRelease(row.comparisonId, paymentNotes[row.comparisonId] ?? '')}
            >
              Liberar
            </Button>
            <Button variant="secondary" disabled={isSubmitting} onClick={() => handleReject(row.comparisonId)}>
              Não liberar
            </Button>
          </div>
        </Card>
      ))}
    </div>
  )
}
