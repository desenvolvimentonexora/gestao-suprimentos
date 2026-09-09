import { useState, type FormEvent } from 'react'
import { Trash2 } from 'lucide-react'
import { Button, Input } from '../../components'
import { filterMaterials } from './filterMaterials'
import type { CategoryRow, MaterialRow } from './types'

export interface MaterialColumnProps {
  materials: MaterialRow[]
  categories: CategoryRow[]
  selectedCategoryId: string | null
  selectedMaterialId: string | null
  onSelectMaterial: (materialId: string) => void
  onCreateMaterial: (name: string, categoryId: string) => void
  onDeleteMaterial: (materialId: string) => void
  supplierSearch: string
  onSupplierSearchChange: (value: string) => void
  onOpenReport: () => void
}

function NewMaterialForm({
  categories,
  onCreate,
  onCancel,
}: {
  categories: CategoryRow[]
  onCreate: (name: string, categoryId: string) => void
  onCancel: () => void
}) {
  const [name, setName] = useState('')
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? '')

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!name.trim() || !categoryId) return
    onCreate(name.trim(), categoryId)
    setName('')
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 rounded border border-line p-3">
      <Input label="Nome do material" value={name} onChange={(e) => setName(e.target.value)} />
      <div className="flex flex-col gap-1">
        <label htmlFor="material-category" className="text-sm font-medium text-ink">
          Categoria
        </label>
        <select
          id="material-category"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="rounded border border-line bg-surface px-3 py-2 text-sm text-ink"
        >
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>
      <div className="flex gap-2">
        <Button type="submit">Criar material</Button>
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}

export function MaterialColumn({
  materials,
  categories,
  selectedCategoryId,
  selectedMaterialId,
  onSelectMaterial,
  onCreateMaterial,
  onDeleteMaterial,
  supplierSearch,
  onSupplierSearchChange,
  onOpenReport,
}: MaterialColumnProps) {
  const [materialSearch, setMaterialSearch] = useState('')
  const [showNewForm, setShowNewForm] = useState(false)

  const visibleMaterials = filterMaterials(materials, {
    categoryId: selectedCategoryId,
    search: materialSearch,
  })

  return (
    <div className="flex flex-col gap-3">
      <input
        type="search"
        placeholder="Buscar material"
        value={materialSearch}
        onChange={(e) => setMaterialSearch(e.target.value)}
        className="rounded border border-line bg-surface px-3 py-2 text-sm text-ink"
      />

      {showNewForm ? (
        <NewMaterialForm
          categories={categories}
          onCreate={(name, categoryId) => {
            onCreateMaterial(name, categoryId)
            setShowNewForm(false)
          }}
          onCancel={() => setShowNewForm(false)}
        />
      ) : (
        <Button variant="secondary" onClick={() => setShowNewForm(true)}>
          + Novo
        </Button>
      )}

      <input
        type="search"
        placeholder="Buscar fornecedor"
        value={supplierSearch}
        onChange={(e) => onSupplierSearchChange(e.target.value)}
        className="rounded border border-line bg-surface px-3 py-2 text-sm text-ink"
      />

      <Button variant="ghost" onClick={onOpenReport}>
        📋 Relatório de Fornecedores
      </Button>

      <div className="flex flex-col divide-y divide-line">
        {visibleMaterials.map((material) => (
          <div
            key={material.id}
            className={`group flex items-center justify-between px-2 py-2 ${
              selectedMaterialId === material.id ? 'bg-bg' : ''
            }`}
          >
            <button
              type="button"
              onClick={() => onSelectMaterial(material.id)}
              className="flex-1 text-left text-sm text-ink hover:text-primary"
            >
              {material.name}
              <span className="ml-2 text-xs text-ink-muted">{material.supplierCount}</span>
            </button>
            <button
              type="button"
              aria-label={`Excluir ${material.name}`}
              onClick={() => onDeleteMaterial(material.id)}
              className="invisible text-ink-muted hover:text-accent group-hover:visible"
            >
              <Trash2 size={16} aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
