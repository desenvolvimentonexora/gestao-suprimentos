import type { ComparisonRequestItemRow, ExtractedItemReview, ExtractedQuoteItem } from './types'

const MATCH_THRESHOLD = 0.3

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
  requestItems: ComparisonRequestItemRow[],
): ExtractedItemReview[] {
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
