import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // rgb(var(--x) / <alpha-value>), não var(--x) direto — é o formato
        // que permite ao Tailwind aplicar o modificador de opacidade
        // (bg-primary/50) sobre uma cor guardada em variável CSS.
        bg: 'rgb(var(--color-bg) / <alpha-value>)',
        surface: 'rgb(var(--color-surface) / <alpha-value>)',
        ink: 'rgb(var(--color-ink) / <alpha-value>)',
        'ink-muted': 'rgb(var(--color-ink-muted) / <alpha-value>)',
        primary: 'rgb(var(--color-primary) / <alpha-value>)',
        'primary-dark': 'rgb(var(--color-primary-dark) / <alpha-value>)',
        'on-primary': 'rgb(var(--color-on-primary) / <alpha-value>)',
        accent: 'rgb(var(--color-accent) / <alpha-value>)',
        line: 'rgb(var(--color-line) / <alpha-value>)',
        'badge-available': 'rgb(var(--color-badge-available) / <alpha-value>)',
        'badge-beta': 'rgb(var(--color-badge-beta) / <alpha-value>)',
        'badge-soon': 'rgb(var(--color-badge-soon) / <alpha-value>)',
        'status-atrasado': 'rgb(var(--color-status-atrasado) / <alpha-value>)',
        'status-hoje': 'rgb(var(--color-status-hoje) / <alpha-value>)',
        'status-no-prazo': 'rgb(var(--color-status-no-prazo) / <alpha-value>)',
        'status-chegou-ar-pendente': 'rgb(var(--color-status-chegou-ar-pendente) / <alpha-value>)',
      },
      transitionDuration: {
        DEFAULT: '120ms',
      },
    },
  },
  plugins: [],
} satisfies Config
