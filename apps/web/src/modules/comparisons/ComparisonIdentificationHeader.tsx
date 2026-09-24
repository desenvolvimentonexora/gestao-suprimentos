import { formatDate } from '../../lib/formatters'
import { formatSolNumber } from './formatSolNumber'

export interface ComparisonIdentificationHeaderProps {
  logoUrl: string | undefined
  brandName: string | undefined
  externalRef: string | null
  sequenceNumber: number | null
  unitName: string
  createdByName: string | null
  createdAt: string | null
}

export function ComparisonIdentificationHeader({
  logoUrl,
  brandName,
  externalRef,
  sequenceNumber,
  unitName,
  createdByName,
  createdAt,
}: ComparisonIdentificationHeaderProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-md border border-line bg-surface px-4 py-3">
      <div className="flex items-center gap-3">
        {logoUrl && <img src={logoUrl} alt={brandName ?? ''} className="h-6" />}
        <div className="flex flex-col">
          <span className="text-xs uppercase tracking-wide text-ink-muted">Solicitação</span>
          <span className="text-sm font-semibold text-ink">
            Nº {formatSolNumber(externalRef, sequenceNumber)}
          </span>
        </div>
      </div>

      <div className="flex flex-col items-center text-center">
        <span className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
          Equalização de Orçamentos
        </span>
        <span className="text-sm font-semibold text-ink">{unitName}</span>
      </div>

      <div className="flex flex-col items-end text-right text-xs text-ink-muted">
        <span className="uppercase tracking-wide">Equalizado por</span>
        <span className="text-sm font-semibold text-ink">{createdByName ?? '—'}</span>
        {createdAt && <span>{formatDate(new Date(createdAt))}</span>}
      </div>
    </div>
  )
}
