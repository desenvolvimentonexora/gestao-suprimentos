import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { ComingSoonButton } from './ComingSoonButton'

describe('ComingSoonButton', () => {
  it('mostra o rótulo e não exibe o aviso antes do clique', () => {
    render(<ComingSoonButton label="Buscar SOL sumida" />)
    expect(screen.getByRole('button', { name: 'Buscar SOL sumida' })).toBeInTheDocument()
    expect(screen.queryByText('Em breve')).not.toBeInTheDocument()
  })

  it('mostra "Em breve" ao clicar', async () => {
    const user = userEvent.setup()
    render(<ComingSoonButton label="Limpar NF" />)
    await user.click(screen.getByRole('button', { name: 'Limpar NF' }))
    expect(screen.getByText('Em breve')).toBeInTheDocument()
  })
})
