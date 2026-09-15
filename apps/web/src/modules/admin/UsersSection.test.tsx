import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { UsersSection } from './UsersSection'
import type { AdminUserRow, RoleOption } from './types'

const roles: RoleOption[] = [
  { id: 'r1', name: 'admin' },
  { id: 'r2', name: 'approver' },
]

const users: AdminUserRow[] = [
  {
    id: 'u1',
    fullName: 'Ana Souza',
    email: 'ana@construtora-beta.com',
    roleIds: ['r1'],
    roleNames: ['admin'],
    isActive: true,
  },
  {
    id: 'u2',
    fullName: 'Bruno Lima',
    email: 'bruno@construtora-beta.com',
    roleIds: ['r2'],
    roleNames: ['approver'],
    isActive: false,
  },
]

function baseProps() {
  return {
    users,
    roles,
    onOpenInvite: vi.fn(),
    onChangeRole: vi.fn(),
    onToggleActive: vi.fn(),
    isSaving: false,
  }
}

describe('UsersSection', () => {
  it('lista os usuários com nome, e-mail, papel e status', () => {
    render(<UsersSection {...baseProps()} />)
    expect(screen.getByText('Ana Souza')).toBeInTheDocument()
    expect(screen.getByText('ana@construtora-beta.com')).toBeInTheDocument()
    expect(screen.getByText('Bruno Lima')).toBeInTheDocument()
    expect(screen.getByText('Ativo')).toBeInTheDocument()
    expect(screen.getByText('Inativo')).toBeInTheDocument()
  })

  it('chama onOpenInvite ao clicar em convidar usuário', async () => {
    const user = userEvent.setup()
    const onOpenInvite = vi.fn()
    render(<UsersSection {...baseProps()} onOpenInvite={onOpenInvite} />)

    await user.click(screen.getByRole('button', { name: /convidar usuário/i }))

    expect(onOpenInvite).toHaveBeenCalled()
  })

  it('chama onChangeRole ao trocar o papel de um usuário', async () => {
    const user = userEvent.setup()
    const onChangeRole = vi.fn()
    render(<UsersSection {...baseProps()} onChangeRole={onChangeRole} />)

    await user.selectOptions(screen.getByLabelText('Papel de Ana Souza'), 'r2')

    expect(onChangeRole).toHaveBeenCalledWith('u1', 'r2')
  })

  it('chama onToggleActive para desativar um usuário ativo e ativar um inativo', async () => {
    const user = userEvent.setup()
    const onToggleActive = vi.fn()
    render(<UsersSection {...baseProps()} onToggleActive={onToggleActive} />)

    await user.click(screen.getByRole('button', { name: 'Desativar Ana Souza' }))
    expect(onToggleActive).toHaveBeenCalledWith('u1', false)

    await user.click(screen.getByRole('button', { name: 'Ativar Bruno Lima' }))
    expect(onToggleActive).toHaveBeenCalledWith('u2', true)
  })
})
