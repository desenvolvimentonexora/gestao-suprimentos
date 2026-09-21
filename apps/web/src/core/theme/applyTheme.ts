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

// Cores semânticas de status (separadas da paleta de marca acima — ver
// settingsSchema.ts). Aplicadas à parte porque `theme.status` chega como
// objeto aninhado, não uma chave de cor direta como as outras.
const STATUS_CSS_VARS = {
  atrasado: '--color-status-atrasado',
  hoje: '--color-status-hoje',
  noPrazo: '--color-status-no-prazo',
  chegouArPendente: '--color-status-chegou-ar-pendente',
} as const

export type ThemeKey = keyof typeof THEME_CSS_VARS
export type StatusColorKey = keyof typeof STATUS_CSS_VARS
export interface ThemeTokens extends Partial<Record<ThemeKey, string>> {
  status?: Partial<Record<StatusColorKey, string>>
}

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
  for (const key of Object.keys(theme)) {
    if (key === 'status') continue
    const themeKey = key as ThemeKey
    const value = theme[themeKey]
    if (value) root.style.setProperty(THEME_CSS_VARS[themeKey], hexToRgbTriplet(value))
  }

  for (const key of Object.keys(theme.status ?? {}) as StatusColorKey[]) {
    const value = theme.status?.[key]
    if (value) root.style.setProperty(STATUS_CSS_VARS[key], hexToRgbTriplet(value))
  }
}
