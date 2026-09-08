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

    expect(root.style.getPropertyValue('--color-bg')).toBe('')
  })
})
