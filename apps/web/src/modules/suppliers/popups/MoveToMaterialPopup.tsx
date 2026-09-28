import { useState } from 'react'
import { Button, Modal } from '../../../components'
import type { CategoryRow, MaterialRow, MaterialVariantRow } from '../types'

export interface MoveToMaterialPopupProps {
  isOpen: boolean
  onClose: () => void
  currentMaterialName: string
  categories: CategoryRow[]
  /** Materiais disponíveis como destino — já sem o material atual. */
  materials: MaterialRow[]
  materialVariants: MaterialVariantRow[]
  onConfirm: (targetMaterialVariantId: string) => void
  isSubmitting: boolean
}

export function MoveToMaterialPopup({
  isOpen,
  onClose,
  currentMaterialName,
  categories,
  materials,
  materialVariants,
  onConfirm,
  isSubmitting,
}: MoveToMaterialPopupProps) {
  const [materialId, setMaterialId] = useState(materials[0]?.id ?? '')
  const [variantId, setVariantId] = useState('')

  const variantsOfSelectedMaterial = materialVariants.filter((variant) => variant.materialId === materialId)
  const effectiveVariantId = variantId || variantsOfSelectedMaterial[0]?.id || ''

  function handleClose() {
    setMaterialId(materials[0]?.id ?? '')
    setVariantId('')
    onClose()
  }

  function handleMaterialChange(nextMaterialId: string) {
    setMaterialId(nextMaterialId)
    setVariantId('')
  }

  function handleConfirm() {
    if (!effectiveVariantId) return
    onConfirm(effectiveVariantId)
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Mover para outro material">
      <div className="flex flex-col gap-3">
        <p className="text-sm text-ink-muted">
          O fornecedor deixará de aparecer em <span className="font-medium text-ink">{currentMaterialName}</span> e
          passará a aparecer no material escolhido abaixo.
        </p>

        <div className="flex flex-col gap-1">
          <label htmlFor="move-to-material" className="text-sm font-medium text-ink">
            Material de destino
          </label>
          <select
            id="move-to-material"
            value={materialId}
            onChange={(e) => handleMaterialChange(e.target.value)}
            className="rounded border border-line bg-surface px-3 py-2 text-sm text-ink"
          >
            {categories.map((category) => {
              const categoryMaterials = materials.filter((material) => material.categoryId === category.id)
              if (categoryMaterials.length === 0) return null
              return (
                <optgroup key={category.id} label={category.name}>
                  {categoryMaterials.map((material) => (
                    <option key={material.id} value={material.id}>
                      {material.name}
                    </option>
                  ))}
                </optgroup>
              )
            })}
          </select>
        </div>

        {variantsOfSelectedMaterial.length > 1 && (
          <div className="flex flex-col gap-1">
            <label htmlFor="move-to-variant" className="text-sm font-medium text-ink">
              Variação
            </label>
            <select
              id="move-to-variant"
              value={effectiveVariantId}
              onChange={(e) => setVariantId(e.target.value)}
              className="rounded border border-line bg-surface px-3 py-2 text-sm text-ink"
            >
              {variantsOfSelectedMaterial.map((variant) => (
                <option key={variant.id} value={variant.id}>
                  {[variant.code, variant.description].filter(Boolean).join(' — ') || variant.materialName}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex justify-end gap-2 border-t border-line pt-3">
          <Button type="button" variant="secondary" onClick={handleClose}>
            Cancelar
          </Button>
          <Button type="button" onClick={handleConfirm} disabled={!effectiveVariantId || isSubmitting}>
            Mover
          </Button>
        </div>
      </div>
    </Modal>
  )
}
