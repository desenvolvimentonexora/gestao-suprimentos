import { assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts'
import { parseRequestExtractionResponse } from './ai-provider.ts'

Deno.test('parseRequestExtractionResponse lê um JSON puro', () => {
  const result = parseRequestExtractionResponse(
    '{"requestNumber":"1026","unitNameGuess":"Up Grauça","neededBy":"2026-08-12","notes":null,"items":[{"code":"027818-005","description":"Abraçadeira","quantity":90,"unitOfMeasure":"UN"}]}',
  )
  assertEquals(result, {
    requestNumber: '1026',
    unitNameGuess: 'Up Grauça',
    neededBy: '2026-08-12',
    notes: null,
    items: [{ code: '027818-005', description: 'Abraçadeira', quantity: 90, unitOfMeasure: 'UN' }],
  })
})

Deno.test('parseRequestExtractionResponse remove cerca de código ```json ... ```', () => {
  const text =
    '```json\n{"requestNumber":null,"unitNameGuess":null,"neededBy":null,"notes":null,"items":[]}\n```'
  const result = parseRequestExtractionResponse(text)
  assertEquals(result.items, [])
  assertEquals(result.requestNumber, null)
})

Deno.test('parseRequestExtractionResponse aceita todos os campos ausentes (documento ilegível)', () => {
  const text = '{"requestNumber":null,"unitNameGuess":null,"neededBy":null,"notes":null,"items":[]}'
  const result = parseRequestExtractionResponse(text)
  assertEquals(result, { requestNumber: null, unitNameGuess: null, neededBy: null, notes: null, items: [] })
})
