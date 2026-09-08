import type { LucideIcon } from 'lucide-react'

export interface ModuleDefinition {
  id: string
  label: string
  description: string
  icon: LucideIcon
  route: string
  workspace: string
  permissions: string[]
  status: 'available' | 'beta'
}

export interface ModuleListItem extends ModuleDefinition {
  licensed: boolean
}
