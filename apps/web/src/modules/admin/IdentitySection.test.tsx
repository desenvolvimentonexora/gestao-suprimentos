import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { applyTheme } from '../../core/theme'
import { IdentitySection } from './IdentitySection'

vi.mock('../../core/theme', () => ({ applyTheme: vi.fn() }))

const brand = {
  name: 'Nexora',
  subtitle: 'Gestão de Suprimentos',
  tagline: 'Sistema de Gestão Integrado',
  logoUrl: '/logo.svg',
}
const theme = { primary: '#3A7769', primaryDark: '#0E0E0E', accent: '#B45309' }

function baseProps() {
  return {
    brand,
    theme,
    onSave: vi.fn(),
    onUploadLogo: vi.fn().mockResolvedValue('/uploaded-logo.png'),
    isSaving: false,
  }
}

describe('IdentitySection', () => {
  it('pré-preenche os campos com os valores atuais', () => {
    render(<IdentitySection {...baseProps()} />)
    expect(screen.getByLabelText('Nome da marca')).toHaveValue('Nexora')
    expect(screen.getByLabelText('Tagline')).toHaveValue('Sistema de Gestão Integrado')
    expect(screen.getByLabelText('Cor primária (hex)')).toHaveValue('#3A7769')
  })

  it('pré-preenche e permite editar o subtítulo da marca', () => {
    render(<IdentitySection {...baseProps()} />)
    expect(screen.getByLabelText('Subtítulo da marca')).toHaveValue('Gestão de Suprimentos')
  })

  it('aplica o tema ao vivo assim que uma cor muda, sem precisar salvar', async () => {
    const user = userEvent.setup()
    render(<IdentitySection {...baseProps()} />)

    const primaryInput = screen.getByLabelText('Cor primária (hex)')
    await user.clear(primaryInput)
    await user.type(primaryInput, '#112233')

    expect(applyTheme).toHaveBeenCalledWith(expect.objectContaining({ primary: '#112233' }))
  })

  it('chama onSave com marca e tema atualizados ao enviar', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn()
    render(<IdentitySection {...baseProps()} onSave={onSave} />)

    const nameInput = screen.getByLabelText('Nome da marca')
    await user.clear(nameInput)
    await user.type(nameInput, 'Cliente X')
    await user.click(screen.getByRole('button', { name: /salvar identidade/i }))

    expect(onSave).toHaveBeenCalledWith({
      brand: {
        name: 'Cliente X',
        subtitle: 'Gestão de Suprimentos',
        tagline: 'Sistema de Gestão Integrado',
        logoUrl: '/logo.svg',
      },
      theme,
    })
  })

  it('desabilita o botão salvar enquanto está salvando', () => {
    render(<IdentitySection {...baseProps()} isSaving />)
    expect(screen.getByRole('button', { name: /salvar identidade/i })).toBeDisabled()
  })
})
