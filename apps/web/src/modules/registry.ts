import { CheckSquare, FileText, Handshake, MessageSquare, Settings, Warehouse } from 'lucide-react'
import type { ModuleDefinition } from './types'

export const moduleRegistry: ModuleDefinition[] = [
  {
    id: 'requests',
    label: 'Requisições',
    description: 'Criar e acompanhar pedidos de compra',
    icon: FileText,
    route: '/requests',
    workspace: 'Compras',
    permissions: [],
    status: 'beta',
  },
  {
    id: 'quotations',
    label: 'Cotações',
    description: 'Comparar propostas de fornecedores',
    icon: MessageSquare,
    route: '/quotations',
    workspace: 'Compras',
    permissions: [],
    status: 'beta',
  },
  {
    id: 'approvals',
    label: 'Aprovações',
    description: 'Fila de aprovações pendentes',
    icon: CheckSquare,
    route: '/approvals',
    workspace: 'Compras',
    permissions: [],
    status: 'beta',
  },
  {
    id: 'units',
    label: 'Unidades',
    description: 'Obras, lojas ou fábricas',
    icon: Warehouse,
    route: '/units',
    workspace: 'Cadastros',
    permissions: [],
    status: 'beta',
  },
  {
    id: 'suppliers',
    label: 'Fornecedores',
    description: 'Categorias, CNPJs e contatos',
    icon: Handshake,
    route: '/suppliers',
    workspace: 'Cadastros',
    permissions: [],
    status: 'beta',
  },
  {
    id: 'admin',
    label: 'Configurações',
    description: 'Tema, papéis, campos e módulos',
    icon: Settings,
    route: '/admin',
    workspace: 'Administração',
    permissions: [],
    status: 'beta',
  },
]

export { getModuleListItems } from './getModuleListItems'
export type { ModuleDefinition, ModuleListItem } from './types'
