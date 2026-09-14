export interface NegotiatorColorClasses {
  chipSelected: string
  chipUnselected: string
  select: string
}

const GRAY: NegotiatorColorClasses = {
  chipSelected: 'border-ink-muted bg-ink-muted text-white',
  chipUnselected: 'border-line bg-surface text-ink hover:bg-bg',
  select: 'border-line bg-surface text-ink',
}

// Paleta fixa — cada entrada usa classes Tailwind literais (não geradas por
// interpolação) para que o compilador consiga detectá-las no build.
const PALETTE: NegotiatorColorClasses[] = [
  {
    chipSelected: 'border-emerald-600 bg-emerald-600 text-white',
    chipUnselected: 'border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100',
    select: 'border-emerald-300 bg-emerald-50 text-emerald-700',
  },
  {
    chipSelected: 'border-amber-600 bg-amber-600 text-white',
    chipUnselected: 'border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100',
    select: 'border-amber-300 bg-amber-50 text-amber-700',
  },
  {
    chipSelected: 'border-pink-600 bg-pink-600 text-white',
    chipUnselected: 'border-pink-300 bg-pink-50 text-pink-700 hover:bg-pink-100',
    select: 'border-pink-300 bg-pink-50 text-pink-700',
  },
  {
    chipSelected: 'border-purple-600 bg-purple-600 text-white',
    chipUnselected: 'border-purple-300 bg-purple-50 text-purple-700 hover:bg-purple-100',
    select: 'border-purple-300 bg-purple-50 text-purple-700',
  },
  {
    chipSelected: 'border-blue-600 bg-blue-600 text-white',
    chipUnselected: 'border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100',
    select: 'border-blue-300 bg-blue-50 text-blue-700',
  },
  {
    chipSelected: 'border-slate-700 bg-slate-700 text-white',
    chipUnselected: 'border-slate-300 bg-slate-50 text-slate-700 hover:bg-slate-100',
    select: 'border-slate-300 bg-slate-50 text-slate-700',
  },
  {
    chipSelected: 'border-teal-600 bg-teal-600 text-white',
    chipUnselected: 'border-teal-300 bg-teal-50 text-teal-700 hover:bg-teal-100',
    select: 'border-teal-300 bg-teal-50 text-teal-700',
  },
  {
    chipSelected: 'border-indigo-600 bg-indigo-600 text-white',
    chipUnselected: 'border-indigo-300 bg-indigo-50 text-indigo-700 hover:bg-indigo-100',
    select: 'border-indigo-300 bg-indigo-50 text-indigo-700',
  },
]

function hashString(value: string): number {
  let hash = 0
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0
  }
  return hash
}

export function getNegotiatorColor(id: string | null): NegotiatorColorClasses {
  if (!id || id === 'unassigned') return GRAY
  return PALETTE[hashString(id) % PALETTE.length] ?? GRAY
}
