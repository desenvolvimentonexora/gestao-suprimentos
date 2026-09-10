import { Badge, Button } from '../../components'
import type { UnitRow, UnitStatus, UnitType } from './types'

const STATUS_LABELS: Record<UnitStatus, string> = {
  active: 'Ativa',
  completed: 'Concluída',
  inactive: 'Inativa',
}

const TYPE_LABELS: Record<UnitType, string> = {
  obra: 'Obra',
  escritorio: 'Escritório',
  deposito: 'Depósito',
}

export interface UnitsTableProps {
  units: UnitRow[]
  search: string
  onSearchChange: (value: string) => void
  statusFilter: UnitStatus | null
  onStatusFilterChange: (value: UnitStatus | null) => void
  typeFilter: UnitType | null
  onTypeFilterChange: (value: UnitType | null) => void
  onAddUnit: () => void
  onEditUnit: (unitId: string) => void
  onDeleteUnit: (unitId: string) => void
}

export function UnitsTable({
  units,
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  typeFilter,
  onTypeFilterChange,
  onAddUnit,
  onEditUnit,
  onDeleteUnit,
}: UnitsTableProps) {
  function handleDelete(unit: UnitRow) {
    if (window.confirm(`Excluir a unidade "${unit.name}"?`)) {
      onDeleteUnit(unit.id)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-1 flex-wrap gap-2">
          <input
            type="search"
            placeholder="Buscar unidade"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="flex-1 rounded border border-line bg-surface px-3 py-2 text-sm text-ink"
          />
          <select
            aria-label="Filtrar por status"
            value={statusFilter ?? ''}
            onChange={(e) => onStatusFilterChange((e.target.value || null) as UnitStatus | null)}
            className="rounded border border-line bg-surface px-3 py-2 text-sm text-ink"
          >
            <option value="">Todos os status</option>
            {(Object.keys(STATUS_LABELS) as UnitStatus[]).map((status) => (
              <option key={status} value={status}>
                {STATUS_LABELS[status]}
              </option>
            ))}
          </select>
          <select
            aria-label="Filtrar por tipo"
            value={typeFilter ?? ''}
            onChange={(e) => onTypeFilterChange((e.target.value || null) as UnitType | null)}
            className="rounded border border-line bg-surface px-3 py-2 text-sm text-ink"
          >
            <option value="">Todos os tipos</option>
            {(Object.keys(TYPE_LABELS) as UnitType[]).map((type) => (
              <option key={type} value={type}>
                {TYPE_LABELS[type]}
              </option>
            ))}
          </select>
        </div>
        <Button onClick={onAddUnit}>+ Nova unidade</Button>
      </div>

      {units.length === 0 ? (
        <p className="text-sm text-ink-muted">
          Nenhuma unidade cadastrada ainda. Cadastre a primeira.
        </p>
      ) : (
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-line text-ink-muted">
              <th className="py-2 font-medium">Nome</th>
              <th className="py-2 font-medium">Cidade/UF</th>
              <th className="py-2 font-medium">Tipo</th>
              <th className="py-2 font-medium">Status</th>
              <th className="py-2 font-medium">Responsável técnico</th>
              <th className="py-2 font-medium">Ações</th>
            </tr>
          </thead>
          <tbody>
            {units.map((unit) => (
              <tr key={unit.id} className="border-b border-line">
                <td className="py-2 text-ink">{unit.name}</td>
                <td className="py-2 text-ink-muted">
                  {unit.city && unit.state ? `${unit.city}/${unit.state}` : '—'}
                </td>
                <td className="py-2 text-ink-muted">{TYPE_LABELS[unit.type]}</td>
                <td className="py-2">
                  <Badge>{STATUS_LABELS[unit.status]}</Badge>
                </td>
                <td className="py-2 text-ink-muted">{unit.engineerName ?? '—'}</td>
                <td className="py-2">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      aria-label={`Editar ${unit.name}`}
                      onClick={() => onEditUnit(unit.id)}
                      className="text-ink-muted hover:text-ink"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      aria-label={`Excluir ${unit.name}`}
                      onClick={() => handleDelete(unit)}
                      className="text-ink-muted hover:text-accent"
                    >
                      Excluir
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
