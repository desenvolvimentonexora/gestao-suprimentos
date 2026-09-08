import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { Input } from './Input'

describe('Input', () => {
  it('associa o rótulo ao campo', () => {
    render(<Input label="E-mail" />)
    expect(screen.getByLabelText('E-mail')).toBeInTheDocument()
  })

  it('aceita digitação e propaga o valor', async () => {
    render(<Input label="E-mail" />)
    const input = screen.getByLabelText('E-mail')

    await userEvent.type(input, 'ana@nexora.com')

    expect(input).toHaveValue('ana@nexora.com')
  })

  it('exibe a mensagem de erro quando informada', () => {
    render(<Input label="E-mail" error="E-mail obrigatório." />)
    expect(screen.getByText('E-mail obrigatório.')).toBeInTheDocument()
  })

  it('marca o campo como inválido para leitores de tela quando há erro', () => {
    render(<Input label="E-mail" error="E-mail obrigatório." />)
    expect(screen.getByLabelText('E-mail')).toHaveAttribute('aria-invalid', 'true')
  })
})
