import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ModulesSection } from './ModulesSection'

describe('ModulesSection', () => {
  it('mostra um módulo implementado como ativável e marcado quando está na lista ativa', () => {
    render(<ModulesSection activeModuleIds={['agenda-fornecedores']} onToggle={vi.fn()} isSaving={false} />)
    const toggle = screen.getByRole('checkbox', { name: /agenda de fornecedores/i })
    expect(toggle).toBeChecked()
    expect(toggle).not.toBeDisabled()
  })

  it('mostra um módulo ainda não implementado desabilitado, com a nota "ainda não implementado"', () => {
    render(<ModulesSection activeModuleIds={[]} onToggle={vi.fn()} isSaving={false} />)
    const toggle = screen.getByRole('checkbox', { name: /cobrador de entregas/i })
    expect(toggle).toBeDisabled()
    expect(toggle).not.toBeChecked()
    expect(screen.getAllByText(/ainda não implementado/i).length).toBeGreaterThan(0)
  })

  it('chama onToggle com o id do módulo e o novo estado ao clicar', async () => {
    const user = userEvent.setup()
    const onToggle = vi.fn()
    render(<ModulesSection activeModuleIds={[]} onToggle={onToggle} isSaving={false} />)

    await user.click(screen.getByRole('checkbox', { name: /agenda de fornecedores/i }))

    expect(onToggle).toHaveBeenCalledWith('agenda-fornecedores', true)
  })
})
