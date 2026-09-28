// Erros de Postgrest/Storage do supabase-js não são instâncias de `Error` —
// são objetos simples com `.message`. Sem isso, qualquer catch genérico vira
// "Erro desconhecido" e esconde a causa real.
export function describeError(error: unknown): string {
  if (error instanceof Error) return error.message
  if (error && typeof error === 'object' && 'message' in error && typeof (error as { message: unknown }).message === 'string') {
    return (error as { message: string }).message
  }
  try {
    return JSON.stringify(error)
  } catch {
    return String(error)
  }
}
