import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { SuprimentosPage } from './SuprimentosPage'

function renderPage(now = new Date('2026-09-08T09:00:00')) {
  return render(
    <MemoryRouter>
      <SuprimentosPage fullName="Marcelo Souza" onSignOut={vi.fn()} now={now} />
    </MemoryRouter>,
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
    render(
      <MemoryRouter>
        <SuprimentosPage fullName="Marcelo Souza" onSignOut={onSignOut} />
      </MemoryRouter>,
    )

    await userEvent.click(screen.getByRole('button', { name: /Sair da conta/ }))

    expect(onSignOut).toHaveBeenCalledTimes(1)
  })
})
