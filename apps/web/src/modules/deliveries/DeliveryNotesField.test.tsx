import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { DeliveryNotesField } from './DeliveryNotesField'

describe('DeliveryNotesField', () => {
  it('começa com a observação atual e o botão desabilitado', () => {
    render(<DeliveryNotesField notes="Combinado com o fornecedor" isSaving={false} onSave={vi.fn()} />)
    expect(screen.getByLabelText('Observações')).toHaveValue('Combinado com o fornecedor')
    expect(screen.getByRole('button', { name: '+ Add' })).toBeDisabled()
  })

  it('habilita o botão só depois de editar, e chama onSave com o texto novo', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn()
    render(<DeliveryNotesField notes={null} isSaving={false} onSave={onSave} />)

    await user.type(screen.getByLabelText('Observações'), 'Nova observação')
    const button = screen.getByRole('button', { name: '+ Add' })
    expect(button).not.toBeDisabled()

    await user.click(button)
    expect(onSave).toHaveBeenCalledWith('Nova observação')
  })

  it('desabilita o botão enquanto está salvando', async () => {
    const user = userEvent.setup()
    render(<DeliveryNotesField notes={null} isSaving onSave={vi.fn()} />)
    await user.type(screen.getByLabelText('Observações'), 'Texto')
    expect(screen.getByRole('button', { name: '+ Add' })).toBeDisabled()
  })
})
