import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { SuprimentosPage, type SuprimentosPageProps } from './SuprimentosPage'

function renderPage(props: Partial<SuprimentosPageProps> = {}) {
  const queryClient = new QueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <SuprimentosPage
          fullName="Marcelo Souza"
          onSignOut={vi.fn()}
          now={new Date('2026-09-08T09:00:00')}
          {...props}
        />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('SuprimentosPage', () => {
  it('exibe a saudação com o nome do usuário', () => {
    renderPage()
    expect(screen.getByText('Bom dia, Marcelo 👋')).toBeInTheDocument()
  })

  it('lista as ferramentas de Suprimentos, com Agenda de Fornecedores primeiro', () => {
    renderPage()
    const labels = screen
      .getAllByText(/Agenda de Fornecedores|Análise de Solicitações/)
      .map((el) => el.textContent)
    expect(labels[0]).toBe('Agenda de Fornecedores')
  })

  it('o card Agenda de Fornecedores navega para a rota certa', () => {
    renderPage()
    expect(screen.getByRole('link', { name: /Agenda de Fornecedores/ })).toHaveAttribute(
      'href',
      '/suprimentos/agenda-fornecedores',
    )
  })

  it('o botão "Setores" volta para a Home', () => {
    renderPage()
    expect(screen.getByRole('link', { name: /Setores/ })).toHaveAttribute('href', '/')
  })

  it('chama onSignOut ao clicar em sair da conta', async () => {
    const onSignOut = vi.fn()
    renderPage({ onSignOut })

    await userEvent.click(screen.getByRole('button', { name: /Sair da conta/ }))

    expect(onSignOut).toHaveBeenCalledTimes(1)
  })

  it('abre o quadro de funcionalidades ao clicar no botão Suporte', async () => {
    renderPage()

    await userEvent.click(screen.getByRole('button', { name: 'Abrir suporte' }))

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Quadro de Funcionalidades')).toBeInTheDocument()
  })

  it('mostra o ícone de perfil, com o nome e o sair dentro do menu', async () => {
    renderPage()

    expect(screen.queryByText('Marcelo Souza')).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Menu de Marcelo Souza' }))

    expect(screen.getByText('Marcelo Souza')).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'Sair' })).toBeInTheDocument()
  })

  it('não mostra o item Administração para quem não é admin', async () => {
    renderPage()

    await userEvent.click(screen.getByRole('button', { name: 'Menu de Marcelo Souza' }))

    expect(screen.queryByRole('menuitem', { name: 'Administração' })).not.toBeInTheDocument()
  })

  it('mostra o item Administração no menu para admins', async () => {
    renderPage({ isAdmin: true })

    await userEvent.click(screen.getByRole('button', { name: 'Menu de Marcelo Souza' }))

    expect(screen.getByRole('menuitem', { name: 'Administração' })).toHaveAttribute('href', '/admin')
  })
})
