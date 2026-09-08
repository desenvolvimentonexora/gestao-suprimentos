interface AuthErrorLike {
  message: string
}

const KNOWN_MESSAGES: Record<string, string> = {
  'Invalid login credentials': 'E-mail ou senha incorretos.',
}

const GENERIC_MESSAGE = 'Não foi possível entrar. Tente novamente em instantes.'

export function mapAuthErrorMessage(error: AuthErrorLike | null): string | null {
  if (!error) return null
  return KNOWN_MESSAGES[error.message] ?? GENERIC_MESSAGE
}
