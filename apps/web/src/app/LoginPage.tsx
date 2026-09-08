import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Button, Input, PasswordInput } from '../components'
import { resetPasswordForEmail, signInWithPassword } from '../core/auth'

export interface LoginPageProps {
  tenantName: string
  onLoginSuccess: () => void
}

const loginSchema = z.object({
  email: z.string().min(1, 'Informe o e-mail.').email('E-mail inválido.'),
  password: z.string().min(1, 'Informe a senha.'),
})

type LoginFormValues = z.infer<typeof loginSchema>

const forgotPasswordSchema = z.object({
  email: z.string().min(1, 'Informe o e-mail.').email('E-mail inválido.'),
})

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>

function LoginPanel({ tenantName }: { tenantName: string }) {
  return (
    <div className="flex flex-col justify-center bg-primary px-8 py-10 text-white sm:w-2/5 sm:px-12">
      <span className="text-xl font-semibold">{tenantName}</span>
      <p className="mt-3 max-w-sm text-sm text-white/85">
        Requisições, cotações e aprovações em um só lugar.
      </p>
    </div>
  )
}

function LoginForm({ onLoginSuccess }: { onLoginSuccess: () => void }) {
  const [authError, setAuthError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) })

  async function onSubmit(values: LoginFormValues) {
    setAuthError(null)
    const { session, errorMessage } = await signInWithPassword(values.email, values.password)
    if (errorMessage) {
      setAuthError(errorMessage)
      return
    }
    if (session) onLoginSuccess()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
      <Input label="E-mail" type="email" error={errors.email?.message} {...register('email')} />
      <PasswordInput label="Senha" error={errors.password?.message} {...register('password')} />
      {authError && <p className="text-sm text-accent">{authError}</p>}
      <Button type="submit" disabled={isSubmitting}>
        Entrar
      </Button>
    </form>
  )
}

function ForgotPasswordForm() {
  const [sent, setSent] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormValues>({ resolver: zodResolver(forgotPasswordSchema) })

  async function onSubmit(values: ForgotPasswordFormValues) {
    await resetPasswordForEmail(values.email)
    setSent(true)
  }

  if (sent) {
    return (
      <p className="text-sm text-ink-muted">
        Enviamos um link de redefinição para o e-mail informado, se ele existir.
      </p>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
      <Input label="E-mail" type="email" error={errors.email?.message} {...register('email')} />
      <Button type="submit" disabled={isSubmitting}>
        Enviar link de redefinição
      </Button>
    </form>
  )
}

export function LoginPage({ tenantName, onLoginSuccess }: LoginPageProps) {
  const [mode, setMode] = useState<'login' | 'forgot'>('login')

  return (
    <div className="flex min-h-screen flex-col sm:flex-row">
      <LoginPanel tenantName={tenantName} />
      <div className="flex flex-1 items-center justify-center bg-bg px-6 py-10">
        <div className="w-full max-w-[400px]">
          {mode === 'login' ? (
            <LoginForm onLoginSuccess={onLoginSuccess} />
          ) : (
            <ForgotPasswordForm />
          )}
          <button
            type="button"
            onClick={() => setMode(mode === 'login' ? 'forgot' : 'login')}
            className="mt-4 text-sm text-ink-muted underline-offset-2 hover:text-ink hover:underline"
          >
            {mode === 'login' ? 'Esqueci minha senha' : 'Voltar para o login'}
          </button>
        </div>
      </div>
    </div>
  )
}
