import { assert, assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts'
import { extractQuoteDataFromPdf } from './ai-provider.ts'

Deno.test('extractQuoteDataFromPdf retorna entre 2 e 3 itens simulados', async () => {
  const result = await extractQuoteDataFromPdf('base64-fake')
  assert(result.items.length >= 2 && result.items.length <= 3)
})

Deno.test('extractQuoteDataFromPdf retorna itens com os campos esperados e preenchidos', async () => {
  const result = await extractQuoteDataFromPdf('base64-fake')

  for (const item of result.items) {
    assertEquals(typeof item.description, 'string')
    assert(item.description.length > 0)
    assert(typeof item.unitPrice === 'number' && item.unitPrice > 0)
    assert(item.quantity === null || typeof item.quantity === 'number')
    assert(item.leadTimeDays === null || typeof item.leadTimeDays === 'number')
  }
})

Deno.test('extractQuoteDataFromPdf não depende do conteúdo do parâmetro recebido', async () => {
  const resultA = await extractQuoteDataFromPdf('qualquer-coisa')
  const resultB = await extractQuoteDataFromPdf('')
  assertEquals(resultA, resultB)
})
