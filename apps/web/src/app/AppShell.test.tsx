import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { AppShell } from './AppShell'

describe('AppShell', () => {
  it('mostra o nome do tenant e o conteúdo', () => {
    render(
      <AppShell tenantName="Construtora Beta" userName="Marcelo" onSignOut={vi.fn()}>
        <p>Conteúdo da página</p>
      </AppShell>,
    )

    expect(screen.getByText('Construtora Beta')).toBeInTheDocument()
    expect(screen.getByText('Conteúdo da página')).toBeInTheDocument()
  })

  it('foca a busca ao pressionar "/"', async () => {
    render(
      <AppShell tenantName="Construtora Beta" userName="Marcelo" onSignOut={vi.fn()}>
        <p>Conteúdo</p>
      </AppShell>,
    )

    await userEvent.keyboard('/')

    expect(screen.getByPlaceholderText('Buscar…')).toHaveFocus()
  })

  it('não rouba o foco de outro campo ao digitar "/" nele', async () => {
    render(
      <AppShell tenantName="Construtora Beta" userName="Marcelo" onSignOut={vi.fn()}>
        <input aria-label="outro campo" />
      </AppShell>,
    )

    const outroCampo = screen.getByLabelText('outro campo')
    await userEvent.click(outroCampo)
    await userEvent.keyboard('/')

    expect(outroCampo).toHaveFocus()
  })

  it('abre o menu do usuário e chama onSignOut ao clicar em Sair', async () => {
    const onSignOut = vi.fn()
    render(
      <AppShell tenantName="Construtora Beta" userName="Marcelo" onSignOut={onSignOut}>
        <p>Conteúdo</p>
      </AppShell>,
    )

    await userEvent.click(screen.getByRole('button', { name: 'Marcelo' }))
    await userEvent.click(screen.getByRole('menuitem', { name: 'Sair' }))

    expect(onSignOut).toHaveBeenCalledTimes(1)
  })
})
