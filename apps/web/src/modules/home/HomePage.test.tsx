import { render, screen, within } from '@testing-library/react'
import { FileText } from 'lucide-react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { HomePage } from './HomePage'
import type { ModuleDefinition } from '../types'

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

const modules: ModuleDefinition[] = [
  buildModule({ id: 'requests', workspace: 'Compras', label: 'Requisições' }),
  buildModule({ id: 'units', workspace: 'Cadastros', label: 'Unidades' }),
  buildModule({ id: 'admin', workspace: 'Administração', label: 'Configurações' }),
]

function renderHome(props: React.ComponentProps<typeof HomePage>) {
  return render(
    <MemoryRouter>
      <HomePage {...props} />
    </MemoryRouter>,
  )
}

describe('HomePage', () => {
  it('exibe a saudação com o nome do usuário e a data por extenso', () => {
    renderHome({
      fullName: 'Marcelo Souza',
      now: new Date('2026-09-08T09:00:00'),
      modules,
      licensedModules: ['requests', 'units'],
      grantedPermissions: [],
    })

    expect(screen.getByText('Bom dia, Marcelo.')).toBeInTheDocument()
    expect(screen.getByText(/de setembro de 2026/)).toBeInTheDocument()
  })

  it('agrupa os módulos por área de trabalho', () => {
    renderHome({
      fullName: 'Marcelo Souza',
      now: new Date('2026-09-08T09:00:00'),
      modules,
      licensedModules: ['requests', 'units'],
      grantedPermissions: [],
    })

    const compras = screen.getByRole('heading', { name: 'Compras' }).closest('section')
    expect(compras).not.toBeNull()
    expect(within(compras as HTMLElement).getByText('Requisições')).toBeInTheDocument()
  })

  it('marca módulo não licenciado como indisponível', () => {
    renderHome({
      fullName: 'Marcelo Souza',
      now: new Date('2026-09-08T09:00:00'),
      modules,
      licensedModules: ['requests', 'units'],
      grantedPermissions: [],
    })

    expect(screen.getByText('não contratado')).toBeInTheDocument()
  })

  it('mostra "Beta" ao lado de módulos em beta', () => {
    renderHome({
      fullName: 'Marcelo Souza',
      now: new Date('2026-09-08T09:00:00'),
      modules,
      licensedModules: ['requests', 'units'],
      grantedPermissions: [],
    })

    expect(screen.getAllByText('Beta').length).toBeGreaterThan(0)
  })
})
