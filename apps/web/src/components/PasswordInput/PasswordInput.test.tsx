import { createRef } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { PasswordInput } from './PasswordInput'

describe('PasswordInput', () => {
  it('começa como campo do tipo password', () => {
    render(<PasswordInput label="Senha" />)
    expect(screen.getByLabelText('Senha')).toHaveAttribute('type', 'password')
  })

  it('alterna entre mostrar e ocultar a senha ao clicar no botão', async () => {
    render(<PasswordInput label="Senha" />)

    await userEvent.click(screen.getByRole('button', { name: 'Mostrar senha' }))
    expect(screen.getByLabelText('Senha')).toHaveAttribute('type', 'text')

    await userEvent.click(screen.getByRole('button', { name: 'Ocultar senha' }))
    expect(screen.getByLabelText('Senha')).toHaveAttribute('type', 'password')
  })

  it('encaminha a ref para o elemento input (necessário para react-hook-form)', () => {
    const ref = createRef<HTMLInputElement>()
    render(<PasswordInput label="Senha" ref={ref} />)
    expect(ref.current).toBeInstanceOf(HTMLInputElement)
  })

  it('aceita uma classe extra para o rótulo sem alterar o texto exibido', () => {
    render(<PasswordInput label="Senha" labelClassName="uppercase text-xs" />)
    expect(screen.getByText('Senha')).toHaveClass('uppercase')
  })
})
