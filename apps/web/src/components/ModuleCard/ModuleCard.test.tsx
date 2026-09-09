import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Package } from 'lucide-react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { ModuleCard } from './ModuleCard'

function renderCard(props: Partial<React.ComponentProps<typeof ModuleCard>> = {}) {
  return render(
    <MemoryRouter>
      <ModuleCard
        label="Suprimentos"
        description="Requisições, cotações e fornecedores"
        icon={Package}
        status="disponivel"
        {...props}
      />
    </MemoryRouter>,
  )
}

describe('ModuleCard', () => {
  it('renderiza nome, descrição e selo de status', () => {
    renderCard()
    expect(screen.getByText('Suprimentos')).toBeInTheDocument()
    expect(screen.getByText('Requisições, cotações e fornecedores')).toBeInTheDocument()
    expect(screen.getByText('DISPONÍVEL')).toBeInTheDocument()
  })

  it('vira um link para a rota quando informada', () => {
    renderCard({ route: '/suprimentos' })
    expect(screen.getByRole('link', { name: /Suprimentos/ })).toHaveAttribute(
      'href',
      '/suprimentos',
    )
  })

  it('mostra "Módulo ainda não disponível" ao clicar sem rota', async () => {
    renderCard({ status: 'beta' })

    await userEvent.click(screen.getByRole('button', { name: /Suprimentos/ }))

    expect(await screen.findByText('Módulo ainda não disponível')).toBeInTheDocument()
  })

  it('não é clicável quando o status é em-breve', () => {
    renderCard({ status: 'em-breve' })

    expect(screen.queryByRole('button')).not.toBeInTheDocument()
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
    expect(screen.getByText('Suprimentos').closest('[aria-disabled]')).toHaveAttribute(
      'aria-disabled',
      'true',
    )
  })
})
