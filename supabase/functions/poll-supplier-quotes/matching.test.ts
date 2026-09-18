import { assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts'
import {
  base64UrlToBase64,
  matchExtractedItems,
  parseQuoteSubject,
  parseRequestNumber,
  type ExtractedQuoteItem,
  type QuoteRequestItem,
} from './matching.ts'

Deno.test('parseQuoteSubject extrai o número depois de "Cotação — "', () => {
  assertEquals(parseQuoteSubject('Cotação — 1243'), '1243')
})

Deno.test('parseQuoteSubject remove um "Re: " antes de casar', () => {
  assertEquals(parseQuoteSubject('Re: Cotação — 1243'), '1243')
})

Deno.test('parseQuoteSubject remove múltiplos prefixos Re:/Fwd: aninhados', () => {
  assertEquals(parseQuoteSubject('Fwd: Re: Fwd: Cotação — SOL 42'), 'SOL 42')
})

Deno.test('parseQuoteSubject aceita hífen simples além de travessão', () => {
  assertEquals(parseQuoteSubject('Cotação - 1243'), '1243')
})

Deno.test('parseQuoteSubject retorna null quando o assunto não bate com o padrão', () => {
  assertEquals(parseQuoteSubject('Segue orçamento em anexo'), null)
})

Deno.test('parseQuoteSubject retorna null quando não sobra número depois do padrão', () => {
  assertEquals(parseQuoteSubject('Cotação —   '), null)
})

Deno.test('parseRequestNumber reconhece o formato "SOL {sequência}"', () => {
  assertEquals(parseRequestNumber('SOL 42'), { sequenceNumber: 42 })
})

Deno.test('parseRequestNumber trata qualquer outro texto como número externo', () => {
  assertEquals(parseRequestNumber('1243'), { externalRef: '1243' })
})

Deno.test('parseRequestNumber retorna null pra string vazia', () => {
  assertEquals(parseRequestNumber('   '), null)
})

Deno.test('base64UrlToBase64 troca os caracteres e completa o padding', () => {
  // "hi" em base64url é "aGk" (sem padding); em base64 padrão é "aGk="
  assertEquals(base64UrlToBase64('aGk'), 'aGk=')
})

Deno.test('base64UrlToBase64 troca - e _ pelos caracteres padrão', () => {
  assertEquals(base64UrlToBase64('-_-_'), '+/+/')
})

const cimento: QuoteRequestItem = { id: 'ri1', materialName: 'Cimento CP-32', quantity: 50, unitOfMeasure: 'saco' }
const areia: QuoteRequestItem = { id: 'ri2', materialName: 'Areia', quantity: 10, unitOfMeasure: 'm³' }

Deno.test('matchExtractedItems casa por nome igual (confiança 1)', () => {
  const extracted: ExtractedQuoteItem[] = [
    { description: 'Cimento CP-32', quantity: 50, unitPrice: 32.5, leadTimeDays: 5 },
  ]
  const result = matchExtractedItems(extracted, [cimento, areia])
  assertEquals(result[0].requestItemId, 'ri1')
  assertEquals(result[0].confidence, 1)
})

Deno.test('matchExtractedItems não casa quando a descrição não tem nada em comum', () => {
  const extracted: ExtractedQuoteItem[] = [
    { description: 'Parafuso sextavado', quantity: 100, unitPrice: 0.5, leadTimeDays: 2 },
  ]
  const result = matchExtractedItems(extracted, [cimento, areia])
  assertEquals(result[0].requestItemId, null)
})
