import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { InviteUserModal } from './InviteUserModal'
import type { RoleOption } from './types'

const roles: RoleOption[] = [
  { id: 'r1', name: 'admin' },
  { id: 'r2', name: 'approver' },
]

function baseProps() {
  return {
    isOpen: true,
    onClose: vi.fn(),
    roles,
    onInvite: vi.fn(),
    isSubmitting: false,
  }
}

describe('InviteUserModal', () => {
  it('exige nome, e-mail e papel', async () => {
    const user = userEvent.setup()
    const onInvite = vi.fn()
    render(<InviteUserModal {...baseProps()} onInvite={onInvite} />)

    await user.click(screen.getByRole('button', { name: /enviar convite/i }))

    expect(await screen.findAllByText('Campo obrigatório.')).not.toHaveLength(0)
    expect(onInvite).not.toHaveBeenCalled()
  })

  it('envia o convite com nome, e-mail e papel preenchidos', async () => {
    const user = userEvent.setup()
    const onInvite = vi.fn()
    render(<InviteUserModal {...baseProps()} onInvite={onInvite} />)

    await user.type(screen.getByLabelText('Nome'), 'Carla Dias')
    await user.type(screen.getByLabelText('E-mail'), 'carla@construtora-beta.com')
    await user.selectOptions(screen.getByLabelText('Papel'), 'r2')
    await user.click(screen.getByRole('button', { name: /enviar convite/i }))

    expect(onInvite).toHaveBeenCalledWith({
      fullName: 'Carla Dias',
      email: 'carla@construtora-beta.com',
      roleId: 'r2',
    })
  })

  it('não renderiza nada quando fechado', () => {
    render(<InviteUserModal {...baseProps()} isOpen={false} />)
    expect(screen.queryByLabelText('Nome')).not.toBeInTheDocument()
  })
})
