// Isolamento do provedor de IA (Gemini). Nenhum outro lugar do código deve
// chamar a API do Gemini diretamente — trocar de provedor no futuro deve
// ser uma mudança só neste arquivo.

export interface ExtractedQuoteItem {
  description: string
  quantity: number | null
  unitPrice: number
  leadTimeDays: number | null
}

export interface ExtractedQuoteData {
  items: ExtractedQuoteItem[]
}

const EXTRACTION_PROMPT = `Extraia os itens deste orçamento (PDF) em JSON. Para cada item, retorne:
- description: nome do material/insumo, como texto
- quantity: quantidade, como número, ou null se não estiver informada
- unitPrice: preço unitário, como número (sem símbolo de moeda)
- leadTimeDays: prazo de entrega em dias, como número inteiro, ou null se não estiver informado

Responda apenas com um JSON no formato {"items": [...]}, sem nenhum texto adicional antes ou depois.`

// TODO: o acesso à API do Gemini está bloqueado no momento (a chave retorna
// 403 "Your project has been denied access" mesmo após regenerada — parece
// ser um bloqueio no projeto do Google Cloud/AI Studio, não na chave em si).
// Enquanto isso não é resolvido com o suporte do Google, extractQuoteDataFromPdf
// usa a versão simulada abaixo. Quando o acesso for liberado, troque o corpo
// desta função para chamar extractQuoteDataFromPdfViaGemini — a assinatura
// já é a mesma, não muda nada em quem consome esta função.
export async function extractQuoteDataFromPdf(pdfBase64: string): Promise<ExtractedQuoteData> {
  return extractQuoteDataFromPdfMock(pdfBase64)
}

async function extractQuoteDataFromPdfMock(_pdfBase64: string): Promise<ExtractedQuoteData> {
  await new Promise((resolve) => setTimeout(resolve, 600))

  return {
    items: [
      { description: 'Cimento CP-II-32', quantity: 25, unitPrice: 34.9, leadTimeDays: 5 },
      { description: 'Areia média lavada', quantity: 8, unitPrice: 120, leadTimeDays: 3 },
      { description: 'Brita nº 1', quantity: 10, unitPrice: 98.5, leadTimeDays: 7 },
    ],
  }
}

async function extractQuoteDataFromPdfViaGemini(pdfBase64: string): Promise<ExtractedQuoteData> {
  const apiKey = Deno.env.get('GEMINI_API_KEY')
  if (!apiKey) throw new Error('GEMINI_API_KEY não configurada.')

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: EXTRACTION_PROMPT },
              { inline_data: { mime_type: 'application/pdf', data: pdfBase64 } },
            ],
          },
        ],
        generationConfig: { responseMimeType: 'application/json' },
      }),
    },
  )

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Falha ao chamar a API do Gemini (${response.status}): ${errorText}`)
  }

  const payload = await response.json()
  const text = payload?.candidates?.[0]?.content?.parts?.[0]?.text
  if (typeof text !== 'string') {
    throw new Error('Resposta inesperada da API do Gemini.')
  }

  return JSON.parse(text) as ExtractedQuoteData
}
