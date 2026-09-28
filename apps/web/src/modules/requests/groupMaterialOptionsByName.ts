import type { MaterialOption } from './types'

export interface MaterialOptionGroup {
  materialName: string
  options: MaterialOption[]
}

// materialName é o material genérico (a "categoria" do insumo, ex.:
// "Argamassa", "Cabo CCI") — pode ter várias variantes (os insumos de
// verdade, cada um com código próprio). Agrupar por materialName deixa
// claro, ao abrir a lista, quais variantes existem dentro de cada material,
// em vez de uma lista só com tudo misturado.
export function groupMaterialOptionsByName(materials: MaterialOption[]): MaterialOptionGroup[] {
  const groups = new Map<string, MaterialOption[]>()
  for (const material of materials) {
    const list = groups.get(material.materialName) ?? []
    list.push(material)
    groups.set(material.materialName, list)
  }

  return [...groups.entries()]
    .map(([materialName, options]) => ({ materialName, options }))
    .sort((a, b) => a.materialName.localeCompare(b.materialName, 'pt-BR'))
}
