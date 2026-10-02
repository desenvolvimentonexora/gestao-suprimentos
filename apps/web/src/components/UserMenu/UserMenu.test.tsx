import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { UserMenu } from './UserMenu'

describe('UserMenu', () => {
  it('mostra um ícone de perfil no lugar do nome, e só mostra o nome dentro do menu', async () => {
    render(<UserMenu userName="Marcelo" onSignOut={vi.fn()} />)

    expect(screen.queryByText('Marcelo')).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Menu de Marcelo' }))

    expect(screen.getByText('Marcelo')).toBeInTheDocument()
  })

  it('chama onSignOut ao clicar em Sair', async () => {
    const onSignOut = vi.fn()
    render(<UserMenu userName="Marcelo" onSignOut={onSignOut} />)

    await userEvent.click(screen.getByRole('button', { name: 'Menu de Marcelo' }))
    await userEvent.click(screen.getByRole('menuitem', { name: 'Sair' }))

    expect(onSignOut).toHaveBeenCalledTimes(1)
  })

  it('mostra itens extras passados como children, acima de Sair', async () => {
    render(
      <UserMenu userName="Marcelo" onSignOut={vi.fn()}>
        {() => (
          <button type="button" role="menuitem">
            Item extra
          </button>
        )}
      </UserMenu>,
    )

    await userEvent.click(screen.getByRole('button', { name: 'Menu de Marcelo' }))

    expect(screen.getByRole('menuitem', { name: 'Item extra' })).toBeInTheDocument()
  })

  it('fecha o menu ao clicar em um item extra que chama closeMenu', async () => {
    const onExtraClick = vi.fn()
    render(
      <UserMenu userName="Marcelo" onSignOut={vi.fn()}>
        {(closeMenu) => (
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              closeMenu()
              onExtraClick()
            }}
          >
            Item extra
          </button>
        )}
      </UserMenu>,
    )

    await userEvent.click(screen.getByRole('button', { name: 'Menu de Marcelo' }))
    await userEvent.click(screen.getByRole('menuitem', { name: 'Item extra' }))

    expect(onExtraClick).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('menuitem', { name: 'Item extra' })).not.toBeInTheDocument()
  })
})
