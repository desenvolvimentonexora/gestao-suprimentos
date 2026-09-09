// Ordem de prioridade: a primeira regra cujo grupo de palavras-chave bater
// primeiro no nome do material decide o ícone. Mantida em sincronia manual
// com o UPDATE de backfill em supabase/seed (mesma lógica, em SQL).
const RULES: { keywords: string[]; icon: string }[] = [
  { keywords: ['cabo', 'eletric', 'fio', 'energia', 'barramento'], icon: 'zap' },
  { keywords: ['epi', 'capacete', 'luva', 'bota', 'protecao'], icon: 'shield' },
  { keywords: ['ferramenta', 'chave', 'furadeira', 'parafus'], icon: 'wrench' },
  { keywords: ['cadeira', 'mesa', 'movel', 'armario'], icon: 'armchair' },
  { keywords: ['churrasqueira', 'grelha'], icon: 'flame' },
  { keywords: ['tinta', 'gesso', 'pintura', 'textura'], icon: 'paintbrush' },
  { keywords: ['vidro', 'esquadria', 'porta', 'janela'], icon: 'door-open' },
  { keywords: ['concreto', 'cimento', 'areia', 'brita'], icon: 'layers' },
  { keywords: ['tubo', 'hidraulica', 'cano', 'registro'], icon: 'droplet' },
]

const DEFAULT_ICON = 'package'

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
}

export function guessMaterialIcon(name: string): string {
  const normalized = normalize(name)
  for (const rule of RULES) {
    if (rule.keywords.some((keyword) => normalized.includes(keyword))) {
      return rule.icon
    }
  }
  return DEFAULT_ICON
}
