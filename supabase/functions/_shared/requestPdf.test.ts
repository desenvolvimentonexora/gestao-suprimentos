import { assert, assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts'
import { generateRequestPdf } from './requestPdf.ts'

Deno.test('generateRequestPdf gera um PDF válido com os dados da solicitação', async () => {
  const bytes = await generateRequestPdf({
    requestNumber: 'SOL 1026',
    unitName: 'Up Grauça',
    requesterName: 'Aldrius Januario',
    createdAt: '2026-07-29T00:00:00Z',
    neededBy: '2026-08-12',
    notes: 'Material para fixação do desvio do térreo',
    items: [
      { materialCode: '027818-005', materialName: 'ABRAÇADEIRA TIPO "U" 5" X 150 MM', quantity: 90, unitOfMeasure: 'UN' },
      { materialCode: '027818-006', materialName: 'ABRAÇADEIRA TIPO "U" 6" X 200 MM', quantity: 90, unitOfMeasure: 'UN' },
    ],
  })

  assert(bytes.length > 0)
  const header = new TextDecoder().decode(bytes.slice(0, 5))
  assertEquals(header, '%PDF-')
})

Deno.test('generateRequestPdf funciona sem observação e sem solicitante (campos opcionais)', async () => {
  const bytes = await generateRequestPdf({
    requestNumber: 'SOL 42',
    unitName: 'UP São Lucas',
    requesterName: null,
    createdAt: '2026-01-01T00:00:00Z',
    neededBy: null,
    notes: null,
    items: [{ materialCode: null, materialName: 'Cimento', quantity: 10, unitOfMeasure: 'sc' }],
  })

  assert(bytes.length > 0)
})

Deno.test('generateRequestPdf lida com muitos itens gerando mais de uma página se preciso', async () => {
  const items = Array.from({ length: 80 }, (_, i) => ({
    materialCode: `COD-${i}`,
    materialName: `Item de teste número ${i}`,
    quantity: i + 1,
    unitOfMeasure: 'UN',
  }))
  const bytes = await generateRequestPdf({
    requestNumber: 'SOL 999',
    unitName: 'UP Pompeia',
    requesterName: 'Teste',
    createdAt: '2026-01-01T00:00:00Z',
    neededBy: null,
    notes: null,
    items,
  })

  assert(bytes.length > 0)
})
