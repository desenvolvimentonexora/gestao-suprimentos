import { Badge, Card } from '../../components'
import type { ComparisonStatus, HistoryRow } from './types'

const STATUS_LABELS: Partial<Record<ComparisonStatus, string>> = {
  released: 'Liberada',
  rejected: 'Rejeitada',
}

export interface HistoryListProps {
  rows: HistoryRow[]
}

export function HistoryList({ rows }: HistoryListProps) {
  if (rows.length === 0) {
    return <p className="text-sm text-ink-muted">Nenhuma comparação no histórico ainda.</p>
  }

  return (
    <div className="flex flex-col gap-3">
      {rows.map((row) => (
        <Card key={row.comparisonId} className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-ink">{row.unitName}</p>
            <Badge>{STATUS_LABELS[row.status] ?? row.status}</Badge>
          </div>
          <p className="text-xs text-ink-muted">{row.externalRef ?? '—'}</p>
          {row.rejectionReason && <p className="text-xs text-ink-muted">{row.rejectionReason}</p>}
        </Card>
      ))}
    </div>
  )
}
