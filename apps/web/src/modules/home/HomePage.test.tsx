import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { HomePage } from './HomePage'

function renderHome(now = new Date('2026-09-08T09:00:00')) {
  return render(
    <MemoryRouter>
      <HomePage fullName="Marcelo Souza" onSignOut={vi.fn()} now={now} />
    </MemoryRouter>,
  )
}

describe('HomePage', () => {
  it('exibe a saudação com o nome do usuário', () => {
    renderHome()
    expect(screen.getByText('Bom dia, Marcelo 👋')).toBeInTheDocument()
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
    render(
      <MemoryRouter>
        <HomePage
          fullName="Marcelo Souza"
          onSignOut={vi.fn()}
          now={new Date('2026-09-08T09:00:00')}
          pendingWork={{ dueTodayCount: 3, awaitingQuoteCount: 2 }}
        />
      </MemoryRouter>,
    )
    expect(screen.getByRole('link', { name: '3 requisições vencem hoje' })).toHaveAttribute(
      'href',
      '/suprimentos/disparo-solicitacoes',
    )
    expect(screen.getByRole('link', { name: '2 aguardando cotação' })).toHaveAttribute(
      'href',
      '/suprimentos/em-negociacao',
    )
  })

  it('chama onSignOut ao clicar em sair da conta', async () => {
    const onSignOut = vi.fn()
    render(
      <MemoryRouter>
        <HomePage fullName="Marcelo Souza" onSignOut={onSignOut} />
      </MemoryRouter>,
    )

    await userEvent.click(screen.getByRole('button', { name: /Sair da conta/ }))

    expect(onSignOut).toHaveBeenCalledTimes(1)
  })
})
