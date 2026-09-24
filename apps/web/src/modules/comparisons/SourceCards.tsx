import { FileText, Plus } from 'lucide-react'
import { getSupplierColor } from './supplierColor'
import type { ComparisonQuotationRow } from './types'

export interface SourceCardsProps {
  itemCount: number
  quotations: ComparisonQuotationRow[]
  onAddQuotation: () => void
}

const SUPPLIER_SLOTS = 4

export function SourceCards({ itemCount, quotations, onAddQuotation }: SourceCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
      <div className="flex flex-col items-center gap-1 rounded-md border border-primary bg-primary/5 px-3 py-3 text-center">
        <FileText size={18} className="text-primary" />
        <span className="text-sm font-medium text-ink">Solicitações</span>
        <span className="text-xs text-ink-muted">{itemCount} itens</span>
      </div>

      {Array.from({ length: SUPPLIER_SLOTS }, (_, index) => {
        const quotation = quotations[index]
        if (quotation) {
          const color = getSupplierColor(quotation.quotationId)
          return (
            <div
              key={quotation.quotationId}
              className={`flex flex-col items-center gap-1 rounded-md border px-3 py-3 text-center ${color.header}`}
            >
              <FileText size={18} />
              <span className="text-sm font-medium">{quotation.supplierName}</span>
            </div>
          )
        }

        return (
          <button
            key={index}
            type="button"
            onClick={onAddQuotation}
            aria-label={`Fornecedor ${index + 1}`}
            className="flex flex-col items-center gap-1 rounded-md border border-dashed border-line px-3 py-3 text-center text-ink-muted hover:bg-bg"
          >
            <Plus size={18} />
            <span className="text-sm font-medium">Fornecedor {index + 1}</span>
          </button>
        )
      })}
    </div>
  )
}
