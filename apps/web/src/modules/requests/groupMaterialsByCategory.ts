import type { MaterialWithSupplierCount } from './types'

export interface MaterialCategoryGroup {
  categoryId: string
  categoryName: string
  /** Fornecedores distintos entre todas as variantes da categoria — não é soma, pra não contar o mesmo fornecedor duas vezes. */
  supplierCount: number
  materials: MaterialWithSupplierCount[]
}

export function groupMaterialsByCategory(materials: MaterialWithSupplierCount[]): MaterialCategoryGroup[] {
  const groups = new Map<string, MaterialCategoryGroup>()

  for (const material of materials) {
    let group = groups.get(material.categoryId)
    if (!group) {
      group = { categoryId: material.categoryId, categoryName: material.categoryName, supplierCount: 0, materials: [] }
      groups.set(material.categoryId, group)
    }
    group.materials.push(material)
  }

  for (const group of groups.values()) {
    group.supplierCount = new Set(group.materials.flatMap((material) => material.supplierIds)).size
    group.materials.sort((a, b) => a.name.localeCompare(b.name))
  }

  return [...groups.values()].sort((a, b) => a.categoryName.localeCompare(b.categoryName))
}
