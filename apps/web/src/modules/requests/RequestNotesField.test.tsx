import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { RequestNotesField } from './RequestNotesField'

describe('RequestNotesField', () => {
  it('mostra o valor inicial', () => {
    render(<RequestNotesField requestId="r1" initialValue="Confirmar com o fornecedor" onSave={vi.fn()} />)
    expect(screen.getByPlaceholderText('Adicionar observação...')).toHaveValue('Confirmar com o fornecedor')
  })

  it('chama onSave ao sair do campo', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn()
    render(<RequestNotesField requestId="r1" initialValue="" onSave={onSave} />)

    await user.type(screen.getByPlaceholderText('Adicionar observação...'), 'Nova observação')
    await user.tab()

    expect(onSave).toHaveBeenCalledWith('r1', 'Nova observação')
  })

  it('chama onSave ao clicar em "+ Adicionar"', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn()
    render(<RequestNotesField requestId="r1" initialValue="" onSave={onSave} />)

    await user.type(screen.getByPlaceholderText('Adicionar observação...'), 'Nova observação')
    await user.click(screen.getByRole('button', { name: '+ Adicionar' }))

    expect(onSave).toHaveBeenCalledWith('r1', 'Nova observação')
  })
})
