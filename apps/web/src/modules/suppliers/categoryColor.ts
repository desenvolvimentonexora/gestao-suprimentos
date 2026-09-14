export interface CategoryColorClasses {
  itemBg: string
  icon: string
}

// Paleta pastel neutra — cada categoria mantém sempre o mesmo tom, para
// que as abas fiquem visualmente distintas entre si (não é cor de marca
// nem semântica, só identidade visual por categoria).
const PALETTE: CategoryColorClasses[] = [
  { itemBg: 'bg-emerald-50', icon: 'text-emerald-600' },
  { itemBg: 'bg-amber-50', icon: 'text-amber-600' },
  { itemBg: 'bg-pink-50', icon: 'text-pink-600' },
  { itemBg: 'bg-purple-50', icon: 'text-purple-600' },
  { itemBg: 'bg-blue-50', icon: 'text-blue-600' },
  { itemBg: 'bg-slate-100', icon: 'text-slate-600' },
  { itemBg: 'bg-teal-50', icon: 'text-teal-600' },
  { itemBg: 'bg-indigo-50', icon: 'text-indigo-600' },
]

function hashString(value: string): number {
  let hash = 0
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0
  }
  return hash
}

export function getCategoryColor(id: string): CategoryColorClasses {
  return PALETTE[hashString(id) % PALETTE.length] ?? PALETTE[0]!
}
