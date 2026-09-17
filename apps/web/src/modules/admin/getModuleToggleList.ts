import { suprimentosRegistry } from '../registry'
import type { ModuleToggleRow } from './types'

// Só um módulo com rota de verdade tem tela construída — os demais (ainda
// "Em breve" no catálogo) nunca podem ser marcados como ativos, mesmo que
// um registro antigo de settings.modules ainda cite o id deles.
export function getModuleToggleList(activeModuleIds: string[]): ModuleToggleRow[] {
  return suprimentosRegistry.map((item) => {
    const implemented = Boolean(item.route)
    return {
      id: item.id,
      label: item.label,
      implemented,
      active: implemented && activeModuleIds.includes(item.id),
    }
  })
}
