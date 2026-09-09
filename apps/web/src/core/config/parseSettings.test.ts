import { describe, expect, it } from 'vitest'
import { InvalidSettingsError, parseSettings } from './parseSettings'

describe('parseSettings', () => {
  it('converte uma linha válida de settings em um objeto tipado', () => {
    const row = {
      theme: { primary: '#3A7769' },
      brand: { name: 'Nexora', tagline: 'Sistema de Gestão Integrado' },
      vocabulary: { unit: 'Obra' },
      currency: 'BRL',
    }

    expect(parseSettings(row)).toEqual({
      theme: { primary: '#3A7769' },
      brand: { name: 'Nexora', tagline: 'Sistema de Gestão Integrado' },
      vocabulary: { unit: 'Obra' },
      currency: 'BRL',
    })
  })

  it('lança InvalidSettingsError quando a moeda não tem 3 letras', () => {
    const row = { theme: {}, brand: {}, vocabulary: {}, currency: 'R$' }

    expect(() => parseSettings(row)).toThrow(InvalidSettingsError)
  })

  it('lança InvalidSettingsError quando vocabulary não é um mapa de strings', () => {
    const row = { theme: {}, brand: {}, vocabulary: { unit: 42 }, currency: 'BRL' }

    expect(() => parseSettings(row)).toThrow(InvalidSettingsError)
  })
})
