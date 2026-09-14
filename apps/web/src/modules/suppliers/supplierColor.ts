export interface SupplierColorClasses {
  avatar: string
}

// Mesmo hash e mesma ordem de matiz de modules/comparisons/supplierColor.ts
// (módulos não podem importar um do outro) — garante que um fornecedor
// sempre caia na mesma família de cor em qualquer tela do sistema, mesmo
// com classes Tailwind diferentes por contexto (avatar sólido aqui,
// cabeçalho de coluna claro na Equalização).
const PALETTE: SupplierColorClasses[] = [
  { avatar: 'bg-emerald-600' },
  { avatar: 'bg-amber-600' },
  { avatar: 'bg-pink-600' },
  { avatar: 'bg-purple-600' },
  { avatar: 'bg-blue-600' },
  { avatar: 'bg-slate-600' },
  { avatar: 'bg-teal-600' },
  { avatar: 'bg-indigo-600' },
]

function hashString(value: string): number {
  let hash = 0
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0
  }
  return hash
}

export function getSupplierColor(id: string): SupplierColorClasses {
  return PALETTE[hashString(id) % PALETTE.length] ?? PALETTE[0]!
}
