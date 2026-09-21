import { z } from 'zod'

// Cores semânticas de status de negócio (atraso, pendência, etc.) —
// separado da paleta de marca acima porque, por regra do produto (CLAUDE.md
// §7), essas cores nunca podem ser substituídas pela cor de marca — mas
// ainda são configuráveis por tenant, como qualquer outra cor (regra 4.1:
// nada de cor fixa no código). Cada consumidor (ex. deliveryStatus.ts)
// escolhe quais destas chaves usar; nem toda tela usa todas.
export const statusColorsSchema = z
  .object({
    atrasado: z.string().optional(),
    hoje: z.string().optional(),
    noPrazo: z.string().optional(),
    chegouArPendente: z.string().optional(),
  })
  .partial()

export const themeSchema = z
  .object({
    primary: z.string().optional(),
    primaryDark: z.string().optional(),
    onPrimary: z.string().optional(),
    surface: z.string().optional(),
    background: z.string().optional(),
    ink: z.string().optional(),
    inkMuted: z.string().optional(),
    line: z.string().optional(),
    accent: z.string().optional(),
    badgeAvailable: z.string().optional(),
    badgeBeta: z.string().optional(),
    badgeSoon: z.string().optional(),
    status: statusColorsSchema.optional(),
  })
  .partial()

export const brandSchema = z
  .object({
    name: z.string().optional(),
    tagline: z.string().optional(),
    logoUrl: z.string().optional(),
  })
  .partial()

export const vocabularySchema = z.record(z.string(), z.string())

export const settingsSchema = z.object({
  theme: themeSchema,
  brand: brandSchema,
  vocabulary: vocabularySchema,
  currency: z.string().length(3),
  modules: z.array(z.string()).default([]),
})

export type Theme = z.infer<typeof themeSchema>
export type StatusColors = z.infer<typeof statusColorsSchema>
export type Brand = z.infer<typeof brandSchema>
export type Vocabulary = z.infer<typeof vocabularySchema>
export type Settings = z.infer<typeof settingsSchema>
