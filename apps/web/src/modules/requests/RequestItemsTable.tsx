import { formatItemReference } from './formatItemReference'
import type { RequestItemRow } from './types'

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('pt-BR').format(new Date(value))
}

function formatDateOnly(value: string): string {
  return new Intl.DateTimeFormat('pt-BR').format(new Date(`${value}T00:00:00`))
}

export interface RequestItemsTableProps {
  displayNumber: string
  unitName: string
  items: RequestItemRow[]
  neededBy: string | null
  createdAt: string
  /** Valor da coluna "Dias" — é por SOL, não por item, então o mesmo texto repete em toda linha. */
  diasValue: string
}

// Tabela de itens da SOL expandida — compartilhada entre Análise de
// Solicitações e Disparo de Solicitações (mesmas colunas nas duas telas,
// fidelidade visual com a referência da Ampla).
export function RequestItemsTable({
  displayNumber,
  unitName,
  items,
  neededBy,
  createdAt,
  diasValue,
}: RequestItemsTableProps) {
  return (
    <div className="overflow-x-auto rounded-lg border border-line">
      <table className="w-full border-collapse text-left text-sm">
        <thead className="bg-bg">
          <tr className="divide-x divide-ink-muted/20 border-b-2 border-ink-muted/30 text-ink">
            <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wide">Centro</th>
            <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wide">Insumo-Sub</th>
            <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wide">Sit</th>
            <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wide">Especificação</th>
            <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wide">Unid</th>
            <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wide">Qtd</th>
            <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wide">Solicitação</th>
            <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wide">Entrega SOL.</th>
            <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wide">Data Solic.</th>
            <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wide">Data Aut.</th>
            <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wide">Dias</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-ink-muted/20">
          {items.map((item, index) => (
            <tr key={item.id} className="divide-x divide-ink-muted/20 text-ink">
              <td className="px-3 py-2">{unitName}</td>
              <td className="px-3 py-2">{item.materialCode ?? item.materialName}</td>
              <td className="px-3 py-2">{item.statusCode ?? '—'}</td>
              <td className="px-3 py-2">{item.materialDescription ?? '—'}</td>
              <td className="px-3 py-2">{item.unitOfMeasure ?? '—'}</td>
              <td className="px-3 py-2">{item.quantity}</td>
              <td className="px-3 py-2">{formatItemReference(displayNumber, index)}</td>
              <td className="px-3 py-2">{neededBy ? formatDateOnly(neededBy) : '—'}</td>
              <td className="px-3 py-2">{formatDate(createdAt)}</td>
              <td className="px-3 py-2">{item.authorizedAt ? formatDateOnly(item.authorizedAt) : '—'}</td>
              <td className="px-3 py-2">{diasValue}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
