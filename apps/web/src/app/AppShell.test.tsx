import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { AppShell, type AppShellProps } from './AppShell'

function renderShell(
  props: Partial<AppShellProps> = {},
  children: ReactNode = <p>Conteúdo</p>,
  initialEntries: string[] = ['/'],
) {
  const queryClient = new QueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={initialEntries}>
        <AppShell
          userName="Marcelo"
          tenantId="tenant-1"
          userId="user-1"
          onSignOut={vi.fn()}
          {...props}
        >
          {children}
        </AppShell>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('AppShell', () => {
  it('mostra a logo da Nexora e o conteúdo', () => {
    renderShell({}, <p>Conteúdo da página</p>)

    expect(screen.getByAltText('Nexora')).toBeInTheDocument()
    expect(screen.getByText('Conteúdo da página')).toBeInTheDocument()
  })

  it('foca a busca ao pressionar "/"', async () => {
    renderShell()

    await userEvent.keyboard('/')

    expect(screen.getByPlaceholderText('Buscar…')).toHaveFocus()
  })

  it('não rouba o foco de outro campo ao digitar "/" nele', async () => {
    renderShell({}, <input aria-label="outro campo" />)

    const outroCampo = screen.getByLabelText('outro campo')
    await userEvent.click(outroCampo)
    await userEvent.keyboard('/')

    expect(outroCampo).toHaveFocus()
  })

  it('abre o menu do usuário e chama onSignOut ao clicar em Sair', async () => {
    const onSignOut = vi.fn()
    renderShell({ onSignOut })

    await userEvent.click(screen.getByRole('button', { name: 'Marcelo' }))
    await userEvent.click(screen.getByRole('menuitem', { name: 'Sair' }))

    expect(onSignOut).toHaveBeenCalledTimes(1)
  })

  it('usa a cor escura da marca na barra superior, para casar com o topo em degradê das telas de trabalho', () => {
    renderShell()

    expect(screen.getByAltText('Nexora').closest('header')?.className).toContain('bg-primary-dark')
  })

  it('não mostra o item Administração para quem não é admin', async () => {
    renderShell()

    await userEvent.click(screen.getByRole('button', { name: 'Marcelo' }))

    expect(screen.queryByRole('menuitem', { name: 'Administração' })).not.toBeInTheDocument()
  })

  it('mostra o item Administração no menu para admins', async () => {
    renderShell({ isAdmin: true })

    await userEvent.click(screen.getByRole('button', { name: 'Marcelo' }))

    expect(screen.getByRole('menuitem', { name: 'Administração' })).toHaveAttribute('href', '/admin')
  })

  it('abre o quadro de funcionalidades ao clicar no botão do quadro', async () => {
    renderShell()

    await userEvent.click(screen.getByRole('button', { name: 'Abrir quadro de funcionalidades' }))

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Quadro de Funcionalidades')).toBeInTheDocument()
  })

  it('também abre o quadro de funcionalidades pelo item "Funcionalidades" no menu do usuário', async () => {
    renderShell()

    await userEvent.click(screen.getByRole('button', { name: 'Marcelo' }))
    await userEvent.click(screen.getByRole('menuitem', { name: 'Funcionalidades' }))

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Quadro de Funcionalidades')).toBeInTheDocument()
  })

  it('mostra o botão de voltar para Suprimentos ao lado de Funcionalidades nas telas do setor', () => {
    renderShell({}, <p>Conteúdo</p>, ['/suprimentos/unidades'])

    expect(screen.getByRole('link', { name: '← Suprimentos' })).toHaveAttribute('href', '/suprimentos')
  })

  it('não mostra o botão de voltar para Suprimentos fora das telas do setor', () => {
    renderShell({}, <p>Conteúdo</p>, ['/admin'])

    expect(screen.queryByRole('link', { name: '← Suprimentos' })).not.toBeInTheDocument()
  })
})
