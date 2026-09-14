const THEME_CSS_VARS = {
  background: '--color-bg',
  surface: '--color-surface',
  ink: '--color-ink',
  inkMuted: '--color-ink-muted',
  primary: '--color-primary',
  primaryDark: '--color-primary-dark',
  onPrimary: '--color-on-primary',
  accent: '--color-accent',
  line: '--color-line',
  badgeAvailable: '--color-badge-available',
  badgeBeta: '--color-badge-beta',
  badgeSoon: '--color-badge-soon',
} as const

export type ThemeKey = keyof typeof THEME_CSS_VARS
export type ThemeTokens = Partial<Record<ThemeKey, string>>

// Tailwind só aceita modificador de opacidade (bg-primary/50) quando a
// variável CSS guarda os componentes "R G B" separados por espaço, não um
// hex — por isso a conversão aqui, em vez de gravar o hex recebido direto.
function hexToRgbTriplet(hex: string): string {
  const normalized = hex.replace('#', '')
  const r = parseInt(normalized.slice(0, 2), 16)
  const g = parseInt(normalized.slice(2, 4), 16)
  const b = parseInt(normalized.slice(4, 6), 16)
  return `${r} ${g} ${b}`
}

export function applyTheme(
  theme: ThemeTokens,
  root: HTMLElement = document.documentElement,
): void {
  for (const key of Object.keys(theme) as ThemeKey[]) {
    const value = theme[key]
    if (value) root.style.setProperty(THEME_CSS_VARS[key], hexToRgbTriplet(value))
  }
}
