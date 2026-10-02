import { useState } from 'react'
import { Button, Input, Modal } from '../../components'
import type { MaterialRow, MaterialVariantRow } from './types'

export interface InsumosModalProps {
  isOpen: boolean
  onClose: () => void
  materials: MaterialRow[]
  variants: MaterialVariantRow[]
  onCreateVariant: (materialId: string, code: string, description: string) => void
  isCreating: boolean
}

function variantLabel(variant: { materialName: string; code: string | null; description: string | null }) {
  const parts = [variant.materialName, variant.code, variant.description].filter(Boolean)
  return parts.join(' — ')
}

export function InsumosModal({
  isOpen,
  onClose,
  materials,
  variants,
  onCreateVariant,
  isCreating,
}: InsumosModalProps) {
  const [search, setSearch] = useState('')
  const [showNewForm, setShowNewForm] = useState(false)
  const [materialId, setMaterialId] = useState(materials[0]?.id ?? '')
  const [code, setCode] = useState('')
  const [description, setDescription] = useState('')

  const normalizedSearch = search.trim().toLowerCase()
  const filteredVariants =
    normalizedSearch.length > 0
      ? variants.filter((variant) =>
          [variant.materialName, variant.code, variant.description]
            .filter((value): value is string => Boolean(value))
            .some((value) => value.toLowerCase().includes(normalizedSearch)),
        )
      : variants

  function openNewForm() {
    setMaterialId(materials[0]?.id ?? '')
    setCode('')
    setDescription('')
    setShowNewForm(true)
  }

  function closeNewForm() {
    setShowNewForm(false)
  }

  function handleCreate() {
    if (!materialId || !code.trim()) return
    onCreateVariant(materialId, code.trim(), description.trim())
    closeNewForm()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Insumos" maxWidthClassName="max-w-2xl">
      <div className="flex flex-col gap-3">
        <div className="flex gap-2">
          <input
            type="search"
            placeholder="Buscar por material, código ou descrição"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 rounded border border-line bg-surface px-3 py-2 text-sm text-ink"
          />
          {!showNewForm && (
            <Button type="button" onClick={openNewForm}>
              + Novo insumo
            </Button>
          )}
        </div>

        {showNewForm && (
          <div className="flex flex-col gap-2 rounded border border-line p-3">
            <div className="flex flex-col gap-1">
              <label htmlFor="insumo-material" className="text-sm font-medium text-ink">
                Material
              </label>
              <select
                id="insumo-material"
                value={materialId}
                onChange={(e) => setMaterialId(e.target.value)}
                className="rounded border border-line bg-surface px-3 py-2 text-sm text-ink"
              >
                {materials.map((material) => (
                  <option key={material.id} value={material.id}>
                    {material.name}
                  </option>
                ))}
              </select>
            </div>
            <Input label="Código" value={code} onChange={(e) => setCode(e.target.value)} />
            <Input label="Descrição" value={description} onChange={(e) => setDescription(e.target.value)} />
            <div className="flex gap-2">
              <Button type="button" onClick={handleCreate} disabled={!materialId || !code.trim() || isCreating}>
                Adicionar insumo
              </Button>
              <Button type="button" variant="ghost" onClick={closeNewForm}>
                Cancelar
              </Button>
            </div>
          </div>
        )}

        <div className="flex max-h-80 flex-col divide-y divide-line overflow-y-auto">
          {filteredVariants.length === 0 ? (
            <p className="py-4 text-sm text-ink-muted">Nenhum insumo encontrado.</p>
          ) : (
            filteredVariants.map((variant) => (
              <div key={variant.id} className="py-2 text-sm text-ink">
                {variantLabel(variant)}
              </div>
            ))
          )}
        </div>
      </div>
    </Modal>
  )
}
