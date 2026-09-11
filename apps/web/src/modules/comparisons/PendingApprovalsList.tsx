import { useState } from 'react'
import { Button, Card } from '../../components'
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

  if (rows.length === 0) return null

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
    <div className="mt-6 flex flex-col gap-3">
      <h2 className="text-lg font-semibold text-ink">Aprovações pendentes</h2>
      {rows.map((row) => (
        <Card key={row.comparisonId} className="flex flex-col gap-2">
          <div>
            <p className="text-sm font-medium text-ink">{row.unitName}</p>
            <p className="text-xs text-ink-muted">{row.externalRef ?? '—'}</p>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor={`reject-reason-${row.comparisonId}`} className="text-xs text-ink-muted">
              Motivo da rejeição (obrigatório para rejeitar)
            </label>
            <input
              id={`reject-reason-${row.comparisonId}`}
              value={reasons[row.comparisonId] ?? ''}
              onChange={(e) =>
                setReasons((current) => ({ ...current, [row.comparisonId]: e.target.value }))
              }
              className="rounded border border-line bg-surface px-3 py-2 text-sm text-ink"
            />
            {errors[row.comparisonId] && (
              <p className="text-xs text-accent">{errors[row.comparisonId]}</p>
            )}
          </div>

          <div className="flex gap-2">
            <Button disabled={isSubmitting} onClick={() => onApprove(row.comparisonId)}>
              Aprovar
            </Button>
            <Button
              variant="secondary"
              disabled={isSubmitting}
              onClick={() => handleReject(row.comparisonId)}
            >
              Rejeitar
            </Button>
          </div>
        </Card>
      ))}
    </div>
  )
}
