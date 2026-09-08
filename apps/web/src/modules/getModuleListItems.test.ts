import { FileText } from 'lucide-react'
import { describe, expect, it } from 'vitest'
import { getModuleListItems } from './getModuleListItems'
import type { ModuleDefinition } from './types'

function buildModule(overrides: Partial<ModuleDefinition>): ModuleDefinition {
  return {
    id: 'requests',
    label: 'Requisições',
    description: 'Criar e acompanhar pedidos de compra',
    icon: FileText,
    route: '/requests',
    workspace: 'Compras',
    permissions: [],
    status: 'beta',
    ...overrides,
  }
}

describe('getModuleListItems', () => {
  it('marca como licenciado um módulo presente em licensedModules', () => {
    const items = getModuleListItems([buildModule({ id: 'requests' })], ['requests'], [])
    expect(items[0]?.licensed).toBe(true)
  })

  it('marca como não licenciado um módulo ausente de licensedModules', () => {
    const items = getModuleListItems([buildModule({ id: 'admin' })], ['requests'], [])
    expect(items[0]?.licensed).toBe(false)
  })

  it('remove da lista módulos cuja permissão exigida o usuário não tem', () => {
    const items = getModuleListItems(
      [buildModule({ id: 'admin', permissions: ['admin.full_access'] })],
      ['admin'],
      [],
    )
    expect(items).toHaveLength(0)
  })

  it('mantém na lista módulos sem permissão exigida', () => {
    const items = getModuleListItems([buildModule({ permissions: [] })], [], [])
    expect(items).toHaveLength(1)
  })
})
