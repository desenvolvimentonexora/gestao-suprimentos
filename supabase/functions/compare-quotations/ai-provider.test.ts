import { assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts'
import { parseExtractionResponse } from './ai-provider.ts'

Deno.test('parseExtractionResponse lê um JSON puro', () => {
  const result = parseExtractionResponse('{"items":[{"description":"Cimento","quantity":50,"unitPrice":32.5,"leadTimeDays":5}]}')
  assertEquals(result, { items: [{ description: 'Cimento', quantity: 50, unitPrice: 32.5, leadTimeDays: 5 }] })
})

Deno.test('parseExtractionResponse remove cerca de código ```json ... ```', () => {
  const text = '```json\n{"items":[{"description":"Areia","quantity":12,"unitPrice":145,"leadTimeDays":4}]}\n```'
  const result = parseExtractionResponse(text)
  assertEquals(result, { items: [{ description: 'Areia', quantity: 12, unitPrice: 145, leadTimeDays: 4 }] })
})

Deno.test('parseExtractionResponse remove cerca de código genérica ``` ... ```', () => {
  const text = '```\n{"items":[]}\n```'
  const result = parseExtractionResponse(text)
  assertEquals(result, { items: [] })
})

Deno.test('parseExtractionResponse remove texto antes/depois da cerca de código', () => {
  const text = 'Aqui está o JSON:\n```json\n{"items":[]}\n```\nEspero que ajude.'
  const result = parseExtractionResponse(text)
  assertEquals(result, { items: [] })
})
