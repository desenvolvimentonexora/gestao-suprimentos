import { useState } from 'react'
import { Button } from '../../components'
import type { ComparisonRequestItemRow, ExtractedItemReview } from './types'

export interface ExtractedItemsReviewProps {
  items: ExtractedItemReview[]
  requestItems: ComparisonRequestItemRow[]
  onConfirm: (items: ExtractedItemReview[]) => void
  onCancel: () => void
  isSubmitting: boolean
}

export function ExtractedItemsReview({
  items,
  requestItems,
  onConfirm,
  onCancel,
  isSubmitting,
}: ExtractedItemsReviewProps) {
  const [rows, setRows] = useState(items)
  const [error, setError] = useState<string | null>(null)

  function updateRow(index: number, updates: Partial<ExtractedItemReview>) {
    setRows((current) => current.map((row, i) => (i === index ? { ...row, ...updates } : row)))
  }

  function handleConfirm() {
    if (rows.some((row) => !row.requestItemId)) {
      setError('Selecione o item do sistema para todas as linhas.')
      return
    }
    setError(null)
    onConfirm(rows)
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-ink-muted">
        Confira os itens extraídos do PDF. Corrija o item, o preço ou o prazo se a IA errou.
      </p>

      {rows.map((row, index) => (
        <div key={index} className="flex items-end gap-2 border-b border-line pb-2">
          <div className="flex-1">
            <p className="text-sm text-ink">{row.description}</p>
            <p className="text-xs text-ink-muted">
              Confiança: {Math.round(row.confidence * 100)}%
            </p>
          </div>

          <div className="flex w-40 flex-col gap-1">
            <label htmlFor={`review-item-${index}`} className="text-xs text-ink-muted">
              Item do sistema
            </label>
            <select
              id={`review-item-${index}`}
              value={row.requestItemId ?? ''}
              onChange={(e) => updateRow(index, { requestItemId: e.target.value || null })}
              className="rounded border border-line bg-surface px-2 py-1 text-sm text-ink"
            >
              <option value="">Selecione…</option>
              {requestItems.map((requestItem) => (
                <option key={requestItem.id} value={requestItem.id}>
                  {requestItem.materialName}
                </option>
              ))}
            </select>
          </div>

          <div className="flex w-28 flex-col gap-1">
            <label htmlFor={`review-price-${index}`} className="text-xs text-ink-muted">
              Preço unitário
            </label>
            <input
              id={`review-price-${index}`}
              type="number"
              step="any"
              value={row.unitPrice}
              onChange={(e) => updateRow(index, { unitPrice: Number(e.target.value) })}
              className="rounded border border-line bg-surface px-2 py-1 text-sm text-ink"
            />
          </div>

          <div className="flex w-24 flex-col gap-1">
            <label htmlFor={`review-lead-time-${index}`} className="text-xs text-ink-muted">
              Prazo (dias)
            </label>
            <input
              id={`review-lead-time-${index}`}
              type="number"
              value={row.leadTimeDays ?? ''}
              onChange={(e) =>
                updateRow(index, { leadTimeDays: e.target.value ? Number(e.target.value) : null })
              }
              className="rounded border border-line bg-surface px-2 py-1 text-sm text-ink"
            />
          </div>
        </div>
      ))}

      {error && <p className="text-xs text-accent">{error}</p>}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="button" onClick={handleConfirm} disabled={isSubmitting}>
          Confirmar itens
        </Button>
      </div>
    </div>
  )
}
