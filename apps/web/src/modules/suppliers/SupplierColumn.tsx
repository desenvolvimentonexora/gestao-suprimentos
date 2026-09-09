import { Button } from '../../components'
import { SupplierCard, type SupplierPopupKind } from './SupplierCard'
import type { SupplierRow } from './types'

export interface SupplierColumnProps {
  materialName: string | null
  suppliers: SupplierRow[]
  totalCount: number
  page: number
  pageSize: number
  onPageChange: (page: number) => void
  search: string
  onSearchChange: (value: string) => void
  typeFilter: string | null
  onTypeFilterChange: (value: string | null) => void
  availableTypes: string[]
  onRequestQuote: () => void
  onAddSupplier: () => void
  favoriteIds: Set<string>
  onToggleFavorite: (supplierId: string) => void
  onOpenPopup: (kind: SupplierPopupKind, supplierId: string) => void
  onEditSupplier: (supplierId: string) => void
  onDeleteSupplier: (supplierId: string) => void
}

export function SupplierColumn({
  materialName,
  suppliers,
  totalCount,
  page,
  pageSize,
  onPageChange,
  search,
  onSearchChange,
  typeFilter,
  onTypeFilterChange,
  availableTypes,
  onRequestQuote,
  onAddSupplier,
  favoriteIds,
  onToggleFavorite,
  onOpenPopup,
  onEditSupplier,
  onDeleteSupplier,
}: SupplierColumnProps) {
  if (!materialName) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-ink-muted">
        Selecione um material para ver os fornecedores.
      </div>
    )
  }

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-ink">{materialName}</h2>
          <p className="text-sm text-ink-muted">
            {totalCount} {totalCount === 1 ? 'fornecedor' : 'fornecedores'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={onRequestQuote}>
            📋 Pedir Orçamento
          </Button>
          <Button onClick={onAddSupplier}>+ Adicionar Fornecedor</Button>
        </div>
      </div>

      <div className="flex gap-2">
        <input
          type="search"
          placeholder="Buscar fornecedor"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="flex-1 rounded border border-line bg-surface px-3 py-2 text-sm text-ink"
        />
        <select
          aria-label="Filtrar por tipo"
          value={typeFilter ?? ''}
          onChange={(e) => onTypeFilterChange(e.target.value || null)}
          className="rounded border border-line bg-surface px-3 py-2 text-sm text-ink"
        >
          <option value="">Todos os tipos</option>
          {availableTypes.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>

      {suppliers.length === 0 ? (
        <p className="text-sm text-ink-muted">
          Nenhum fornecedor cadastrado para este material ainda. Adicione o primeiro.
        </p>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {suppliers.map((supplier) => (
              <SupplierCard
                key={supplier.id}
                supplier={supplier}
                isFavorite={favoriteIds.has(supplier.id)}
                onToggleFavorite={onToggleFavorite}
                onOpenPopup={onOpenPopup}
                onEdit={onEditSupplier}
                onDelete={onDeleteSupplier}
              />
            ))}
          </div>

          <div className="flex items-center justify-between">
            <Button
              variant="secondary"
              disabled={page === 0}
              onClick={() => onPageChange(page - 1)}
            >
              Anterior
            </Button>
            <span className="text-sm text-ink-muted">
              Página {page + 1} de {totalPages}
            </span>
            <Button
              variant="secondary"
              disabled={page + 1 >= totalPages}
              onClick={() => onPageChange(page + 1)}
            >
              Próxima
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
