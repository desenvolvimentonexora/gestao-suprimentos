import { describe, expect, it } from 'vitest'
import { InvalidSettingsError, parseSettings } from './parseSettings'

describe('parseSettings', () => {
  it('converte uma linha válida de settings em um objeto tipado', () => {
    const row = {
      theme: { primary: '#1F3A5F' },
      vocabulary: { unit: 'Obra' },
      currency: 'BRL',
    }

    expect(parseSettings(row)).toEqual({
      theme: { primary: '#1F3A5F' },
      vocabulary: { unit: 'Obra' },
      currency: 'BRL',
    })
  })

  it('lança InvalidSettingsError quando a moeda não tem 3 letras', () => {
    const row = { theme: {}, vocabulary: {}, currency: 'R$' }

    expect(() => parseSettings(row)).toThrow(InvalidSettingsError)
  })

  it('lança InvalidSettingsError quando vocabulary não é um mapa de strings', () => {
    const row = { theme: {}, vocabulary: { unit: 42 }, currency: 'BRL' }

    expect(() => parseSettings(row)).toThrow(InvalidSettingsError)
  })
})
