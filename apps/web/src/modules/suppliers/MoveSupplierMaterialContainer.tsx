import { MoveToMaterialPopup } from './popups/MoveToMaterialPopup'
import { useAddSupplierMaterialLink, useRemoveSupplierMaterialLink, useSupplierMaterialLinks } from './popups/queries'
import type { CategoryRow, MaterialRow, MaterialVariantRow } from './types'

export interface MoveSupplierMaterialContainerProps {
  tenantId: string
  supplierId: string | null
  currentMaterialId: string | null
  currentMaterialName: string | null
  categories: CategoryRow[]
  materials: MaterialRow[]
  materialVariants: MaterialVariantRow[]
  onClose: () => void
}

export function MoveSupplierMaterialContainer({
  tenantId,
  supplierId,
  currentMaterialId,
  currentMaterialName,
  categories,
  materials,
  materialVariants,
  onClose,
}: MoveSupplierMaterialContainerProps) {
  const isOpen = Boolean(supplierId)
  const linksQuery = useSupplierMaterialLinks(supplierId ?? '', isOpen)
  const addLink = useAddSupplierMaterialLink(tenantId)
  const removeLink = useRemoveSupplierMaterialLink()

  const currentMaterialVariantIds = new Set(
    materialVariants.filter((variant) => variant.materialId === currentMaterialId).map((variant) => variant.id),
  )
  // O fornecedor pode estar ligado a mais de uma variante do material atual
  // (ex.: duas variações de Abraçadeira) — todas saem quando ele é movido.
  const linksToRemove = (linksQuery.data ?? [])
    .map((link) => link.materialVariantId)
    .filter((materialVariantId) => currentMaterialVariantIds.has(materialVariantId))

  const otherMaterials = materials.filter((material) => material.id !== currentMaterialId)

  function handleConfirm(targetMaterialVariantId: string) {
    if (!supplierId) return
    // Cria o vínculo novo antes de remover o antigo: se o passo de criar
    // falhar, o fornecedor não fica sem nenhum material vinculado.
    addLink.mutate(
      { supplierId, materialVariantId: targetMaterialVariantId },
      {
        onSuccess: () => {
          for (const materialVariantId of linksToRemove) {
            removeLink.mutate({ supplierId, materialVariantId })
          }
          onClose()
        },
      },
    )
  }

  return (
    <MoveToMaterialPopup
      isOpen={isOpen}
      onClose={onClose}
      currentMaterialName={currentMaterialName ?? ''}
      categories={categories}
      materials={otherMaterials}
      materialVariants={materialVariants}
      onConfirm={handleConfirm}
      isSubmitting={addLink.isPending || removeLink.isPending}
    />
  )
}
