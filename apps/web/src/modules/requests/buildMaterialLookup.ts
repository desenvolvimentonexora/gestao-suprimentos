import type { MaterialOption } from './types'

function normalizeName(value: string): string {
  return value.trim().toLowerCase()
}

export interface MaterialLookup {
  findByCode: (code: string) => string | null
  findByName: (name: string) => string | null
  findByDescription: (description: string) => string | null
}

// Mapa "só se for único": ignora chaves usadas por mais de uma variante, em
// vez de deixar a última sobrescrever a anterior — evita casar (errado, e em
// silêncio) com a variante que por acaso entrou por último no array.
function buildUniqueMap(materials: MaterialOption[], getKey: (material: MaterialOption) => string | null): Map<string, string> {
  const counts = new Map<string, number>()
  for (const material of materials) {
    const raw = getKey(material)
    if (!raw) continue
    const key = normalizeName(raw)
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }

  const map = new Map<string, string>()
  for (const material of materials) {
    const raw = getKey(material)
    if (!raw) continue
    const key = normalizeName(raw)
    if (counts.get(key) === 1) map.set(key, material.id)
  }
  return map
}

// materialName é o nome do material "genérico" — funciona como uma categoria
// (ex.: "Abraçadeira Tipo U"), e mais de uma variante (o insumo de verdade,
// cada um com seu próprio código e descrição) pode compartilhar esse mesmo
// nome. Por isso, casar por nome ou por descrição só é confiável quando o
// valor não é ambíguo (só uma variante o usa) — quando é ambíguo, o valor
// fica de fora do mapa de propósito, pra nunca escolher silenciosamente a
// variante errada. Nesse caso o comprador escolhe manualmente qual é.
export function buildMaterialLookup(materials: MaterialOption[]): MaterialLookup {
  const byCode = buildUniqueMap(materials, (m) => m.code)
  const byName = buildUniqueMap(materials, (m) => m.materialName)
  const byDescription = buildUniqueMap(materials, (m) => m.description)

  return {
    findByCode: (code) => byCode.get(normalizeName(code)) ?? null,
    findByName: (name) => byName.get(normalizeName(name)) ?? null,
    findByDescription: (description) => byDescription.get(normalizeName(description)) ?? null,
  }
}
