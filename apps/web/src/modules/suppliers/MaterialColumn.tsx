import { useState, type FormEvent } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { Button, Input } from '../../components'
import { filterMaterials } from './filterMaterials'
import { guessMaterialIcon } from './guessMaterialIcon'
import { getIconComponent } from './iconMap'
import { IconPicker } from './IconPicker'
import type { CategoryRow, MaterialRow } from './types'

export interface MaterialColumnProps {
  materials: MaterialRow[]
  categories: CategoryRow[]
  selectedCategoryId: string | null
  selectedMaterialId: string | null
  onSelectMaterial: (materialId: string) => void
  onCreateMaterial: (name: string, categoryId: string, icon: string, code: string, description: string) => void
  onUpdateMaterial: (
    materialId: string,
    name: string,
    categoryId: string,
    icon: string,
    code: string,
    description: string,
  ) => void
  onDeleteMaterial: (materialId: string) => void
  supplierSearch: string
  onSupplierSearchChange: (value: string) => void
  onOpenReport: () => void
}

interface MaterialFormValues {
  name: string
  categoryId: string
  icon: string
  code: string
  description: string
}

function MaterialForm({
  categories,
  initialValues,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  categories: CategoryRow[]
  initialValues?: MaterialFormValues
  submitLabel: string
  onSubmit: (values: MaterialFormValues) => void
  onCancel: () => void
}) {
  const [name, setName] = useState(initialValues?.name ?? '')
  const [categoryId, setCategoryId] = useState(initialValues?.categoryId ?? categories[0]?.id ?? '')
  const [icon, setIcon] = useState(initialValues?.icon ?? guessMaterialIcon(''))
  const [iconTouched, setIconTouched] = useState(Boolean(initialValues))
  const [code, setCode] = useState(initialValues?.code ?? '')
  const [description, setDescription] = useState(initialValues?.description ?? '')

  function handleNameChange(value: string) {
    setName(value)
    if (!iconTouched) setIcon(guessMaterialIcon(value))
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!name.trim() || !categoryId) return
    onSubmit({ name: name.trim(), categoryId, icon, code: code.trim(), description: description.trim() })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 rounded border border-line p-3">
      <Input
        label="Nome do material"
        value={name}
        onChange={(e) => handleNameChange(e.target.value)}
      />
      <Input label="Código" value={code} onChange={(e) => setCode(e.target.value)} />
      <Input label="Descrição" value={description} onChange={(e) => setDescription(e.target.value)} />
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
      <IconPicker
        value={icon}
        onChange={(value) => {
          setIcon(value)
          setIconTouched(true)
        }}
      />
      <div className="flex gap-2">
        <Button type="submit">{submitLabel}</Button>
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
  onUpdateMaterial,
  onDeleteMaterial,
  supplierSearch,
  onSupplierSearchChange,
  onOpenReport,
}: MaterialColumnProps) {
  const [materialSearch, setMaterialSearch] = useState('')
  const [showNewForm, setShowNewForm] = useState(false)
  const [editingMaterialId, setEditingMaterialId] = useState<string | null>(null)

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
        <MaterialForm
          categories={categories}
          submitLabel="Criar material"
          onSubmit={({ name, categoryId, icon, code, description }) => {
            onCreateMaterial(name, categoryId, icon, code, description)
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
        {visibleMaterials.map((material) => {
          if (editingMaterialId === material.id) {
            return (
              <div key={material.id} className="py-2">
                <MaterialForm
                  categories={categories}
                  initialValues={{
                    name: material.name,
                    categoryId: material.categoryId,
                    icon: material.icon,
                    code: material.code ?? '',
                    description: material.description ?? '',
                  }}
                  submitLabel="Salvar"
                  onSubmit={({ name, categoryId, icon, code, description }) => {
                    onUpdateMaterial(material.id, name, categoryId, icon, code, description)
                    setEditingMaterialId(null)
                  }}
                  onCancel={() => setEditingMaterialId(null)}
                />
              </div>
            )
          }

          const Icon = getIconComponent(material.icon)

          return (
            <div
              key={material.id}
              className={`group flex items-center justify-between px-2 py-2 ${
                selectedMaterialId === material.id ? 'bg-bg' : ''
              }`}
            >
              <button
                type="button"
                onClick={() => onSelectMaterial(material.id)}
                className="flex flex-1 items-center gap-2 text-left text-sm text-ink hover:text-primary"
              >
                <Icon size={16} className="shrink-0 text-ink-muted" aria-hidden="true" />
                {material.code && <span className="text-xs text-ink-muted">{material.code}</span>}
                {material.name}
                <span className="text-xs text-ink-muted">{material.supplierCount}</span>
              </button>
              <div className="invisible flex items-center gap-2 group-hover:visible">
                <button
                  type="button"
                  aria-label={`Editar ${material.name}`}
                  onClick={() => setEditingMaterialId(material.id)}
                  className="text-ink-muted hover:text-primary"
                >
                  <Pencil size={16} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  aria-label={`Excluir ${material.name}`}
                  onClick={() => onDeleteMaterial(material.id)}
                  className="text-ink-muted hover:text-accent"
                >
                  <Trash2 size={16} aria-hidden="true" />
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
