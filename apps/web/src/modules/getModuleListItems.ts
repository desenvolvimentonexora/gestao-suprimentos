import { hasAllPermissions } from '../core/permissions'
import type { ModuleDefinition, ModuleListItem } from './types'

export function getModuleListItems(
  modules: ModuleDefinition[],
  licensedModules: string[],
  grantedPermissions: string[],
): ModuleListItem[] {
  return modules
    .filter((module) => hasAllPermissions(grantedPermissions, module.permissions))
    .map((module) => ({ ...module, licensed: licensedModules.includes(module.id) }))
}
