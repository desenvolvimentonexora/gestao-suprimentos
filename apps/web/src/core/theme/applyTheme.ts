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

export function applyTheme(
  theme: ThemeTokens,
  root: HTMLElement = document.documentElement,
): void {
  for (const key of Object.keys(theme) as ThemeKey[]) {
    const value = theme[key]
    if (value) root.style.setProperty(THEME_CSS_VARS[key], value)
  }
}
