import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { Button, Input, Modal } from '../../../components'
import type { MaterialRow, MaterialVariantRow } from '../types'
import type { SupplierMaterialLinkRow } from './types'

export interface MaterialsPopupProps {
  isOpen: boolean
  onClose: () => void
  links: SupplierMaterialLinkRow[]
  allMaterials: MaterialRow[]
  allMaterialVariants: MaterialVariantRow[]
  onAddLink: (materialVariantId: string) => void
  onRemoveLink: (materialVariantId: string) => void
  onCreateVariant: (materialId: string, code: string, description: string) => Promise<MaterialVariantRow>
}

function variantLabel(variant: { materialName: string; code: string | null; description: string | null }) {
  const parts = [variant.materialName, variant.code, variant.description].filter(Boolean)
  return parts.join(' — ')
}

export function MaterialsPopup({
  isOpen,
  onClose,
  links,
  allMaterials,
  allMaterialVariants,
  onAddLink,
  onRemoveLink,
  onCreateVariant,
}: MaterialsPopupProps) {
  const [search, setSearch] = useState('')
  const [newMaterialId, setNewMaterialId] = useState(allMaterials[0]?.id ?? '')
  const [newDescription, setNewDescription] = useState('')

  const linkedIds = new Set(links.map((link) => link.materialVariantId))
  const normalizedSearch = search.trim().toLowerCase()
  const suggestions =
    normalizedSearch.length > 0
      ? allMaterialVariants.filter(
          (variant) =>
            !linkedIds.has(variant.id) &&
            (variant.code?.toLowerCase().includes(normalizedSearch) ||
              variant.description?.toLowerCase().includes(normalizedSearch)),
        )
      : []

  async function handleCreateVariant() {
    if (!newMaterialId || !search.trim()) return
    const variant = await onCreateVariant(newMaterialId, search.trim(), newDescription.trim())
    onAddLink(variant.id)
    setSearch('')
    setNewDescription('')
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Materiais">
      <div className="flex flex-col gap-2">
        {links.map((link) => (
          <div key={link.materialVariantId} className="flex items-center justify-between">
            <span className="text-sm text-ink">{variantLabel(link)}</span>
            <button
              type="button"
              aria-label={`Remover ${variantLabel(link)}`}
              onClick={() => onRemoveLink(link.materialVariantId)}
              className="text-ink-muted hover:text-accent"
            >
              <Trash2 size={16} aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>

      <div className="border-t border-line pt-3">
        <input
          type="search"
          placeholder="Buscar por código ou descrição"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded border border-line bg-surface px-3 py-2 text-sm text-ink"
        />
        {suggestions.length > 0 && (
          <div className="mt-2 flex flex-col gap-1">
            {suggestions.map((variant) => (
              <button
                key={variant.id}
                type="button"
                aria-label={`Adicionar ${variantLabel(variant)}`}
                onClick={() => {
                  onAddLink(variant.id)
                  setSearch('')
                }}
                className="rounded px-2 py-1 text-left text-sm text-ink hover:bg-bg"
              >
                {variantLabel(variant)}
              </button>
            ))}
          </div>
        )}

        {normalizedSearch.length > 0 && suggestions.length === 0 && (
          <div className="mt-3 flex flex-col gap-2 rounded border border-line p-3">
            <p className="text-xs text-ink-muted">
              Nenhuma variante com esse código. Cadastrar "{search.trim()}" como nova:
            </p>
            <div className="flex flex-col gap-1">
              <label htmlFor="new-variant-material" className="text-sm font-medium text-ink">
                Material
              </label>
              <select
                id="new-variant-material"
                value={newMaterialId}
                onChange={(e) => setNewMaterialId(e.target.value)}
                className="rounded border border-line bg-surface px-3 py-2 text-sm text-ink"
              >
                {allMaterials.map((material) => (
                  <option key={material.id} value={material.id}>
                    {material.name}
                  </option>
                ))}
              </select>
            </div>
            <Input
              label="Descrição"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
            />
            <Button type="button" onClick={handleCreateVariant} disabled={!newMaterialId}>
              + Adicionar variante
            </Button>
          </div>
        )}
      </div>
    </Modal>
  )
}
