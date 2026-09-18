import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ComparisonNotes } from './ComparisonNotes'

describe('ComparisonNotes', () => {
  it('mostra o texto salvo', () => {
    render(<ComparisonNotes notes="Confirmar consumo com o engenheiro" onUpdateNotes={vi.fn()} />)
    expect(screen.getByLabelText('Observações')).toHaveValue('Confirmar consumo com o engenheiro')
  })

  it('mostra vazio quando não há observação salva', () => {
    render(<ComparisonNotes notes={null} onUpdateNotes={vi.fn()} />)
    expect(screen.getByLabelText('Observações')).toHaveValue('')
  })

  it('chama onUpdateNotes ao sair do campo', async () => {
    const user = userEvent.setup()
    const onUpdateNotes = vi.fn()
    render(<ComparisonNotes notes={null} onUpdateNotes={onUpdateNotes} />)

    await user.type(screen.getByLabelText('Observações'), 'Pedido de complemento')
    await user.tab()

    expect(onUpdateNotes).toHaveBeenCalledWith('Pedido de complemento')
  })
})
