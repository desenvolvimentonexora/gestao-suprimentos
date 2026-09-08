import type { ComponentType, SVGProps } from 'react'

export interface ModuleDefinition {
  id: string
  label: string
  icon: ComponentType<SVGProps<SVGSVGElement>>
  route: string
  permissions: string[]
  workspace: string
  status: 'available' | 'beta'
}

export const moduleRegistry: ModuleDefinition[] = []
