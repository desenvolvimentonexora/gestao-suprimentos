import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--color-bg)',
        surface: 'var(--color-surface)',
        ink: 'var(--color-ink)',
        'ink-muted': 'var(--color-ink-muted)',
        primary: 'var(--color-primary)',
        'primary-dark': 'var(--color-primary-dark)',
        'on-primary': 'var(--color-on-primary)',
        accent: 'var(--color-accent)',
        line: 'var(--color-line)',
        'badge-available': 'var(--color-badge-available)',
        'badge-beta': 'var(--color-badge-beta)',
        'badge-soon': 'var(--color-badge-soon)',
      },
      transitionDuration: {
        DEFAULT: '120ms',
      },
    },
  },
  plugins: [],
} satisfies Config
