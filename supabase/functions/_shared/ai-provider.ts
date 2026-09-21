import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.32.1'

// Isolamento do provedor de IA (Anthropic/Claude) — nenhum outro lugar do
// código deve chamar a API da Anthropic diretamente; trocar de provedor no
// futuro deve ser uma mudança só neste arquivo.

export interface ExtractedQuoteItem {
  description: string
  quantity: number | null
  unitPrice: number
  leadTimeDays: number | null
}

export interface ExtractedQuoteData {
  items: ExtractedQuoteItem[]
  freight: number | null
  paymentTerms: string | null
}

const EXTRACTION_PROMPT = `Extraia os dados deste orçamento (PDF) em JSON. Para cada item, retorne:
- description: nome do material/insumo, como texto
- quantity: quantidade, como número, ou null se não estiver informada
- unitPrice: preço unitário, como número (sem símbolo de moeda)
- leadTimeDays: prazo de entrega em dias, como número inteiro, ou null se não estiver informado

Além dos itens, extraia também do documento como um todo (não por item):
- freight: valor do frete, como número (sem símbolo de moeda), ou null se o documento não trouxer essa informação de forma clara
- paymentTerms: condição de pagamento, como texto (ex.: "30 DDL", "à vista", "28 DDL - Boleto"), ou null se não estiver informada

Não invente valores de frete ou condição de pagamento — se o PDF não trouxer essa informação de forma explícita, retorne null.

Responda apenas com um JSON no formato {"items": [...], "freight": ..., "paymentTerms": ...}, sem nenhum texto adicional antes ou depois.`

export function parseExtractionResponse(text: string): ExtractedQuoteData {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
  const jsonText = fenced ? fenced[1] : text
  return JSON.parse(jsonText) as ExtractedQuoteData
}

export async function extractQuoteDataFromPdf(pdfBase64: string): Promise<ExtractedQuoteData> {
  const apiKey = Deno.env.get('ANTHROPIC_API_KEY')
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY não configurada.')

  const client = new Anthropic({ apiKey })

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 8192,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'document',
            source: { type: 'base64', media_type: 'application/pdf', data: pdfBase64 },
          },
          { type: 'text', text: EXTRACTION_PROMPT },
        ],
      },
    ],
  })

  const textBlock = response.content.find((block) => block.type === 'text')
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('Resposta inesperada da API da Anthropic: nenhum bloco de texto retornado.')
  }

  return parseExtractionResponse(textBlock.text)
}
