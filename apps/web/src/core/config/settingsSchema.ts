import { z } from 'zod'

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
})

export type Theme = z.infer<typeof themeSchema>
export type Brand = z.infer<typeof brandSchema>
export type Vocabulary = z.infer<typeof vocabularySchema>
export type Settings = z.infer<typeof settingsSchema>
