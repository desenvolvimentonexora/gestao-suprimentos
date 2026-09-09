import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { LeadTimePopup } from './LeadTimePopup'

describe('LeadTimePopup', () => {
  it('mostra o prazo atual e a nota sobre o ERP', () => {
    render(
      <LeadTimePopup
        isOpen
        onClose={vi.fn()}
        materialName="Cimento"
        initialDays={5}
        onSave={vi.fn()}
        isSaving={false}
      />,
    )
    expect(screen.getByLabelText(/prazo em dias/i)).toHaveValue(5)
    expect(screen.getByText(/importado do ERP/)).toBeInTheDocument()
  })

  it('chama onSave com o novo valor ao salvar', async () => {
    const onSave = vi.fn()
    render(
      <LeadTimePopup
        isOpen
        onClose={vi.fn()}
        materialName="Cimento"
        initialDays={null}
        onSave={onSave}
        isSaving={false}
      />,
    )

    await userEvent.type(screen.getByLabelText(/prazo em dias/i), '7')
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }))

    expect(onSave).toHaveBeenCalledWith(7)
  })
})
