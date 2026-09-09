import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { ModulePlaceholderPage } from './ModulePlaceholderPage'

describe('ModulePlaceholderPage', () => {
  it('informa que o módulo ainda está em construção', () => {
    render(
      <MemoryRouter>
        <ModulePlaceholderPage label="Requisições" />
      </MemoryRouter>,
    )
    expect(screen.getByRole('heading', { name: 'Requisições' })).toBeInTheDocument()
    expect(screen.getByText(/em construção/i)).toBeInTheDocument()
  })

  it('tem um link para voltar (padrão: Setores)', () => {
    render(
      <MemoryRouter>
        <ModulePlaceholderPage label="Requisições" />
      </MemoryRouter>,
    )
    expect(screen.getByRole('link', { name: /Setores/ })).toHaveAttribute('href', '/')
  })

  it('aceita uma rota e rótulo de volta customizados', () => {
    render(
      <MemoryRouter>
        <ModulePlaceholderPage label="Agenda de Fornecedores" backTo="/suprimentos" backLabel="Suprimentos" />
      </MemoryRouter>,
    )
    expect(screen.getByRole('link', { name: /Suprimentos/ })).toHaveAttribute(
      'href',
      '/suprimentos',
    )
  })
})
