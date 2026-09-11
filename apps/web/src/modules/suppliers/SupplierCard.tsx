import { Award, Clock, Package, Star } from 'lucide-react'
import { Badge, Button, ComingSoonButton } from '../../components'
import type { SupplierRow } from './types'

export type SupplierPopupKind = 'certificados' | 'prazo' | 'materiais' | 'avaliacoes'

export interface SupplierCardProps {
  supplier: SupplierRow
  isFavorite: boolean
  onToggleFavorite: (supplierId: string) => void
  onOpenPopup: (kind: SupplierPopupKind, supplierId: string) => void
  onEdit: (supplierId: string) => void
  onDelete: (supplierId: string) => void
}

const INDICATORS: { kind: SupplierPopupKind; label: string; icon: typeof Award }[] = [
  { kind: 'certificados', label: 'Certificados', icon: Award },
  { kind: 'prazo', label: 'Prazo', icon: Clock },
  { kind: 'materiais', label: 'Materiais', icon: Package },
  { kind: 'avaliacoes', label: 'Avaliações', icon: Star },
]

export function SupplierCard({
  supplier,
  isFavorite,
  onToggleFavorite,
  onOpenPopup,
  onEdit,
  onDelete,
}: SupplierCardProps) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-bg text-sm font-semibold text-ink">
            {supplier.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-ink">{supplier.name}</p>
            <p className="text-sm text-ink-muted">{supplier.city}</p>
          </div>
        </div>
        <button
          type="button"
          aria-label={isFavorite ? 'Remover dos favoritos' : 'Marcar como favorito'}
          onClick={() => onToggleFavorite(supplier.id)}
          className="text-ink-muted hover:text-accent"
        >
          <Star size={18} fill={isFavorite ? 'currentColor' : 'none'} aria-hidden="true" />
        </button>
      </div>

      <div className="flex items-center gap-2">
        {supplier.type && <Badge>{supplier.type}</Badge>}
        <Badge>{supplier.status === 'active' ? 'Ativo' : 'Inativo'}</Badge>
      </div>

      {supplier.mainContact && (
        <div className="text-sm text-ink-muted">
          <p className="text-ink">{supplier.mainContact.name}</p>
          {supplier.mainContact.phone && <p>{supplier.mainContact.phone}</p>}
          {supplier.mainContact.email && <p>{supplier.mainContact.email}</p>}
        </div>
      )}

      {supplier.createdByName && (
        <p className="text-xs text-ink-muted">Cadastrado por {supplier.createdByName}</p>
      )}

      <div className="grid grid-cols-4 gap-1 border-t border-line pt-3">
        {INDICATORS.map(({ kind, label, icon: Icon }) => (
          <button
            key={kind}
            type="button"
            data-testid={`indicator-${kind}`}
            onClick={() => onOpenPopup(kind, supplier.id)}
            className="flex flex-col items-center gap-1 rounded py-1 text-ink-muted hover:bg-bg hover:text-ink"
          >
            <Icon size={16} aria-hidden="true" />
            <span className="text-[10px]">{label}</span>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-line pt-3">
        <Button variant="ghost" onClick={() => onEdit(supplier.id)}>
          Editar
        </Button>
        <Button variant="ghost" onClick={() => onOpenPopup('avaliacoes', supplier.id)}>
          Avaliar
        </Button>
        <ComingSoonButton label="Copiar" />
        <ComingSoonButton label="Copiar para setor" />
        <Button variant="ghost" onClick={() => onDelete(supplier.id)}>
          Excluir
        </Button>
      </div>
    </div>
  )
}
