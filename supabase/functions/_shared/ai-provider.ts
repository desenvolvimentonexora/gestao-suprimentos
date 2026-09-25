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

function stripCodeFence(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
  return fenced ? fenced[1] : text
}

export function parseExtractionResponse(text: string): ExtractedQuoteData {
  return JSON.parse(stripCodeFence(text)) as ExtractedQuoteData
}

async function extractPdfDataWithPrompt(pdfBase64: string, prompt: string): Promise<string> {
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
          { type: 'text', text: prompt },
        ],
      },
    ],
  })

  const textBlock = response.content.find((block) => block.type === 'text')
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('Resposta inesperada da API da Anthropic: nenhum bloco de texto retornado.')
  }
  return textBlock.text
}

export async function extractQuoteDataFromPdf(pdfBase64: string): Promise<ExtractedQuoteData> {
  const text = await extractPdfDataWithPrompt(pdfBase64, EXTRACTION_PROMPT)
  return parseExtractionResponse(text)
}

// Extração do PDF da própria Solicitação (SOL) — usada pelo caminho de
// importação alternativo (upload de PDF em vez de planilha). O comprador
// sempre revisa/completa os dados extraídos no formulário de cadastro antes
// de salvar; por isso, unitNameGuess e o código de cada item são só palpites
// — casados com unidades/materiais já cadastrados no front, nunca criados
// direto a partir do texto extraído.

export interface ExtractedRequestItem {
  code: string | null
  description: string
  quantity: number | null
  unitOfMeasure: string | null
}

export interface ExtractedRequestData {
  requestNumber: string | null
  unitNameGuess: string | null
  neededBy: string | null
  notes: string | null
  items: ExtractedRequestItem[]
}

const REQUEST_EXTRACTION_PROMPT = `Extraia os dados desta Solicitação de Compra (SOL, PDF) em JSON:
- requestNumber: número da solicitação, como texto (ex.: "1026"), ou null se não encontrar
- unitNameGuess: nome da obra/unidade/centro de custo mencionado no documento, como texto, ou null se não encontrar
- neededBy: data de entrega desejada, no formato AAAA-MM-DD, ou null se não houver
- notes: observação do documento, como texto, ou null se não houver

Para cada item da lista, retorne:
- code: código do insumo, como texto (ex.: "027818-005"), ou null se não houver
- description: descrição/discriminação do item, como texto
- quantity: quantidade, como número, ou null se não estiver informada
- unitOfMeasure: unidade de medida (ex.: "UN", "sc", "m³"), ou null se não houver

Não invente nenhum valor — se o PDF não trouxer uma informação de forma clara, retorne null.

Responda apenas com um JSON no formato {"requestNumber": ..., "unitNameGuess": ..., "neededBy": ..., "notes": ..., "items": [...]}, sem nenhum texto adicional antes ou depois.`

export function parseRequestExtractionResponse(text: string): ExtractedRequestData {
  return JSON.parse(stripCodeFence(text)) as ExtractedRequestData
}

export async function extractRequestDataFromPdf(pdfBase64: string): Promise<ExtractedRequestData> {
  const text = await extractPdfDataWithPrompt(pdfBase64, REQUEST_EXTRACTION_PROMPT)
  return parseRequestExtractionResponse(text)
}
