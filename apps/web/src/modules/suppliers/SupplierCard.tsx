import { Award, Clock, Mail, Package, Phone, Star, User, Users } from 'lucide-react'
import { Badge, Button, ComingSoonButton } from '../../components'
import { getSupplierColor } from './supplierColor'
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

const INDICATORS: { kind: SupplierPopupKind; label: string; icon: typeof Award; iconClassName: string }[] = [
  { kind: 'certificados', label: 'Certificados', icon: Award, iconClassName: 'text-blue-600' },
  { kind: 'prazo', label: 'Prazo', icon: Clock, iconClassName: 'text-amber-600' },
  { kind: 'materiais', label: 'Materiais', icon: Package, iconClassName: 'text-purple-600' },
  { kind: 'avaliacoes', label: 'Avaliações', icon: Star, iconClassName: 'text-amber-500' },
]

export function SupplierCard({
  supplier,
  isFavorite,
  onToggleFavorite,
  onOpenPopup,
  onEdit,
  onDelete,
}: SupplierCardProps) {
  const avatarColor = getSupplierColor(supplier.id)
  const isActive = supplier.status === 'active'

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold text-white ${avatarColor.avatar}`}
          >
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
          className={isFavorite ? 'text-amber-500' : 'text-ink-muted hover:text-amber-500'}
        >
          <Star size={18} fill={isFavorite ? 'currentColor' : 'none'} aria-hidden="true" />
        </button>
      </div>

      <div className="flex items-center gap-2">
        {supplier.type && (
          <Badge className="border-blue-200 bg-blue-50 text-blue-700">{supplier.type}</Badge>
        )}
        <span className="flex items-center gap-1 text-xs text-ink-muted">
          <span
            data-testid="status-dot"
            className={`h-2 w-2 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-ink-muted'}`}
            aria-hidden="true"
          />
          {isActive ? 'Ativo' : 'Inativo'}
        </span>
      </div>

      {supplier.mainContact && (
        <div className="flex flex-col gap-1 text-sm text-ink-muted">
          <span className="flex items-center gap-2 text-ink">
            <User size={14} className="text-ink-muted" aria-hidden="true" />
            {supplier.mainContact.name}
          </span>
          {supplier.mainContact.phone && (
            <span className="flex items-center gap-2">
              <Phone size={14} className="text-ink-muted" aria-hidden="true" />
              {supplier.mainContact.phone}
            </span>
          )}
          {supplier.mainContact.email && (
            <span className="flex items-center gap-2">
              <Mail size={14} className="text-ink-muted" aria-hidden="true" />
              {supplier.mainContact.email}
            </span>
          )}
        </div>
      )}

      {supplier.createdByName && (
        <p className="text-xs text-ink-muted">Cadastrado por {supplier.createdByName}</p>
      )}

      <div className="flex flex-col gap-1 border-t border-line pt-3">
        <div className="flex items-center justify-between text-xs text-ink-muted">
          <span className="flex items-center gap-1">
            <Users size={14} aria-hidden="true" />
            Contatos da empresa
          </span>
          <button type="button" className="text-blue-700 hover:underline">
            + Adicionar
          </button>
        </div>
        <p className="text-xs text-ink-muted">Nenhum contato extra. Clique em + Adicionar.</p>
      </div>

      <div className="grid grid-cols-4 gap-1 border-t border-line pt-3">
        {INDICATORS.map(({ kind, label, icon: Icon, iconClassName }) => (
          <button
            key={kind}
            type="button"
            data-testid={`indicator-${kind}`}
            onClick={() => onOpenPopup(kind, supplier.id)}
            className="flex flex-col items-center gap-1 rounded py-1 text-ink-muted hover:bg-bg hover:text-ink"
          >
            <Icon size={16} className={iconClassName} aria-hidden="true" />
            <span className="text-[10px]">{label}</span>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-line pt-3">
        <Button variant="ghost" className="text-blue-700 hover:text-blue-800" onClick={() => onEdit(supplier.id)}>
          Editar
        </Button>
        <Button
          variant="ghost"
          className="text-amber-600 hover:text-amber-700"
          onClick={() => onOpenPopup('avaliacoes', supplier.id)}
        >
          Avaliar
        </Button>
        <ComingSoonButton label="Copiar" className="text-slate-500 hover:text-slate-600" />
        <ComingSoonButton label="Copiar para setor" variant="info" />
        <Button variant="danger" onClick={() => onDelete(supplier.id)}>
          Excluir
        </Button>
      </div>
    </div>
  )
}
