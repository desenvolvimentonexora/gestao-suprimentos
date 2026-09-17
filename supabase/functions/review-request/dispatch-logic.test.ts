import { assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts'
import {
  buildBlockedReason,
  buildDispatchEmail,
  buildSendFailureReason,
  formatRequestNumber,
  groupItemsBySupplier,
  type DispatchRequestItem,
  type SupplierEmailOption,
} from './dispatch-logic.ts'

const cimento: DispatchRequestItem = {
  materialId: 'mat-cimento',
  materialName: 'Cimento CP-32',
  quantity: 50,
  unitOfMeasure: 'saco',
}
const areia: DispatchRequestItem = {
  materialId: 'mat-areia',
  materialName: 'Areia',
  quantity: 10,
  unitOfMeasure: 'm³',
}

const fornecedorA: SupplierEmailOption = {
  supplierId: 'sup-a',
  supplierName: 'Fornecedor A',
  email: 'fornecedora@example.com',
}
const fornecedorB: SupplierEmailOption = {
  supplierId: 'sup-b',
  supplierName: 'Fornecedor B',
  email: 'fornecedorb@example.com',
}

Deno.test('groupItemsBySupplier agrupa um fornecedor que atende dois insumos num só grupo', () => {
  const result = groupItemsBySupplier(
    [cimento, areia],
    new Map([
      ['mat-cimento', [fornecedorA]],
      ['mat-areia', [fornecedorA]],
    ]),
  )
  if (!result.ok) throw new Error('esperava sucesso')
  assertEquals(result.groups.length, 1)
  assertEquals(result.groups[0].supplierId, 'sup-a')
  assertEquals(result.groups[0].items, [cimento, areia])
})

Deno.test('groupItemsBySupplier manda pra todos os fornecedores cadastrados do insumo, sem cap', () => {
  const result = groupItemsBySupplier([cimento], new Map([['mat-cimento', [fornecedorA, fornecedorB]]]))
  if (!result.ok) throw new Error('esperava sucesso')
  assertEquals(result.groups.length, 2)
})

Deno.test('groupItemsBySupplier bloqueia tudo (sem envio parcial) quando um insumo não tem fornecedor', () => {
  const result = groupItemsBySupplier(
    [cimento, areia],
    new Map([
      ['mat-cimento', [fornecedorA]],
      ['mat-areia', []],
    ]),
  )
  assertEquals(result.ok, false)
  if (result.ok) throw new Error('esperava bloqueio')
  assertEquals(result.missingMaterialNames, ['Areia'])
})

Deno.test('groupItemsBySupplier lista todos os insumos sem fornecedor, não só o primeiro', () => {
  const result = groupItemsBySupplier(
    [cimento, areia],
    new Map([
      ['mat-cimento', []],
      ['mat-areia', []],
    ]),
  )
  assertEquals(result.ok, false)
  if (result.ok) throw new Error('esperava bloqueio')
  assertEquals(result.missingMaterialNames, ['Cimento CP-32', 'Areia'])
})

Deno.test('buildBlockedReason monta a mensagem com os insumos separados por vírgula', () => {
  assertEquals(
    buildBlockedReason(['Cimento CP-32', 'Areia']),
    'Sem fornecedor cadastrado para: Cimento CP-32, Areia',
  )
})

Deno.test('buildSendFailureReason menciona quem falhou e quem já recebeu e-mail', () => {
  assertEquals(
    buildSendFailureReason('Fornecedor B', ['Fornecedor A']),
    'Falha ao enviar pra Fornecedor B; Fornecedor A já recebeu e-mail — não reenviar.',
  )
})

Deno.test('buildSendFailureReason não menciona "já recebeu" quando ninguém recebeu ainda', () => {
  assertEquals(buildSendFailureReason('Fornecedor A', []), 'Falha ao enviar pra Fornecedor A.')
})

Deno.test('formatRequestNumber usa o número externo quando existe', () => {
  assertEquals(formatRequestNumber('1243', 42), '1243')
})

Deno.test('formatRequestNumber cai pra "SOL {sequência}" sem número externo', () => {
  assertEquals(formatRequestNumber(null, 42), 'SOL 42')
})

Deno.test('buildDispatchEmail lista só os insumos do grupo, com quantidade e unidade', () => {
  const email = buildDispatchEmail(
    { supplierId: 'sup-a', supplierName: 'Fornecedor A', email: 'fornecedora@example.com', items: [cimento] },
    { requestNumber: '1243', unitLabel: 'Obra', unitName: 'Depósito Simões Filho', neededBy: '2026-09-20' },
  )
  assertEquals(email.to, 'fornecedora@example.com')
  assertEquals(email.subject, 'Cotação — 1243')
  assertEquals(email.body.includes('Cimento CP-32: 50 saco'), true)
  assertEquals(email.body.includes('Depósito Simões Filho'), true)
  assertEquals(email.body.includes('20/09/2026'), true)
})

Deno.test('buildDispatchEmail usa "a definir" quando não há prazo', () => {
  const email = buildDispatchEmail(
    { supplierId: 'sup-a', supplierName: 'Fornecedor A', email: 'fornecedora@example.com', items: [cimento] },
    { requestNumber: '1243', unitLabel: 'Obra', unitName: 'Depósito Simões Filho', neededBy: null },
  )
  assertEquals(email.body.includes('a definir'), true)
})
