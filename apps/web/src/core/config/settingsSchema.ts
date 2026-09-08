import { z } from 'zod'

export const themeSchema = z
  .object({
    bg: z.string().optional(),
    surface: z.string().optional(),
    ink: z.string().optional(),
    inkMuted: z.string().optional(),
    primary: z.string().optional(),
    accent: z.string().optional(),
    line: z.string().optional(),
    logoUrl: z.string().optional(),
  })
  .partial()

export const vocabularySchema = z.record(z.string(), z.string())

export const settingsSchema = z.object({
  theme: themeSchema,
  vocabulary: vocabularySchema,
  currency: z.string().length(3),
})

export type Theme = z.infer<typeof themeSchema>
export type Vocabulary = z.infer<typeof vocabularySchema>
export type Settings = z.infer<typeof settingsSchema>
