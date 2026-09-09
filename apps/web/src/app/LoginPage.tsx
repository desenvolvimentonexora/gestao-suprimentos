import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Button, Input, PasswordInput } from '../components'
import { resetPasswordForEmail, signInWithPassword } from '../core/auth'
import type { Brand } from '../core/config'

export interface LoginPageProps {
  brand: Brand
  onLoginSuccess: () => void
}

const UPPER_LABEL = 'text-xs uppercase tracking-wide text-ink-muted'

const loginSchema = z.object({
  email: z.string().min(1, 'Informe o e-mail.').email('E-mail inválido.'),
  password: z.string().min(1, 'Informe a senha.'),
})

type LoginFormValues = z.infer<typeof loginSchema>

const forgotPasswordSchema = z.object({
  email: z.string().min(1, 'Informe o e-mail.').email('E-mail inválido.'),
})

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>

function LoginPanel({ brand }: { brand: Brand }) {
  return (
    <div className="flex flex-col items-center justify-between bg-gradient-to-t from-primary-dark to-primary px-8 py-10 text-on-primary sm:w-1/2">
      <img src={brand.logoUrl} alt={brand.name ?? ''} className="h-8" />
      <p className="max-w-xs text-center text-lg font-medium">{brand.tagline}</p>
      <img src="/assets/skyline.svg" alt="" className="w-full max-w-md" aria-hidden="true" />
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
      <Input
        label="E-mail"
        type="email"
        placeholder="voce@empresa.com"
        labelClassName={UPPER_LABEL}
        error={errors.email?.message}
        {...register('email')}
      />
      <PasswordInput
        label="Senha"
        labelClassName={UPPER_LABEL}
        error={errors.password?.message}
        {...register('password')}
      />
      {authError && <p className="text-sm text-accent">{authError}</p>}
      <Button type="submit" disabled={isSubmitting} className="w-full uppercase tracking-wide">
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
      <Input
        label="E-mail"
        type="email"
        labelClassName={UPPER_LABEL}
        error={errors.email?.message}
        {...register('email')}
      />
      <Button type="submit" disabled={isSubmitting} className="w-full uppercase tracking-wide">
        Enviar link de redefinição
      </Button>
    </form>
  )
}

export function LoginPage({ brand, onLoginSuccess }: LoginPageProps) {
  const [mode, setMode] = useState<'login' | 'forgot'>('login')

  return (
    <div className="flex min-h-screen flex-col sm:flex-row">
      <LoginPanel brand={brand} />
      <div className="flex flex-1 items-center justify-center bg-bg px-6 py-10">
        <div className="w-full max-w-[380px]">
          {mode === 'login' && (
            <>
              <h1 className="text-2xl font-semibold text-ink">Bem-vindo 👋</h1>
              <p className="mt-1 text-sm text-ink-muted">Faça login para continuar</p>
            </>
          )}
          <div className="mt-6">
            {mode === 'login' ? (
              <LoginForm onLoginSuccess={onLoginSuccess} />
            ) : (
              <ForgotPasswordForm />
            )}
          </div>
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
