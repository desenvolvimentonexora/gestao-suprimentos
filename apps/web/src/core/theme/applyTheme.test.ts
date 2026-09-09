import { describe, expect, it } from 'vitest'
import { applyTheme } from './applyTheme'

function createRoot() {
  return document.createElement('div')
}

describe('applyTheme', () => {
  it('define a variável CSS correspondente para cada token informado', () => {
    const root = createRoot()

    applyTheme({ primary: '#123456', accent: '#abcdef' }, root)

    expect(root.style.getPropertyValue('--color-primary')).toBe('#123456')
    expect(root.style.getPropertyValue('--color-accent')).toBe('#abcdef')
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

    expect(root.style.getPropertyValue('--color-primary-dark')).toBe('#0E0E0E')
    expect(root.style.getPropertyValue('--color-on-primary')).toBe('#FFFFFF')
    expect(root.style.getPropertyValue('--color-badge-available')).toBe('#3A7769')
    expect(root.style.getPropertyValue('--color-badge-beta')).toBe('#B45309')
    expect(root.style.getPropertyValue('--color-badge-soon')).toBe('#8A8F8C')
  })
})
