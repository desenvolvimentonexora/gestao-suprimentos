import type { MaterialRow } from './types'

export interface FilterMaterialsOptions {
  categoryId: string | null
  search: string
}

export function filterMaterials(
  materials: MaterialRow[],
  { categoryId, search }: FilterMaterialsOptions,
): MaterialRow[] {
  const normalizedSearch = search.trim().toLowerCase()

  return materials.filter((material) => {
    if (categoryId && material.categoryId !== categoryId) return false
    if (normalizedSearch && !material.name.toLowerCase().includes(normalizedSearch)) return false
    return true
  })
}
