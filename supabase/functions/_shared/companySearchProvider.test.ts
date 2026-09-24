import { assertEquals, assertRejects } from 'https://deno.land/std@0.224.0/assert/mod.ts'
import { discoverByCnae, lookupContact } from './companySearchProvider.ts'

function stubFetch(response: Response): () => void {
  const original = globalThis.fetch
  globalThis.fetch = () => Promise.resolve(response)
  return () => {
    globalThis.fetch = original
  }
}

function withToken<T>(run: () => Promise<T>): Promise<T> {
  Deno.env.set('APIFY_TOKEN', 'test-token')
  return run().finally(() => Deno.env.delete('APIFY_TOKEN'))
}

const ATIVA = {
  cnpj: '11111111000111',
  razao_social: 'Empresa Ativa Ltda',
  nome_fantasia: 'Ativa',
  municipio: 'Sao Paulo',
  uf: 'SP',
  cnae_fiscal: 4711302,
  cnae_fiscal_descricao: 'Comércio varejista',
  porte: 'DEMAIS',
  situacao_cadastral: 'ATIVA',
}

const BAIXADA = {
  cnpj: '22222222000122',
  razao_social: 'Empresa Baixada Ltda',
  nome_fantasia: null,
  municipio: 'Sao Paulo',
  uf: 'SP',
  cnae_fiscal: 4711302,
  cnae_fiscal_descricao: 'Comércio varejista',
  porte: 'DEMAIS',
  situacao_cadastral: 'BAIXADA',
}

Deno.test('discoverByCnae descarta empresas que não estão ATIVA (BAIXADA, SUSPENSA, INAPTA, NULA)', async () => {
  const SUSPENSA = { ...BAIXADA, cnpj: '33333333000133', situacao_cadastral: 'SUSPENSA' }
  const INAPTA = { ...BAIXADA, cnpj: '44444444000144', situacao_cadastral: 'INAPTA' }
  const NULA = { ...BAIXADA, cnpj: '55555555000155', situacao_cadastral: 'NULA' }
  const restore = stubFetch(new Response(JSON.stringify([ATIVA, BAIXADA, SUSPENSA, INAPTA, NULA]), { status: 200 }))
  try {
    const result = await withToken(() => discoverByCnae('4711302', 'SP'))
    assertEquals(result.length, 1)
    assertEquals(result[0]!.cnpj, '11111111000111')
  } finally {
    restore()
  }
})

Deno.test('discoverByCnae mapeia os campos esperados pro candidato', async () => {
  const restore = stubFetch(new Response(JSON.stringify([ATIVA]), { status: 200 }))
  try {
    const result = await withToken(() => discoverByCnae('4711302', 'SP'))
    assertEquals(result[0], {
      razaoSocial: 'Empresa Ativa Ltda',
      nomeFantasia: 'Ativa',
      cnpj: '11111111000111',
      cidade: 'Sao Paulo',
      uf: 'SP',
      cnae: '4711302',
      cnaeDescricao: 'Comércio varejista',
      porte: 'DEMAIS',
    })
  } finally {
    restore()
  }
})

Deno.test('discoverByCnae devolve lista vazia quando não há nenhuma empresa ativa', async () => {
  const restore = stubFetch(new Response(JSON.stringify([BAIXADA]), { status: 200 }))
  try {
    const result = await withToken(() => discoverByCnae('4711302', 'SP'))
    assertEquals(result, [])
  } finally {
    restore()
  }
})

Deno.test('discoverByCnae lança erro claro quando a Apify falha', async () => {
  const restore = stubFetch(new Response('erro', { status: 500 }))
  try {
    await assertRejects(() => withToken(() => discoverByCnae('4711302', 'SP')), Error, 'Apify')
  } finally {
    restore()
  }
})

Deno.test('discoverByCnae lança erro claro quando APIFY_TOKEN não está configurado', async () => {
  await assertRejects(() => discoverByCnae('4711302', 'SP'), Error, 'APIFY_TOKEN')
})

Deno.test('lookupContact devolve o telefone quando o actor retorna', async () => {
  const restore = stubFetch(new Response(JSON.stringify([{ ...ATIVA, telefone1: '1140028922' }]), { status: 200 }))
  try {
    const result = await withToken(() => lookupContact('11111111000111'))
    assertEquals(result, { phone: '1140028922' })
  } finally {
    restore()
  }
})

Deno.test('lookupContact devolve { phone: null } (não null) quando o CNPJ é encontrado mas sem telefone público', async () => {
  const restore = stubFetch(new Response(JSON.stringify([ATIVA]), { status: 200 }))
  try {
    const result = await withToken(() => lookupContact('11111111000111'))
    assertEquals(result, { phone: null })
  } finally {
    restore()
  }
})

Deno.test('lookupContact devolve null quando o CNPJ não retorna nenhum item', async () => {
  const restore = stubFetch(new Response(JSON.stringify([]), { status: 200 }))
  try {
    const result = await withToken(() => lookupContact('00000000000000'))
    assertEquals(result, null)
  } finally {
    restore()
  }
})
