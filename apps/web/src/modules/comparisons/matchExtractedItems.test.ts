import { describe, expect, it } from 'vitest'
import { matchExtractedItems } from './matchExtractedItems'
import type { ComparisonRequestItemRow, ExtractedQuoteItem } from './types'

const requestItems: ComparisonRequestItemRow[] = [
  { id: 'ri1', materialName: 'Argamassa', materialDescription: null, quantity: 20, unitOfMeasure: 'sc' },
  { id: 'ri2', materialName: 'Tinta', materialDescription: null, quantity: 5, unitOfMeasure: 'lt' },
]

describe('matchExtractedItems', () => {
  it('casa item com nome idêntico com confiança máxima', () => {
    const extracted: ExtractedQuoteItem[] = [
      { description: 'Argamassa', quantity: 20, unitPrice: 32.5, leadTimeDays: 5 },
    ]
    const result = matchExtractedItems(extracted, requestItems)
    expect(result[0]!).toMatchObject({ requestItemId: 'ri1', confidence: 1 })
  })

  it('casa ignorando maiúsculas/minúsculas e acentos', () => {
    const extracted: ExtractedQuoteItem[] = [
      { description: 'ARGAMASSA', quantity: 20, unitPrice: 32.5, leadTimeDays: 5 },
    ]
    const result = matchExtractedItems(extracted, requestItems)
    expect(result[0]!.requestItemId).toBe('ri1')
  })

  it('casa por inclusão parcial do nome, com confiança menor que 1', () => {
    const extracted: ExtractedQuoteItem[] = [
      { description: 'Argamassa colante AC-III', quantity: 20, unitPrice: 32.5, leadTimeDays: 5 },
    ]
    const result = matchExtractedItems(extracted, requestItems)
    expect(result[0]!.requestItemId).toBe('ri1')
    expect(result[0]!.confidence).toBeLessThan(1)
    expect(result[0]!.confidence).toBeGreaterThan(0)
  })

  it('não casa quando não há nenhuma semelhança e marca requestItemId nulo', () => {
    const extracted: ExtractedQuoteItem[] = [
      { description: 'Produto totalmente diferente xyz', quantity: 1, unitPrice: 10, leadTimeDays: null },
    ]
    const result = matchExtractedItems(extracted, requestItems)
    expect(result[0]!.requestItemId).toBeNull()
  })

  it('usa a descrição da variante para distinguir itens que compartilham o mesmo nome de material', () => {
    const variants: ComparisonRequestItemRow[] = [
      {
        id: 'v5',
        materialName: 'Abraçadeira Tipo U',
        materialDescription: 'ABRAÇADEIRA TIPO "U" 5" X 150 MM',
        quantity: 90,
        unitOfMeasure: 'un',
      },
      {
        id: 'v6',
        materialName: 'Abraçadeira Tipo U',
        materialDescription: 'ABRAÇADEIRA TIPO "U" 6" X 200 MM',
        quantity: 90,
        unitOfMeasure: 'un',
      },
    ]
    const extracted: ExtractedQuoteItem[] = [
      { description: 'ABRAÇADEIRA TIPO "U" 6" X 200 MM', quantity: 90, unitPrice: 6.4, leadTimeDays: null },
    ]
    const result = matchExtractedItems(extracted, variants)
    expect(result[0]!).toMatchObject({ requestItemId: 'v6', confidence: 1 })
  })

  it('preserva os dados originais extraídos no resultado', () => {
    const extracted: ExtractedQuoteItem[] = [
      { description: 'Tinta', quantity: 5, unitPrice: 89.9, leadTimeDays: 3 },
    ]
    const result = matchExtractedItems(extracted, requestItems)
    expect(result[0]!).toMatchObject({
      description: 'Tinta',
      quantity: 5,
      unitPrice: 89.9,
      leadTimeDays: 3,
    })
  })
})
