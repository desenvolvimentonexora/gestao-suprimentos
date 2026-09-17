import type { ModuleCardData } from '../registry'

// Um módulo sem rota ainda não tem tela construída — não é uma opção real
// de desativar, então sempre aparece (com o selo "beta"/"em breve" que já
// tinha). Só módulos com tela real são filtrados pela lista de ativos.
export function filterActiveModules(items: ModuleCardData[], activeModuleIds: string[]): ModuleCardData[] {
  return items.filter((item) => !item.route || activeModuleIds.includes(item.id))
}
