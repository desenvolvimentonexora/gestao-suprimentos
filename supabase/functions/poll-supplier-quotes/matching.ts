export function parseQuoteSubject(subject: string): string | null {
  let stripped = subject.trim()
  const prefixPattern = /^(re|fwd|fw)\s*:\s*/i
  while (prefixPattern.test(stripped)) {
    stripped = stripped.replace(prefixPattern, '').trim()
  }
  const match = stripped.match(/^Cota[cç][aã]o\s*[—-]\s*(.+)$/i)
  if (!match) return null
  const number = match[1].trim()
  return number === '' ? null : number
}

export type ParsedRequestNumber = { externalRef: string } | { sequenceNumber: number }

export function parseRequestNumber(value: string): ParsedRequestNumber | null {
  const trimmed = value.trim()
  if (trimmed === '') return null
  const solMatch = trimmed.match(/^SOL\s+(\d+)$/i)
  if (solMatch) return { sequenceNumber: Number(solMatch[1]) }
  return { externalRef: trimmed }
}

export function base64UrlToBase64(value: string): string {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/')
  const paddingNeeded = (4 - (base64.length % 4)) % 4
  return base64 + '='.repeat(paddingNeeded)
}

export interface QuoteRequestItem {
  id: string
  materialName: string
  quantity: number
  unitOfMeasure: string | null
}

export interface ExtractedQuoteItem {
  description: string
  quantity: number | null
  unitPrice: number
  leadTimeDays: number | null
}

export interface MatchedQuoteItem extends ExtractedQuoteItem {
  requestItemId: string | null
  confidence: number
}

const MATCH_THRESHOLD = 0.3

// Mesmo algoritmo de apps/web/src/modules/comparisons/matchExtractedItems.ts,
// duplicado aqui porque uma Edge Function não importa código do front — a
// duplicação é intencional (mesmo padrão já usado em dispatch-logic.ts).
function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
}

function similarity(a: string, b: string): number {
  const normalizedA = normalize(a)
  const normalizedB = normalize(b)

  if (normalizedA === normalizedB) return 1
  if (normalizedA.includes(normalizedB) || normalizedB.includes(normalizedA)) return 0.8

  const wordsA = new Set(normalizedA.split(/\s+/).filter(Boolean))
  const wordsB = new Set(normalizedB.split(/\s+/).filter(Boolean))
  const intersection = [...wordsA].filter((word) => wordsB.has(word))
  const union = new Set([...wordsA, ...wordsB])

  return union.size === 0 ? 0 : intersection.length / union.size
}

export function matchExtractedItems(
  extractedItems: ExtractedQuoteItem[],
  requestItems: QuoteRequestItem[],
): MatchedQuoteItem[] {
  return extractedItems.map((extracted) => {
    let bestMatch: { requestItemId: string; confidence: number } | null = null

    for (const requestItem of requestItems) {
      const confidence = similarity(extracted.description, requestItem.materialName)
      if (!bestMatch || confidence > bestMatch.confidence) {
        bestMatch = { requestItemId: requestItem.id, confidence }
      }
    }

    const matched = bestMatch && bestMatch.confidence >= MATCH_THRESHOLD ? bestMatch : null

    return {
      ...extracted,
      requestItemId: matched?.requestItemId ?? null,
      confidence: matched?.confidence ?? 0,
    }
  })
}
