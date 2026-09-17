import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { VocabularySection } from './VocabularySection'

const vocabulary = { unit: 'Obra', request: 'SOL', supplier: 'Fornecedor', material: 'Material' }

describe('VocabularySection', () => {
  it('pré-preenche cada rótulo com o valor atual', () => {
    render(<VocabularySection vocabulary={vocabulary} onSave={vi.fn()} isSaving={false} />)
    expect(screen.getByLabelText('Unidade')).toHaveValue('Obra')
    expect(screen.getByLabelText('Requisição / SOL')).toHaveValue('SOL')
    expect(screen.getByLabelText('Fornecedor')).toHaveValue('Fornecedor')
    expect(screen.getByLabelText('Material')).toHaveValue('Material')
  })

  it('chama onSave com os valores editados', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn()
    render(<VocabularySection vocabulary={vocabulary} onSave={onSave} isSaving={false} />)

    const unitInput = screen.getByLabelText('Unidade')
    await user.clear(unitInput)
    await user.type(unitInput, 'Loja')
    await user.click(screen.getByRole('button', { name: /salvar/i }))

    expect(onSave).toHaveBeenCalledWith({ unit: 'Loja', request: 'SOL', supplier: 'Fornecedor', material: 'Material' })
  })

  it('desabilita o botão salvar enquanto está salvando', () => {
    render(<VocabularySection vocabulary={vocabulary} onSave={vi.fn()} isSaving />)
    expect(screen.getByRole('button', { name: /salvar/i })).toBeDisabled()
  })
})
