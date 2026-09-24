import { assertEquals, assertRejects } from 'https://deno.land/std@0.224.0/assert/mod.ts'
import { resolveCnae } from './cnaeResolver.ts'

function stubFetch(response: Response): () => void {
  const original = globalThis.fetch
  globalThis.fetch = () => Promise.resolve(response)
  return () => {
    globalThis.fetch = original
  }
}

Deno.test('resolveCnae devolve o CNAE, a descrição e a UF quando a Receita encontra o CNPJ', async () => {
  const restore = stubFetch(
    new Response(
      JSON.stringify({
        cnae_fiscal: 9430800,
        cnae_fiscal_descricao: 'Atividades de associações de defesa de direitos sociais',
        uf: 'SP',
      }),
      { status: 200 },
    ),
  )
  try {
    const result = await resolveCnae('19.131.243/0001-97')
    assertEquals(result, { cnae: '9430800', cnaeDescricao: 'Atividades de associações de defesa de direitos sociais', uf: 'SP' })
  } finally {
    restore()
  }
})

Deno.test('resolveCnae devolve null quando o CNPJ não é encontrado (404)', async () => {
  const restore = stubFetch(new Response(JSON.stringify({ message: 'não encontrado' }), { status: 404 }))
  try {
    const result = await resolveCnae('00000000000000')
    assertEquals(result, null)
  } finally {
    restore()
  }
})

Deno.test('resolveCnae lança erro claro quando a Receita responde com falha (ex.: fora do ar)', async () => {
  const restore = stubFetch(new Response('erro interno', { status: 500 }))
  try {
    await assertRejects(() => resolveCnae('19131243000197'), Error, 'status 500')
  } finally {
    restore()
  }
})

Deno.test('resolveCnae lança erro claro quando a resposta não traz CNAE', async () => {
  const restore = stubFetch(new Response(JSON.stringify({ uf: 'SP' }), { status: 200 }))
  try {
    await assertRejects(() => resolveCnae('19131243000197'), Error, 'CNAE')
  } finally {
    restore()
  }
})
