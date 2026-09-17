import { getUrgencyTier, type UrgencyTier } from './getUrgencyTier'
import { formatRequestNumber } from './formatRequestNumber'
import type { RequestRow, RequestStatus } from './types'

export const ANALYSIS_STATUSES: RequestStatus[] = [
  'pending_review',
  'clarification_requested',
  'extension_requested',
]

export interface FilterAnalysisRequestsOptions {
  search: string
  unitId: string | null
  tier: UrgencyTier | null
  today: Date
}

export function filterAnalysisRequests(
  requests: RequestRow[],
  { search, unitId, tier, today }: FilterAnalysisRequestsOptions,
): RequestRow[] {
  const normalizedSearch = search.trim().toLowerCase()

  return requests.filter((request) => {
    if (!ANALYSIS_STATUSES.includes(request.status)) return false
    if (unitId && request.unitId !== unitId) return false
    if (tier && getUrgencyTier(request.neededBy, today).tier !== tier) return false
    if (normalizedSearch) {
      const displayNumber = formatRequestNumber(request.externalRef, request.sequenceNumber)
      const matchesNumber = displayNumber.toLowerCase().includes(normalizedSearch)
      const matchesUnit = request.unitName.toLowerCase().includes(normalizedSearch)
      const matchesMaterial = request.items.some((item) =>
        item.materialName.toLowerCase().includes(normalizedSearch),
      )
      if (!matchesNumber && !matchesUnit && !matchesMaterial) return false
    }
    return true
  })
}
