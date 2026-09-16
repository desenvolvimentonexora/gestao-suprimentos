import { assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts'
import { parseExtractionResponse } from './ai-provider.ts'

Deno.test('parseExtractionResponse lê um JSON puro', () => {
  const result = parseExtractionResponse(
    '{"items":[{"description":"Cimento","quantity":50,"unitPrice":32.5,"leadTimeDays":5}],"freight":null,"paymentTerms":null}',
  )
  assertEquals(result, {
    items: [{ description: 'Cimento', quantity: 50, unitPrice: 32.5, leadTimeDays: 5 }],
    freight: null,
    paymentTerms: null,
  })
})

Deno.test('parseExtractionResponse remove cerca de código ```json ... ```', () => {
  const text =
    '```json\n{"items":[{"description":"Areia","quantity":12,"unitPrice":145,"leadTimeDays":4}],"freight":null,"paymentTerms":null}\n```'
  const result = parseExtractionResponse(text)
  assertEquals(result, {
    items: [{ description: 'Areia', quantity: 12, unitPrice: 145, leadTimeDays: 4 }],
    freight: null,
    paymentTerms: null,
  })
})

Deno.test('parseExtractionResponse remove cerca de código genérica ``` ... ```', () => {
  const text = '```\n{"items":[],"freight":null,"paymentTerms":null}\n```'
  const result = parseExtractionResponse(text)
  assertEquals(result, { items: [], freight: null, paymentTerms: null })
})

Deno.test('parseExtractionResponse remove texto antes/depois da cerca de código', () => {
  const text = 'Aqui está o JSON:\n```json\n{"items":[],"freight":null,"paymentTerms":null}\n```\nEspero que ajude.'
  const result = parseExtractionResponse(text)
  assertEquals(result, { items: [], freight: null, paymentTerms: null })
})

Deno.test('parseExtractionResponse preserva frete e condição de pagamento do documento', () => {
  const text = '{"items":[],"freight":150.75,"paymentTerms":"30 DDL"}'
  const result = parseExtractionResponse(text)
  assertEquals(result, { items: [], freight: 150.75, paymentTerms: '30 DDL' })
})

Deno.test('parseExtractionResponse aceita frete e pagamento ausentes (PDF não trouxe essa informação)', () => {
  const text = '{"items":[],"freight":null,"paymentTerms":null}'
  const result = parseExtractionResponse(text)
  assertEquals(result, { items: [], freight: null, paymentTerms: null })
})
