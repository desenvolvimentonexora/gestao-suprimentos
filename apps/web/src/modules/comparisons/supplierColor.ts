export interface SupplierColorClasses {
  header: string
  tag: string
}

const GRAY: SupplierColorClasses = {
  header: 'border-line bg-surface text-ink-muted',
  tag: 'border-line bg-surface text-ink-muted',
}

// Paleta fixa — cada entrada usa classes Tailwind literais (não geradas por
// interpolação) para que o compilador consiga detectá-las no build. Mesmo
// padrão de negotiatorColor.ts, aplicado a fornecedores dentro de uma
// comparação.
const PALETTE: SupplierColorClasses[] = [
  { header: 'border-emerald-300 bg-emerald-50 text-emerald-700', tag: 'border-emerald-300 bg-emerald-100 text-emerald-800' },
  { header: 'border-amber-300 bg-amber-50 text-amber-700', tag: 'border-amber-300 bg-amber-100 text-amber-800' },
  { header: 'border-pink-300 bg-pink-50 text-pink-700', tag: 'border-pink-300 bg-pink-100 text-pink-800' },
  { header: 'border-purple-300 bg-purple-50 text-purple-700', tag: 'border-purple-300 bg-purple-100 text-purple-800' },
  { header: 'border-blue-300 bg-blue-50 text-blue-700', tag: 'border-blue-300 bg-blue-100 text-blue-800' },
  { header: 'border-slate-300 bg-slate-50 text-slate-700', tag: 'border-slate-300 bg-slate-100 text-slate-800' },
  { header: 'border-teal-300 bg-teal-50 text-teal-700', tag: 'border-teal-300 bg-teal-100 text-teal-800' },
  { header: 'border-indigo-300 bg-indigo-50 text-indigo-700', tag: 'border-indigo-300 bg-indigo-100 text-indigo-800' },
]

function hashString(value: string): number {
  let hash = 0
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0
  }
  return hash
}

export function getSupplierColor(id: string): SupplierColorClasses {
  return PALETTE[hashString(id) % PALETTE.length] ?? GRAY
}
