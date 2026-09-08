import { z } from 'zod'
import { settingsSchema, type Settings } from './settingsSchema'

export class InvalidSettingsError extends Error {
  constructor(cause: z.ZodError) {
    super(
      `Configuração do cliente inválida: ${cause.issues
        .map((issue) => `${issue.path.join('.')} — ${issue.message}`)
        .join('; ')}.`,
    )
    this.name = 'InvalidSettingsError'
  }
}

export function parseSettings(row: unknown): Settings {
  const result = settingsSchema.safeParse(row)
  if (!result.success) throw new InvalidSettingsError(result.error)
  return result.data
}
