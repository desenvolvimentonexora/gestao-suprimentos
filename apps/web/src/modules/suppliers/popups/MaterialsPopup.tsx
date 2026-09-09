import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { Modal } from '../../../components'
import type { MaterialRow } from '../types'
import type { SupplierMaterialLinkRow } from './types'

export interface MaterialsPopupProps {
  isOpen: boolean
  onClose: () => void
  links: SupplierMaterialLinkRow[]
  allMaterials: MaterialRow[]
  onAddLink: (materialId: string) => void
  onRemoveLink: (materialId: string) => void
}

export function MaterialsPopup({
  isOpen,
  onClose,
  links,
  allMaterials,
  onAddLink,
  onRemoveLink,
}: MaterialsPopupProps) {
  const [search, setSearch] = useState('')

  const linkedIds = new Set(links.map((link) => link.materialId))
  const normalizedSearch = search.trim().toLowerCase()
  const suggestions =
    normalizedSearch.length > 0
      ? allMaterials.filter(
          (material) =>
            !linkedIds.has(material.id) && material.name.toLowerCase().includes(normalizedSearch),
        )
      : []

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Materiais">
      <div className="flex flex-col gap-2">
        {links.map((link) => (
          <div key={link.materialId} className="flex items-center justify-between">
            <span className="text-sm text-ink">{link.materialName}</span>
            <button
              type="button"
              aria-label={`Remover ${link.materialName}`}
              onClick={() => onRemoveLink(link.materialId)}
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
          placeholder="Buscar material para adicionar"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded border border-line bg-surface px-3 py-2 text-sm text-ink"
        />
        {suggestions.length > 0 && (
          <div className="mt-2 flex flex-col gap-1">
            {suggestions.map((material) => (
              <button
                key={material.id}
                type="button"
                aria-label={`Adicionar ${material.name}`}
                onClick={() => {
                  onAddLink(material.id)
                  setSearch('')
                }}
                className="rounded px-2 py-1 text-left text-sm text-ink hover:bg-bg"
              >
                {material.name}
              </button>
            ))}
          </div>
        )}
      </div>
    </Modal>
  )
}
