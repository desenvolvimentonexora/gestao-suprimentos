import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { HomePage, type HomePageProps } from './HomePage'

function renderHome(props: Partial<HomePageProps> = {}) {
  const queryClient = new QueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <HomePage
          fullName="Marcelo Souza"
          onSignOut={vi.fn()}
          now={new Date('2026-09-08T09:00:00')}
          {...props}
        />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('HomePage', () => {
  it('exibe a saudação com o nome do usuário', () => {
    renderHome()
    expect(screen.getByText('Bom dia, Marcelo 👋')).toBeInTheDocument()
  })

  it('mostra a logo da Nexora', () => {
    renderHome()
    expect(screen.getByAltText('Nexora')).toBeInTheDocument()
  })

  it('lista todos os setores do registro', () => {
    renderHome()
    expect(screen.getByText('Suprimentos')).toBeInTheDocument()
    expect(screen.getByText('Engenharia')).toBeInTheDocument()
    expect(screen.getByText('Marketing')).toBeInTheDocument()
  })

  it('o card Suprimentos navega para /suprimentos', () => {
    renderHome()
    expect(screen.getByRole('link', { name: /Suprimentos/ })).toHaveAttribute(
      'href',
      '/suprimentos',
    )
  })

  it('não mostra a faixa de trabalho pendente quando não há dados', () => {
    renderHome()
    expect(screen.queryByText(/vence[m]? hoje/)).not.toBeInTheDocument()
  })

  it('mostra a faixa de trabalho pendente com links quando há dados', () => {
    renderHome({ pendingWork: { dueTodayCount: 3 } })
    expect(screen.getByRole('link', { name: '3 requisições vencem hoje' })).toHaveAttribute(
      'href',
      '/suprimentos/disparo-solicitacoes',
    )
  })

  it('chama onSignOut ao clicar em sair da conta', async () => {
    const onSignOut = vi.fn()
    renderHome({ onSignOut })

    await userEvent.click(screen.getByRole('button', { name: /Sair da conta/ }))

    expect(onSignOut).toHaveBeenCalledTimes(1)
  })

  it('abre o quadro de funcionalidades ao clicar no botão Funcionalidades', async () => {
    renderHome()

    await userEvent.click(screen.getByRole('button', { name: 'Abrir quadro de funcionalidades' }))

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Quadro de Funcionalidades')).toBeInTheDocument()
  })
})
