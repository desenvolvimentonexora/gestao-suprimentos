import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { LoginPage } from './LoginPage'
import * as auth from '../core/auth'

vi.mock('../core/auth', () => ({
  signInWithPassword: vi.fn(),
  resetPasswordForEmail: vi.fn(),
}))

const brand = {
  name: 'Nexora',
  tagline: 'Sistema de Gestão Integrado',
  logoUrl: '/assets/logo-nexora.svg',
}

describe('LoginPage', () => {
  beforeEach(() => {
    vi.mocked(auth.signInWithPassword).mockReset()
    vi.mocked(auth.resetPasswordForEmail).mockReset()
  })

  it('mostra a tagline da marca e as boas-vindas', () => {
    render(<LoginPage brand={brand} onLoginSuccess={vi.fn()} />)
    expect(screen.getByText('Sistema de Gestão Integrado')).toBeInTheDocument()
    expect(screen.getByText('Bem-vindo 👋')).toBeInTheDocument()
    expect(screen.getByText('Faça login para continuar')).toBeInTheDocument()
  })

  it('exibe erros de validação ao enviar o formulário vazio', async () => {
    render(<LoginPage brand={brand} onLoginSuccess={vi.fn()} />)

    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(await screen.findByText('Informe o e-mail.')).toBeInTheDocument()
    expect(screen.getByText('Informe a senha.')).toBeInTheDocument()
    expect(auth.signInWithPassword).not.toHaveBeenCalled()
  })

  it('chama signInWithPassword com e-mail e senha informados', async () => {
    vi.mocked(auth.signInWithPassword).mockResolvedValue({
      session: { access_token: 'x' } as never,
      errorMessage: null,
    })
    const onLoginSuccess = vi.fn()
    render(<LoginPage brand={brand} onLoginSuccess={onLoginSuccess} />)

    await userEvent.type(screen.getByLabelText('E-mail'), 'admin@nexora.com')
    await userEvent.type(screen.getByLabelText('Senha'), 'segredo123')
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(auth.signInWithPassword).toHaveBeenCalledWith('admin@nexora.com', 'segredo123')
    await waitFor(() => expect(onLoginSuccess).toHaveBeenCalledTimes(1))
  })

  it('mostra a mensagem de erro quando a autenticação falha', async () => {
    vi.mocked(auth.signInWithPassword).mockResolvedValue({
      session: null,
      errorMessage: 'E-mail ou senha incorretos.',
    })
    render(<LoginPage brand={brand} onLoginSuccess={vi.fn()} />)

    await userEvent.type(screen.getByLabelText('E-mail'), 'admin@nexora.com')
    await userEvent.type(screen.getByLabelText('Senha'), 'errada')
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(await screen.findByText('E-mail ou senha incorretos.')).toBeInTheDocument()
  })

  it('alterna para o formulário de redefinição de senha e envia o e-mail', async () => {
    vi.mocked(auth.resetPasswordForEmail).mockResolvedValue({ errorMessage: null })
    render(<LoginPage brand={brand} onLoginSuccess={vi.fn()} />)

    await userEvent.click(screen.getByRole('button', { name: 'Esqueci minha senha' }))
    await userEvent.type(screen.getByLabelText('E-mail'), 'admin@nexora.com')
    await userEvent.click(screen.getByRole('button', { name: 'Enviar link de redefinição' }))

    expect(auth.resetPasswordForEmail).toHaveBeenCalledWith('admin@nexora.com')
    expect(await screen.findByText(/enviamos um link de redefinição/i)).toBeInTheDocument()
  })
})
