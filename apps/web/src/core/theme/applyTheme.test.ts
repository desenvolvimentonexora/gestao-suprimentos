import { describe, expect, it } from 'vitest'
import { applyTheme } from './applyTheme'

function createRoot() {
  return document.createElement('div')
}

describe('applyTheme', () => {
  it('converte cada token informado para "R G B" (para o Tailwind aceitar opacidade com bg-cor/NN)', () => {
    const root = createRoot()

    applyTheme({ primary: '#123456', accent: '#abcdef' }, root)

    expect(root.style.getPropertyValue('--color-primary')).toBe('18 52 86')
    expect(root.style.getPropertyValue('--color-accent')).toBe('171 205 239')
  })

  it('não altera variáveis para tokens não informados', () => {
    const root = createRoot()

    applyTheme({ primary: '#123456' }, root)

    expect(root.style.getPropertyValue('--color-background')).toBe('')
  })

  it('define as variáveis de marca (primaryDark, onPrimary) e de badge', () => {
    const root = createRoot()

    applyTheme(
      {
        primaryDark: '#0E0E0E',
        onPrimary: '#FFFFFF',
        badgeAvailable: '#3A7769',
        badgeBeta: '#B45309',
        badgeSoon: '#8A8F8C',
      },
      root,
    )

    expect(root.style.getPropertyValue('--color-primary-dark')).toBe('14 14 14')
    expect(root.style.getPropertyValue('--color-on-primary')).toBe('255 255 255')
    expect(root.style.getPropertyValue('--color-badge-available')).toBe('58 119 105')
    expect(root.style.getPropertyValue('--color-badge-beta')).toBe('180 83 9')
    expect(root.style.getPropertyValue('--color-badge-soon')).toBe('138 143 140')
  })

  it('define as variáveis de cor de status a partir de theme.status, sem tocar nas de marca', () => {
    const root = createRoot()

    applyTheme(
      {
        primary: '#3A7769',
        status: { atrasado: '#B91C1C', hoje: '#1D4ED8', noPrazo: '#047857', chegouArPendente: '#D97706' },
      },
      root,
    )

    expect(root.style.getPropertyValue('--color-primary')).toBe('58 119 105')
    expect(root.style.getPropertyValue('--color-status-atrasado')).toBe('185 28 28')
    expect(root.style.getPropertyValue('--color-status-hoje')).toBe('29 78 216')
    expect(root.style.getPropertyValue('--color-status-no-prazo')).toBe('4 120 87')
    expect(root.style.getPropertyValue('--color-status-chegou-ar-pendente')).toBe('217 119 6')
  })

  it('não define nenhuma variável de status quando theme.status não é informado', () => {
    const root = createRoot()

    applyTheme({ primary: '#3A7769' }, root)

    expect(root.style.getPropertyValue('--color-status-atrasado')).toBe('')
  })
})
